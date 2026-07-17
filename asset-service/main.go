package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

// =============================================================================
// Config — read from environment, log active providers at startup
// =============================================================================

type Config struct {
	WebCheckAPIURL  string
	RedisURL        string
	ShodanAPIKey    string
	VTAPIKey        string
	AbuseIPDBAPIKey string
	OTXAPIKey       string
	NVDAPIKey       string
}

func loadConfig() Config {
	cfg := Config{
		WebCheckAPIURL:  getEnv("WEBCHECK_API_URL", ""),
		RedisURL:        getEnv("REDIS_URL", "redis://localhost:6379"),
		ShodanAPIKey:    os.Getenv("SHODAN_API_KEY"),
		VTAPIKey:        os.Getenv("VT_API_KEY"),
		AbuseIPDBAPIKey: os.Getenv("ABUSEIPDB_API_KEY"),
		OTXAPIKey:       os.Getenv("OTX_API_KEY"),
		NVDAPIKey:       os.Getenv("NVD_API_KEY"),
	}

	log.Println("=== Asset Service Provider Status ===")
	logProvider("web-check-api", cfg.WebCheckAPIURL != "")
	logProvider("Shodan", cfg.ShodanAPIKey != "")
	logProvider("VirusTotal", cfg.VTAPIKey != "")
	logProvider("AbuseIPDB", cfg.AbuseIPDBAPIKey != "")
	logProvider("AlienVault OTX", cfg.OTXAPIKey != "")
	logProvider("NVD/CVE", true) // crt.sh and NVD public are always available
	log.Println("crt.sh — ACTIVE (no key required)")
	log.Println("=====================================")

	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func logProvider(name string, active bool) {
	if active {
		log.Printf("%s — ACTIVE\n", name)
	} else {
		log.Printf("%s — DISABLED (no API key)\n", name)
	}
}

// =============================================================================
// Types — matches OSINTResult Mongoose schema shape
// =============================================================================

type SearchRequest struct {
	Query           string `json:"query"`
	QueryType       string `json:"queryType"`
	InvestigationId string `json:"investigationId"`
}

type SearchResponse struct {
	Results []map[string]interface{} `json:"results"`
}

// NormalizedResult mirrors the OSINTResult Mongoose schema.
// Severity values must be one of: critical | high | medium | low | info
type NormalizedResult struct {
	Source    string                 `json:"source"`
	QueryType string                 `json:"queryType"`
	Query     string                 `json:"query"`
	Category  string                 `json:"category"`
	Severity  string                 `json:"severity,omitempty"`
	Title     string                 `json:"title"`
	Snippet   string                 `json:"snippet"`
	URL       string                 `json:"url"`
	RiskScore int                    `json:"riskScore"`
	Tags      []string               `json:"tags"`
	Data      map[string]interface{} `json:"data"`
	FetchedAt time.Time              `json:"fetchedAt"`
}

// toMap converts a NormalizedResult to the map shape the frontend expects.
func (r NormalizedResult) toMap() map[string]interface{} {
	return map[string]interface{}{
		"source":    r.Source,
		"queryType": r.QueryType,
		"query":     r.Query,
		"category":  r.Category,
		"severity":  r.Severity,
		"title":     r.Title,
		"snippet":   r.Snippet,
		"url":       r.URL,
		"riskScore": r.RiskScore,
		"tags":      r.Tags,
		"data":      r.Data,
		"fetchedAt": r.FetchedAt,
	}
}

// =============================================================================
// Redis client + caching helpers
// =============================================================================

var rdb *redis.Client

// TTL per check category
var categoryTTL = map[string]time.Duration{
	"dns":        24 * time.Hour,
	"ssl":        24 * time.Hour,
	"whois":      24 * time.Hour,
	"headers":    12 * time.Hour,
	"tech":       12 * time.Hour,
	"redirects":  12 * time.Hour,
	"ports":      2 * time.Hour,
	"reputation": 2 * time.Hour,
	"threat":     2 * time.Hour,
	"subdomain":  6 * time.Hour,
	"cve":        24 * time.Hour,
}

func cacheKey(category, queryType, query string) string {
	return fmt.Sprintf("webcheck:%s:%s:%s", category, queryType, strings.ToLower(query))
}

func cacheGet(ctx context.Context, key string) ([]NormalizedResult, bool) {
	if rdb == nil {
		return nil, false
	}
	val, err := rdb.Get(ctx, key).Result()
	if err != nil {
		return nil, false
	}
	var results []NormalizedResult
	if err := json.Unmarshal([]byte(val), &results); err != nil {
		return nil, false
	}
	return results, true
}

func cacheSet(ctx context.Context, key, category string, results []NormalizedResult) {
	if rdb == nil || len(results) == 0 {
		return
	}
	ttl, ok := categoryTTL[category]
	if !ok {
		ttl = 2 * time.Hour
	}
	data, err := json.Marshal(results)
	if err != nil {
		return
	}
	rdb.Set(ctx, key, data, ttl)
}

// =============================================================================
// HTTP helper
// =============================================================================

var httpClient = &http.Client{Timeout: 10 * time.Second}

func getJSON(ctx context.Context, reqURL string, headers map[string]string) (map[string]interface{}, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, 0, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, 429, fmt.Errorf("rate limited by provider")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, fmt.Errorf("provider returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20)) // 2MB max
	if err != nil {
		return nil, resp.StatusCode, err
	}
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, resp.StatusCode, err
	}
	return result, resp.StatusCode, nil
}

func getJSONArray(ctx context.Context, reqURL string, headers map[string]string) ([]interface{}, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, 0, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, 429, fmt.Errorf("rate limited by provider")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, fmt.Errorf("provider returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20)) // 4MB max
	if err != nil {
		return nil, resp.StatusCode, err
	}
	var result []interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, resp.StatusCode, err
	}
	return result, resp.StatusCode, nil
}

func strVal(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func floatVal(m map[string]interface{}, key string) float64 {
	if v, ok := m[key]; ok {
		switch n := v.(type) {
		case float64:
			return n
		case int:
			return float64(n)
		}
	}
	return 0
}

// =============================================================================
// Provider: web-check-api
// web-check-api endpoints: GET /api/{check}?url={domain}
// =============================================================================

var webCheckEndpoints = []struct {
	check    string
	category string
}{
	{"dns", "dns"},
	{"ssl", "ssl"},
	{"whois", "whois"},
	{"headers", "headers"},
	{"tech-stack", "tech"},
	{"redirects", "redirects"},
	{"ports", "ports"},
	{"threats", "threat"},
	{"dns-sec", "dns"},
}

func fetchWebCheck(ctx context.Context, cfg Config, query, category, check string) ([]NormalizedResult, error) {
	if cfg.WebCheckAPIURL == "" {
		return nil, fmt.Errorf("web-check-api not configured")
	}
	endpoint := fmt.Sprintf("%s/api/%s?url=%s", cfg.WebCheckAPIURL, check, url.QueryEscape(query))
	raw, status, err := getJSON(ctx, endpoint, nil)
	if err != nil {
		if status == 429 {
			log.Printf("[web-check:%s] rate limited, skipping", check)
		} else {
			log.Printf("[web-check:%s] error: %v", check, err)
		}
		return nil, err
	}
	return normalizeWebCheck(query, check, category, raw), nil
}

func normalizeWebCheck(query, check, category string, raw map[string]interface{}) []NormalizedResult {
	if raw == nil {
		return nil
	}

	severity := "info"
	riskScore := 10
	title := fmt.Sprintf("web-check: %s for %s", strings.ToUpper(check), query)
	snippet := ""
	tags := []string{check, "web-check"}

	// Per-check normalization for meaningful snippet/severity
	switch check {
	case "ssl":
		if valid, ok := raw["isValid"].(bool); ok && !valid {
			severity = "high"
			riskScore = 75
			snippet = "SSL certificate is invalid or untrusted."
		} else {
			snippet = fmt.Sprintf("SSL certificate valid. Issuer: %s", strVal(raw, "issuer"))
		}
	case "dns":
		if records, ok := raw["answer"].([]interface{}); ok {
			snippet = fmt.Sprintf("%d DNS records found", len(records))
		} else {
			snippet = "DNS records retrieved"
		}
	case "threats":
		if isMalicious, ok := raw["isMalicious"].(bool); ok && isMalicious {
			severity = "critical"
			riskScore = 95
			snippet = "Domain flagged as malicious by web-check threat intelligence."
			tags = append(tags, "malicious")
		} else {
			snippet = "No active threats detected by web-check."
		}
	case "ports":
		if ports, ok := raw["ports"].([]interface{}); ok {
			snippet = fmt.Sprintf("%d open ports detected", len(ports))
			if len(ports) > 10 {
				severity = "medium"
				riskScore = 50
			}
		}
	case "whois":
		snippet = fmt.Sprintf("Registrar: %s", strVal(raw, "registrar"))
		if snippet == "Registrar: " {
			snippet = "WHOIS record retrieved"
		}
	case "headers":
		snippet = "HTTP response headers retrieved"
		// Flag missing security headers
		if _, hasCSP := raw["content-security-policy"]; !hasCSP {
			severity = "low"
			riskScore = 25
			snippet = "Missing security headers detected (e.g., Content-Security-Policy)"
			tags = append(tags, "missing-headers")
		}
	case "tech-stack":
		if techs, ok := raw["technologies"].([]interface{}); ok {
			snippet = fmt.Sprintf("%d technologies detected", len(techs))
		} else {
			snippet = "Technology stack analyzed"
		}
	default:
		snippet = fmt.Sprintf("%s analysis completed for %s", check, query)
	}

	return []NormalizedResult{{
		Source:    fmt.Sprintf("web-check:%s", check),
		QueryType: "domain",
		Query:     query,
		Category:  category,
		Severity:  severity,
		Title:     title,
		Snippet:   snippet,
		URL:       fmt.Sprintf("https://%s", query),
		RiskScore: riskScore,
		Tags:      tags,
		Data:      raw,
		FetchedAt: time.Now(),
	}}
}

// =============================================================================
// Provider: crt.sh (certificate transparency, no API key needed)
// GET https://crt.sh/?q={domain}&output=json
// =============================================================================

func fetchCrtSh(ctx context.Context, query string) ([]NormalizedResult, error) {
	reqURL := fmt.Sprintf("https://crt.sh/?q=%s&output=json", url.QueryEscape(query))
	records, status, err := getJSONArray(ctx, reqURL, nil)
	if err != nil {
		if status == 429 {
			log.Println("[crt.sh] rate limited, skipping")
		} else {
			log.Printf("[crt.sh] error: %v", err)
		}
		return nil, err
	}
	return normalizeCrtSh(query, records), nil
}

func normalizeCrtSh(query string, records []interface{}) []NormalizedResult {
	if len(records) == 0 {
		return nil
	}

	// Collect unique subdomains
	seen := map[string]bool{}
	var subdomains []string
	for _, rec := range records {
		if m, ok := rec.(map[string]interface{}); ok {
			name := strVal(m, "name_value")
			for _, sub := range strings.Split(name, "\n") {
				sub = strings.TrimSpace(sub)
				if sub != "" && !seen[sub] {
					seen[sub] = true
					subdomains = append(subdomains, sub)
				}
			}
		}
	}

	snippet := fmt.Sprintf("%d unique subdomains/certificate entries found via certificate transparency logs", len(subdomains))
	severity := "info"
	riskScore := 15
	if len(subdomains) > 50 {
		severity = "medium"
		riskScore = 40
	}

	return []NormalizedResult{{
		Source:    "crt.sh",
		QueryType: "domain",
		Query:     query,
		Category:  "subdomain",
		Severity:  severity,
		Title:     fmt.Sprintf("Certificate Transparency: %d entries for %s", len(records), query),
		Snippet:   snippet,
		URL:       fmt.Sprintf("https://crt.sh/?q=%s", url.QueryEscape(query)),
		RiskScore: riskScore,
		Tags:      []string{"subdomains", "ssl", "certificate-transparency"},
		Data: map[string]interface{}{
			"total":      len(records),
			"subdomains": subdomains,
		},
		FetchedAt: time.Now(),
	}}
}

// =============================================================================
// Provider: Shodan (IP queries only)
// GET https://api.shodan.io/shodan/host/{ip}?key={key}
// =============================================================================

func fetchShodan(ctx context.Context, cfg Config, query string) ([]NormalizedResult, error) {
	if cfg.ShodanAPIKey == "" {
		return nil, fmt.Errorf("shodan not configured")
	}
	reqURL := fmt.Sprintf("https://api.shodan.io/shodan/host/%s?key=%s", url.QueryEscape(query), cfg.ShodanAPIKey)
	raw, status, err := getJSON(ctx, reqURL, nil)
	if err != nil {
		if status == 429 {
			log.Println("[shodan] rate limited, skipping")
		} else {
			log.Printf("[shodan] error: %v", err)
		}
		return nil, err
	}
	return normalizeShodan(query, raw), nil
}

func normalizeShodan(query string, raw map[string]interface{}) []NormalizedResult {
	if raw == nil {
		return nil
	}

	ports := []interface{}{}
	if p, ok := raw["ports"].([]interface{}); ok {
		ports = p
	}
	org := strVal(raw, "org")
	country := strVal(raw, "country_name")
	vulns := map[string]interface{}{}
	if v, ok := raw["vulns"].(map[string]interface{}); ok {
		vulns = v
	}

	severity := "info"
	riskScore := 20
	tags := []string{"shodan", "ports", "infrastructure"}

	if len(vulns) > 0 {
		severity = "high"
		riskScore = 80
		tags = append(tags, "vulnerabilities")
	} else if len(ports) > 15 {
		severity = "medium"
		riskScore = 50
	} else if len(ports) > 5 {
		severity = "low"
		riskScore = 30
	}

	snippet := fmt.Sprintf("%d open ports detected. Org: %s, Country: %s", len(ports), org, country)
	if len(vulns) > 0 {
		snippet = fmt.Sprintf("%d known vulnerabilities detected across %d open ports. Org: %s", len(vulns), len(ports), org)
	}

	return []NormalizedResult{{
		Source:    "Shodan",
		QueryType: "ip",
		Query:     query,
		Category:  "ports",
		Severity:  severity,
		Title:     fmt.Sprintf("Shodan: %s — %d open ports", query, len(ports)),
		Snippet:   snippet,
		URL:       fmt.Sprintf("https://www.shodan.io/host/%s", query),
		RiskScore: riskScore,
		Tags:      tags,
		Data:      raw,
		FetchedAt: time.Now(),
	}}
}

// =============================================================================
// Provider: VirusTotal (domain and IP)
// GET https://www.virustotal.com/api/v3/domains/{domain}
// GET https://www.virustotal.com/api/v3/ip_addresses/{ip}
// =============================================================================

func fetchVirusTotal(ctx context.Context, cfg Config, query, queryType string) ([]NormalizedResult, error) {
	if cfg.VTAPIKey == "" {
		return nil, fmt.Errorf("virustotal not configured")
	}

	var reqURL string
	switch queryType {
	case "ip":
		reqURL = fmt.Sprintf("https://www.virustotal.com/api/v3/ip_addresses/%s", url.QueryEscape(query))
	default:
		reqURL = fmt.Sprintf("https://www.virustotal.com/api/v3/domains/%s", url.QueryEscape(query))
	}

	raw, status, err := getJSON(ctx, reqURL, map[string]string{"x-apikey": cfg.VTAPIKey})
	if err != nil {
		if status == 429 {
			log.Println("[virustotal] rate limited, skipping")
		} else {
			log.Printf("[virustotal] error: %v", err)
		}
		return nil, err
	}
	return normalizeVirusTotal(query, queryType, raw), nil
}

func normalizeVirusTotal(query, queryType string, raw map[string]interface{}) []NormalizedResult {
	if raw == nil {
		return nil
	}

	attrs := map[string]interface{}{}
	if data, ok := raw["data"].(map[string]interface{}); ok {
		if a, ok := data["attributes"].(map[string]interface{}); ok {
			attrs = a
		}
	}

	malicious := 0
	suspicious := 0
	harmless := 0

	if stats, ok := attrs["last_analysis_stats"].(map[string]interface{}); ok {
		malicious = int(floatVal(stats, "malicious"))
		suspicious = int(floatVal(stats, "suspicious"))
		harmless = int(floatVal(stats, "harmless"))
	}

	severity := "info"
	riskScore := 10
	tags := []string{"virustotal", "reputation"}

	if malicious >= 5 {
		severity = "critical"
		riskScore = 95
		tags = append(tags, "malicious")
	} else if malicious >= 1 || suspicious >= 3 {
		severity = "high"
		riskScore = 75
		tags = append(tags, "suspicious")
	} else if suspicious >= 1 {
		severity = "medium"
		riskScore = 45
	} else if harmless > 0 {
		severity = "info"
		riskScore = 5
		tags = append(tags, "clean")
	}

	snippet := fmt.Sprintf("VirusTotal analysis: %d malicious, %d suspicious, %d harmless detections", malicious, suspicious, harmless)

	vtURL := fmt.Sprintf("https://www.virustotal.com/gui/domain/%s", query)
	if queryType == "ip" {
		vtURL = fmt.Sprintf("https://www.virustotal.com/gui/ip-address/%s", query)
	}

	return []NormalizedResult{{
		Source:    "VirusTotal",
		QueryType: queryType,
		Query:     query,
		Category:  "reputation",
		Severity:  severity,
		Title:     fmt.Sprintf("VirusTotal Reputation: %s", query),
		Snippet:   snippet,
		URL:       vtURL,
		RiskScore: riskScore,
		Tags:      tags,
		Data:      attrs,
		FetchedAt: time.Now(),
	}}
}

// =============================================================================
// Provider: AbuseIPDB (IP queries only)
// GET https://api.abuseipdb.com/api/v2/check?ipAddress={ip}&maxAgeInDays=90
// =============================================================================

func fetchAbuseIPDB(ctx context.Context, cfg Config, query string) ([]NormalizedResult, error) {
	if cfg.AbuseIPDBAPIKey == "" {
		return nil, fmt.Errorf("abuseipdb not configured")
	}
	reqURL := fmt.Sprintf("https://api.abuseipdb.com/api/v2/check?ipAddress=%s&maxAgeInDays=90", url.QueryEscape(query))
	raw, status, err := getJSON(ctx, reqURL, map[string]string{
		"Key":    cfg.AbuseIPDBAPIKey,
		"Accept": "application/json",
	})
	if err != nil {
		if status == 429 {
			log.Println("[abuseipdb] rate limited, skipping")
		} else {
			log.Printf("[abuseipdb] error: %v", err)
		}
		return nil, err
	}
	return normalizeAbuseIPDB(query, raw), nil
}

func normalizeAbuseIPDB(query string, raw map[string]interface{}) []NormalizedResult {
	if raw == nil {
		return nil
	}

	data := map[string]interface{}{}
	if d, ok := raw["data"].(map[string]interface{}); ok {
		data = d
	}

	score := int(floatVal(data, "abuseConfidenceScore"))
	reports := int(floatVal(data, "totalReports"))
	isp := strVal(data, "isp")
	country := strVal(data, "countryCode")

	severity := "info"
	riskScore := score
	tags := []string{"abuseipdb", "ip-reputation"}

	if score >= 80 {
		severity = "critical"
		tags = append(tags, "high-abuse")
	} else if score >= 50 {
		severity = "high"
		tags = append(tags, "moderate-abuse")
	} else if score >= 25 {
		severity = "medium"
	} else if score >= 5 {
		severity = "low"
	}

	snippet := fmt.Sprintf("Abuse confidence: %d%%. %d reports in last 90 days. ISP: %s, Country: %s", score, reports, isp, country)

	return []NormalizedResult{{
		Source:    "AbuseIPDB",
		QueryType: "ip",
		Query:     query,
		Category:  "reputation",
		Severity:  severity,
		Title:     fmt.Sprintf("AbuseIPDB: %s — %d%% abuse confidence", query, score),
		Snippet:   snippet,
		URL:       fmt.Sprintf("https://www.abuseipdb.com/check/%s", query),
		RiskScore: riskScore,
		Tags:      tags,
		Data:      data,
		FetchedAt: time.Now(),
	}}
}

// =============================================================================
// Provider: AlienVault OTX (domain and IP)
// GET https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general
// GET https://otx.alienvault.com/api/v1/indicators/IPv4/{ip}/general
// =============================================================================

func fetchOTX(ctx context.Context, cfg Config, query, queryType string) ([]NormalizedResult, error) {
	if cfg.OTXAPIKey == "" {
		return nil, fmt.Errorf("otx not configured")
	}

	var reqURL string
	switch queryType {
	case "ip":
		reqURL = fmt.Sprintf("https://otx.alienvault.com/api/v1/indicators/IPv4/%s/general", url.QueryEscape(query))
	default:
		reqURL = fmt.Sprintf("https://otx.alienvault.com/api/v1/indicators/domain/%s/general", url.QueryEscape(query))
	}

	raw, status, err := getJSON(ctx, reqURL, map[string]string{"X-OTX-API-KEY": cfg.OTXAPIKey})
	if err != nil {
		if status == 429 {
			log.Println("[otx] rate limited, skipping")
		} else {
			log.Printf("[otx] error: %v", err)
		}
		return nil, err
	}
	return normalizeOTX(query, queryType, raw), nil
}

func normalizeOTX(query, queryType string, raw map[string]interface{}) []NormalizedResult {
	if raw == nil {
		return nil
	}

	pulseCount := int(floatVal(raw, "pulse_info_count"))
	if pc, ok := raw["pulse_info"].(map[string]interface{}); ok {
		if cnt, ok := pc["count"].(float64); ok {
			pulseCount = int(cnt)
		}
	}

	malwareCount := int(floatVal(raw, "malware_count"))
	urlCount := int(floatVal(raw, "url_list_count"))

	severity := "info"
	riskScore := 10
	tags := []string{"otx", "threat-intel"}

	if pulseCount >= 10 || malwareCount >= 3 {
		severity = "critical"
		riskScore = 90
		tags = append(tags, "ioc", "threat")
	} else if pulseCount >= 5 || malwareCount >= 1 {
		severity = "high"
		riskScore = 70
		tags = append(tags, "ioc")
	} else if pulseCount >= 1 {
		severity = "medium"
		riskScore = 40
		tags = append(tags, "watchlist")
	}

	snippet := fmt.Sprintf("Found in %d OTX threat intelligence pulses. %d malware samples, %d associated URLs", pulseCount, malwareCount, urlCount)

	otxURL := fmt.Sprintf("https://otx.alienvault.com/indicator/domain/%s", query)
	if queryType == "ip" {
		otxURL = fmt.Sprintf("https://otx.alienvault.com/indicator/ip/%s", query)
	}

	return []NormalizedResult{{
		Source:    "AlienVault OTX",
		QueryType: queryType,
		Query:     query,
		Category:  "threat",
		Severity:  severity,
		Title:     fmt.Sprintf("OTX Threat Intelligence: %s", query),
		Snippet:   snippet,
		URL:       otxURL,
		RiskScore: riskScore,
		Tags:      tags,
		Data:      raw,
		FetchedAt: time.Now(),
	}}
}

// =============================================================================
// Fan-out orchestrator: run all applicable providers concurrently
// =============================================================================

func runSearch(cfg Config, req SearchRequest) []NormalizedResult {
	var mu sync.Mutex
	var wg sync.WaitGroup
	var allResults []NormalizedResult

	addResults := func(results []NormalizedResult) {
		if len(results) == 0 {
			return
		}
		mu.Lock()
		allResults = append(allResults, results...)
		mu.Unlock()
	}

	// Determine which providers to call based on queryType
	queryType := strings.ToLower(req.QueryType)
	query := strings.TrimSpace(req.Query)

	// --- Domain queries ---
	if queryType == "domain" || queryType == "general" || queryType == "" {
		// web-check-api: fan across each check endpoint
		for _, ep := range webCheckEndpoints {
			ep := ep // capture loop variable
			cKey := cacheKey(ep.category, queryType, query)
			if cached, ok := cacheGet(context.Background(), cKey); ok {
				log.Printf("[cache HIT] %s", cKey)
				addResults(cached)
				continue
			}
			wg.Add(1)
			go func() {
				defer wg.Done()
				ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
				defer cancel()
				results, err := fetchWebCheck(ctx, cfg, query, ep.category, ep.check)
				if err == nil && len(results) > 0 {
					cacheSet(context.Background(), cKey, ep.category, results)
					addResults(results)
				}
			}()
		}

		// crt.sh (always active for domains)
		crtKey := cacheKey("subdomain", queryType, query)
		if cached, ok := cacheGet(context.Background(), crtKey); ok {
			log.Printf("[cache HIT] %s", crtKey)
			addResults(cached)
		} else {
			wg.Add(1)
			go func() {
				defer wg.Done()
				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				results, err := fetchCrtSh(ctx, query)
				if err == nil && len(results) > 0 {
					cacheSet(context.Background(), crtKey, "subdomain", results)
					addResults(results)
				}
			}()
		}

		// VirusTotal for domains
		if cfg.VTAPIKey != "" {
			vtKey := cacheKey("reputation", queryType, query)
			if cached, ok := cacheGet(context.Background(), vtKey); ok {
				log.Printf("[cache HIT] %s", vtKey)
				addResults(cached)
			} else {
				wg.Add(1)
				go func() {
					defer wg.Done()
					ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
					defer cancel()
					results, err := fetchVirusTotal(ctx, cfg, query, queryType)
					if err == nil && len(results) > 0 {
						cacheSet(context.Background(), vtKey, "reputation", results)
						addResults(results)
					}
				}()
			}
		}

		// OTX for domains
		if cfg.OTXAPIKey != "" {
			otxKey := cacheKey("threat", queryType, query)
			if cached, ok := cacheGet(context.Background(), otxKey); ok {
				log.Printf("[cache HIT] %s", otxKey)
				addResults(cached)
			} else {
				wg.Add(1)
				go func() {
					defer wg.Done()
					ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
					defer cancel()
					results, err := fetchOTX(ctx, cfg, query, queryType)
					if err == nil && len(results) > 0 {
						cacheSet(context.Background(), otxKey, "threat", results)
						addResults(results)
					}
				}()
			}
		}
	}

	// --- IP queries ---
	if queryType == "ip" {
		// Shodan
		if cfg.ShodanAPIKey != "" {
			shodanKey := cacheKey("ports", queryType, query)
			if cached, ok := cacheGet(context.Background(), shodanKey); ok {
				log.Printf("[cache HIT] %s", shodanKey)
				addResults(cached)
			} else {
				wg.Add(1)
				go func() {
					defer wg.Done()
					ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
					defer cancel()
					results, err := fetchShodan(ctx, cfg, query)
					if err == nil && len(results) > 0 {
						cacheSet(context.Background(), shodanKey, "ports", results)
						addResults(results)
					}
				}()
			}
		}

		// AbuseIPDB
		if cfg.AbuseIPDBAPIKey != "" {
			abuseKey := cacheKey("reputation", queryType, query)
			if cached, ok := cacheGet(context.Background(), abuseKey); ok {
				log.Printf("[cache HIT] %s", abuseKey)
				addResults(cached)
			} else {
				wg.Add(1)
				go func() {
					defer wg.Done()
					ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
					defer cancel()
					results, err := fetchAbuseIPDB(ctx, cfg, query)
					if err == nil && len(results) > 0 {
						cacheSet(context.Background(), abuseKey, "reputation", results)
						addResults(results)
					}
				}()
			}
		}

		// VirusTotal for IPs
		if cfg.VTAPIKey != "" {
			vtKey := cacheKey("reputation", queryType, query)
			if cached, ok := cacheGet(context.Background(), vtKey); ok {
				log.Printf("[cache HIT] %s", vtKey)
				addResults(cached)
			} else {
				wg.Add(1)
				go func() {
					defer wg.Done()
					ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
					defer cancel()
					results, err := fetchVirusTotal(ctx, cfg, query, queryType)
					if err == nil && len(results) > 0 {
						cacheSet(context.Background(), vtKey, "reputation", results)
						addResults(results)
					}
				}()
			}
		}

		// OTX for IPs
		if cfg.OTXAPIKey != "" {
			otxKey := cacheKey("threat", queryType, query)
			if cached, ok := cacheGet(context.Background(), otxKey); ok {
				log.Printf("[cache HIT] %s", otxKey)
				addResults(cached)
			} else {
				wg.Add(1)
				go func() {
					defer wg.Done()
					ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
					defer cancel()
					results, err := fetchOTX(ctx, cfg, query, queryType)
					if err == nil && len(results) > 0 {
						cacheSet(context.Background(), otxKey, "threat", results)
						addResults(results)
					}
				}()
			}
		}
	}

	// Wait for all goroutines
	wg.Wait()
	return allResults
}

// =============================================================================
// HTTP Handler
// =============================================================================

var globalCfg Config

func searchHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Query) == "" {
		http.Error(w, "query is required", http.StatusBadRequest)
		return
	}

	log.Printf("[search] query=%q queryType=%q", req.Query, req.QueryType)

	normalized := runSearch(globalCfg, req)

	// Convert to map slice (the contract the Next.js route expects)
	results := make([]map[string]interface{}, 0, len(normalized))
	for _, r := range normalized {
		results = append(results, r.toMap())
	}

	resp := SearchResponse{Results: results}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)

	log.Printf("[search] query=%q returned %d results", req.Query, len(results))
}

// =============================================================================
// Main
// =============================================================================

func main() {
	globalCfg = loadConfig()

	// Initialize Redis client
	opts, err := redis.ParseURL(globalCfg.RedisURL)
	if err != nil {
		log.Printf("[redis] failed to parse Redis URL %q: %v — caching disabled", globalCfg.RedisURL, err)
	} else {
		rdb = redis.NewClient(opts)
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := rdb.Ping(ctx).Err(); err != nil {
			log.Printf("[redis] ping failed: %v — caching disabled", err)
			rdb = nil
		} else {
			log.Println("[redis] connected successfully")
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/v1/search", searchHandler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Kaal Bhairav Asset Service — OSINT Aggregator"))
	})

	server := &http.Server{
		Addr:    ":50051",
		Handler: mux,
	}

	// Server run context
	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	// Listen for syscall signals for process to interrupt/terminate
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		log.Printf("[%s] Initiating graceful shutdown...", sig.String())

		shutdownCtx, shutdownCancel := context.WithTimeout(serverCtx, 10*time.Second)
		defer shutdownCancel()

		go func() {
			<-shutdownCtx.Done()
			if shutdownCtx.Err() == context.DeadlineExceeded {
				log.Fatal("Shutdown deadline exceeded, forcing exit.")
			}
		}()

		// Trigger shutdown
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}

		if rdb != nil {
			if err := rdb.Close(); err != nil {
				log.Printf("Redis client close error: %v", err)
			} else {
				log.Println("Redis client connection closed.")
			}
		}

		serverStopCtx()
	}()

	log.Println("Asset service listening on :50051")
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("Server failed to listen: %v", err)
	}

	<-serverCtx.Done()
	log.Println("Asset service shut down successfully.")
}

