package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type SearchRequest struct {
	Query           string `json:"query"`
	QueryType       string `json:"queryType"`
	InvestigationId string `json:"investigationId"`
}

type SearchResponse struct {
	Results []map[string]interface{} `json:"results"`
}

func main() {
	http.HandleFunc("/v1/search", searchHandler)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Go Scheduler & Search Service is running"))
	})

	log.Println("Go service listening on :50051")
	log.Fatal(http.ListenAndServe(":50051", nil))
}

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

	// Stubbed response for API Gateway fallback verification
	resp := SearchResponse{
		Results: []map[string]interface{}{
			{
				"id":     "stub-1",
				"source": "go-microservice",
				"data":   "This is a stub result from the high-performance Go backend.",
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
