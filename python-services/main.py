from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Kaal Bhairav AI Copilot Service")

class SearchQuery(BaseModel):
    query: str
    queryType: str
    investigationId: str = None

@app.get("/")
def read_root():
    return {"status": "AI Copilot Service is running"}

@app.post("/v1/analyze")
def analyze_threat(query: SearchQuery):
    # Stub for AI analysis
    return {
        "analysis": f"AI analysis stub for {query.query}",
        "confidence": 0.85,
        "mitre_tactics": ["TA0001", "TA0002"]
    }
