<div align="center">
  <img src="public/dashboard-logo.png" alt="Kaal Bhairav Logo" width="100"/>
  <h1 align="center">Kaal Bhairav OSINT & Security Operations Platform</h1>
  <p align="center">
    <strong>Production-Grade Open Source Intelligence, Cyber Threat Hunting, & Surveillance Platform</strong>
  </p>
  <p>
    <a href="#overview">Overview</a> •
    <a href="#key-features">Key Features</a> •
    <a href="#system-architecture">Architecture</a> •
    <a href="#technology-stack">Tech Stack</a> •
    <a href="#module-breakdown">Modules</a> •
    <a href="#installation--setup">Setup</a>
  </p>
</div>

---

## 📖 Overview

**Kaal Bhairav** is an industry-grade, highly scalable, and modular web application designed for Cyber Threat Intelligence (CTI), Open Source Intelligence (OSINT) gathering, network link analysis, and live surveillance monitoring. 

It provides SOC analysts, threat hunters, and cyber-intelligence professionals with a unified interface to monitor targets, analyze threat intelligence feeds, map out malicious network infrastructures, and view real-time CCTV streams. Moving beyond a standard monolithic architecture, Kaal Bhairav employs a **Polyglot Event-Driven Microservices** architecture for extreme performance, flexibility, and scalability—making it comparable to enterprise solutions like CrowdStrike Falcon or Elastic Security.

---

## ✨ Key Features

- **🕸️ OSINT & Web-Check Integration:** Transparently integrated intelligence aggregation combining Shodan, Censys, Whois, VirusTotal, and more into unified threat reports.
- **🎥 Live Camera Intelligence Module:** Real-time CCTV streaming with multi-camera WebRTC/RTSP support, object/motion detection powered by a highly concurrent Rust processing engine.
- **🗺️ Advanced Threat Mapping (GIS):** Professional threat intelligence maps utilizing MapLibre and Leaflet to visualize active incidents, malware campaigns, and asset telemetry.
- **🤖 AI Security Copilot:** A multi-LLM (OpenAI, Claude, Llama) abstraction layer capable of interpreting threat data, summarizing investigations, and guiding incident response workflows via natural language.
- **🔌 Pluggable Architecture:** A robust plugin manager designed to dynamically load external scanners, recon modules, and custom visualization tools without modifying the core system.
- **🛡️ Live Threat Feed Connectors:** Ingest normalized indicators of compromise (IOCs) from MITRE ATT&CK, CVE/NVD, AbuseIPDB, MISP, and AlienVault OTX.
- **🔒 Zero-Trust Security Model:** Implements stringent Role-Based Access Control (RBAC), stateless JWT authentication, and secure inter-service gRPC communication.

---

## 🏗️ System Architecture

Kaal Bhairav has been modernized into a distributed, event-driven polyglot microservice ecosystem to handle the immense throughput of intelligence gathering and stream processing.

### High-Level Topology

```mermaid
graph TD
    subgraph Client [Frontend Layer]
        UI[Next.js React Frontend]
    end

    subgraph GatewayLayer [API Gateway & Identity]
        Gateway["Gateway Service (Node.js/Fastify)"]
        UserSvc["User Service (Node.js/gRPC)"]
    end
    
    subgraph Microservices [Core Defensive Services]
        AssetSvc["asset-service (Go)"]
        CameraSvc["camera-service (Rust)"]
        AICopilot["ai-copilot-service (Python)"]
        OSINTSvc["osint-service (Python/Node)"]
    end

    subgraph MessageBroker [Event Bus]
        NATS["NATS JetStream"]
    end

    subgraph Database [Storage & Observability]
        DB[(MongoDB)]
        Redis[(Redis Cache)]
        Prom[Prometheus]
        Graf[Grafana]
    end

    %% Flow
    Client -- "REST / WebSocket" --> Gateway
    Gateway -- "gRPC" --> UserSvc
    Gateway -- "gRPC" --> AssetSvc
    Gateway -- "gRPC" --> AICopilot
    Gateway -- "gRPC" --> CameraSvc
    Gateway -- "gRPC" --> OSINTSvc
    
    UserSvc -- "Pub/Sub" --> NATS
    AssetSvc -- "Pub/Sub" --> NATS
    AICopilot -- "Pub/Sub" --> NATS
    CameraSvc -- "Pub/Sub" --> NATS

    UserSvc -- "Mongoose" --> DB
    AssetSvc -- "Mongoose" --> DB
    Gateway -- "Cache" --> Redis
```

### 1. API Gateway (Node.js / Fastify)
Acts as the ingress point. It translates standard REST and WebSocket requests from the frontend into highly optimized synchronous **gRPC** calls to the backend microservices. Handles robust rate limiting (to prevent brute force/DDoS attacks), global authentication decoding, Redis caching for heavy workloads (like AI analysis), and WebSocket hub routing.

### 2. Message Broker (NATS JetStream)
Facilitates asynchronous, event-driven communication across the platform. Handles massive broadcast events like `scan.completed`, `ioc.matched`, or `camera.motion_detected` enabling the microservices to remain deeply decoupled and independently scalable.

### 3. Polyglot Microservices
Each service is built using the most appropriate language for its domain:
- **Rust (`camera-service`)**: Handles CPU-intensive tasks like video stream decoding (FFmpeg/GStreamer), OpenCV processing, and bounding-box drawing with minimal latency.
- **Go (`asset-service`, `mapping-service`)**: Used for high-concurrency network scanning, GIS telemetry aggregation, and high-throughput HTTP endpoints.
- **Python (`ai-copilot-service`, `threat-intel-service`)**: Leverages the rich AI/ML and data-science ecosystems for language models, anomaly detection, and intelligence feed parsing.
- **Node.js (`user-service`, `gateway`)**: Manages identity, RBAC, session management, and orchestrates frontend requests.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router) + React 19
- **State Management:** Zustand, @tanstack/react-query
- **Styling & Animation:** Tailwind CSS v4, Framer Motion
- **Visuals:** Recharts, React-Leaflet, AG Grid

### Backend
- **Gateway:** Fastify (Node.js)
- **Service Interfaces:** Protocol Buffers (`.proto`) and gRPC
- **Microservices:** Rust (Tonic), Go (google.golang.org/grpc), Python (grpcio)

### Infrastructure & Data
- **Message Broker:** NATS JetStream
- **Databases:** MongoDB (Primary Data), Redis (Caching & Sessions)
- **Containerization:** Docker & Docker Compose
- **Observability:** Prometheus, Grafana, OpenTelemetry (Planned)

---

## 📂 Repository Structure

```text
advanced-mern-osint-application/
├── src/                    # Next.js Frontend App (UI, Components, Hooks)
├── gateway/                # Fastify API Gateway (REST -> gRPC bridge)
├── user-service/           # Node.js Identity & RBAC Service
├── asset-service/          # Go Service: Asset Discovery & Scanning
├── camera-service/         # Rust Service: Video Processing & Inference
├── ai-copilot-service/     # Python Service: LLM Abstraction & Chat
├── proto/                  # Shared Protobuf definitions (Single source of truth)
├── scripts/                # Utility and Database Seeding Scripts
├── docker-compose.yml      # Core infrastructure orchestration
└── README.md               # System Documentation
```

---

## ⚙️ Prerequisites

To run this platform locally for development, you will need:
- **Node.js** `v20.x` or higher
- **NPM** `v10.x` or higher
- **Docker Engine & Docker Compose** (Critical for standing up NATS, Redis, MongoDB, and polyglot containers)
- *(Optional)* **Rust Toolchain**, **Go 1.23+**, and **Python 3.11+** if you intend to run the microservices natively outside of Docker.

---

## 🚀 Installation & Setup

### 1. Clone & Install Dependencies
Clone the repository and install the frontend/utility dependencies:
```bash
git clone <repository-url>
cd advanced-mern-osint-application
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root of the project:
```env
# Database Connections
MONGODB_URI=mongodb://127.0.0.1:27017/osint
REDIS_URL=redis://127.0.0.1:6379

# Gateway & NATS
GATEWAY_PORT=4000
NATS_URL=nats://127.0.0.1:4222

# Security
JWT_SECRET=super_secret_jwt_key_kaal_bhairav_2026
```

### 3. Spin Up Core Infrastructure
Use Docker Compose to build and start the entire stack (Microservices, Gateway, NATS, Redis, MongoDB).
```bash
docker compose build
docker compose up -d
```
*Note: The first build will take some time as it compiles the Go and Rust binaries inside their respective containers.*

### 4. Start the Frontend Application
Run the Next.js development server:
```bash
npm run dev
```

The UI will be accessible at `http://localhost:3000` (or `http://localhost:3001` if port `3000` is utilized by the Grafana monitoring container). The frontend will communicate directly with the API Gateway running on port `4000`.

---

## 📅 Roadmap & Evolution

- [x] **Phase 1:** Core Infrastructure (gRPC, NATS, Microservice Stubs, API Gateway)
- [ ] **Phase 2:** OSINT & Web-Check Native Integration (Transparent analysis engine)
- [ ] **Phase 3:** Real-Time Camera Intelligence (RTSP/WebRTC + Rust Object Detection)
- [ ] **Phase 4:** Threat Intelligence Connectors & Background Schedulers
- [ ] **Phase 5:** AI Security Copilot (LLM Multi-Agent system)
- [ ] **Phase 6:** Production Hardening & Observability (OpenTelemetry, CI/CD)

---

## 📝 License

This project is intended for educational, demonstrative, and defensive security purposes. Users are strictly responsible for adhering to applicable laws and regulations when using OSINT and scanning tools against external infrastructure.

<p align="center">Developed with 💻 & ☕ for the Cyber Intelligence Community.</p>
