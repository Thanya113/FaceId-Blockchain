"""
FastAPI Server & REST API Gateway
HH Goa 2026 Shortlisting Task 3: Face Identification & Blockchain Verification.

Integrates Face Identification, Live Social Media Discovery, and
Tamper-Evident Cryptographic Blockchain Notarization & Re-Verification.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import os
import time
import base64

from backend.blockchain import Blockchain
from backend.face_engine import FaceEngine
from backend.search_engine import SearchEngine

app = FastAPI(
    title="HH Goa 2026: Face ID & Blockchain Verification Pipeline",
    version="1.0.0",
    description="End-to-end pipeline: Face Scan Input -> Social Media Search -> Blockchain Notarization & Re-Verification"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Services
blockchain = Blockchain(ledger_file="backend/data/blockchain_ledger.json", difficulty=2)
face_engine = FaceEngine(models_dir="backend/models")
search_engine = SearchEngine()


# --- Pydantic Request Models ---

class Base64DetectRequest(BaseModel):
    image_b64: str = Field(..., description="Base64 data URL or raw base64 string")

class SearchRequest(BaseModel):
    face_hash: str
    query_hint: Optional[str] = None
    image_b64: Optional[str] = None
    platform_filter: Optional[str] = "all"

class NotarizeRequest(BaseModel):
    face_hash: str
    post_url: str
    platform: str
    post_author: str
    post_title: str
    confidence: float
    metadata: Optional[Dict[str, Any]] = None

class VerifyRequest(BaseModel):
    record_hash: str

class TamperSimulationRequest(BaseModel):
    block_index: int
    field_to_alter: Optional[str] = "post_url"
    altered_value: Optional[str] = "https://malicious-spoofed-url.com/fake-post"


# --- API Endpoints ---

@app.get("/api/status")
async def get_system_status():
    """Returns system health, blockchain ledger summary, and verification status."""
    summary = blockchain.get_chain_summary()
    return {
        "status": "ONLINE",
        "timestamp": time.time(),
        "project": "HH Goa 2026 Shortlisting Task 3",
        "blockchain": summary,
        "models_cached": os.path.exists(face_engine.face_cascade_path)
    }


@app.post("/api/face/detect")
async def detect_face_from_upload(
    file: Optional[UploadFile] = File(None),
    image_b64: Optional[str] = Form(None)
):
    """
    Step 1: Face Identification
    Detects face bounding box, facial landmarks, and computes 128-d biometric embedding and SHA-256 fingerprint.
    Accepts multipart file upload or form/json base64.
    """
    try:
        if file is not None:
            contents = await file.read()
            result = face_engine.detect_and_encode(contents)
        elif image_b64:
            result = face_engine.detect_and_encode(image_b64)
        else:
            raise HTTPException(status_code=400, detail="Either 'file' or 'image_b64' must be provided")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face identification failed: {str(e)}")


@app.post("/api/face/detect-json")
async def detect_face_from_json(payload: Base64DetectRequest):
    """Alternative JSON endpoint for base64 face detection."""
    try:
        return face_engine.detect_and_encode(payload.image_b64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face identification failed: {str(e)}")


@app.post("/api/search/find-match")
async def search_social_media(payload: SearchRequest):
    """
    Step 2: Social Media & Web Search
    Queries live social platforms (Reddit, DuckDuckGo, Twitter/X, GitHub, Wikipedia)
    to find real matching content with verified URLs.
    """
    try:
        results = search_engine.find_matching_social_post(
            face_hash=payload.face_hash,
            query_hint=payload.query_hint,
            image_b64=payload.image_b64,
            platform_filter=payload.platform_filter or "all"
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Social search failed: {str(e)}")


@app.post("/api/blockchain/notarize")
async def notarize_match_record(payload: NotarizeRequest):
    """
    Step 3: Blockchain Notarization
    Uploads the face-to-post match to the blockchain, mining a new block with
    Merkle tree proof, cryptographic transaction ID, and timestamp.
    """
    try:
        receipt = blockchain.notarize_match(
            face_hash=payload.face_hash,
            post_url=payload.post_url,
            platform=payload.platform,
            post_author=payload.post_author,
            post_title=payload.post_title,
            confidence=payload.confidence,
            metadata=payload.metadata
        )
        return receipt
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blockchain notarization failed: {str(e)}")


@app.post("/api/blockchain/verify")
async def verify_on_chain_record(payload: VerifyRequest):
    """
    Step 3 Verification: On-Chain Audit
    Re-verifies data against the immutable blockchain record.
    Recalculates block hashes, validates Merkle tree, and checks chain continuity.
    """
    try:
        result = blockchain.verify_record(payload.record_hash)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"On-chain verification failed: {str(e)}")


@app.post("/api/blockchain/simulate-tamper")
async def simulate_blockchain_tamper(payload: TamperSimulationRequest):
    """
    Demonstrates tamper evidence by mutating a transaction in a block without re-mining.
    Proves that verification detects tampering immediately.
    """
    try:
        result = blockchain.simulate_tamper(
            block_index=payload.block_index,
            field_to_alter=payload.field_to_alter or "post_url",
            altered_value=payload.altered_value or "https://malicious-spoofed-url.com/fake-post"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tamper simulation failed: {str(e)}")


@app.get("/api/blockchain/ledger")
async def get_blockchain_ledger():
    """Returns complete blockchain blocks and transactions for the Block Explorer."""
    return {
        "block_height": len(blockchain.chain),
        "blocks": [block.to_dict() for block in blockchain.chain]
    }


@app.get("/api/samples")
async def get_sample_images():
    """
    Returns curated sample portraits for fast 1-click evaluation during screen recordings.
    """
    samples = []
    samples_dir = "samples"
    if os.path.exists(samples_dir):
        for fname in sorted(os.listdir(samples_dir)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                fpath = os.path.join(samples_dir, fname)
                try:
                    with open(fpath, "rb") as f:
                        b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("utf-8")
                    name = fname.replace("portrait_", "").replace(".jpg", "").replace(".png", "").replace("_", " ").title()
                    samples.append({
                        "id": fname,
                        "name": name,
                        "filename": fname,
                        "preview_b64": b64
                    })
                except Exception:
                    pass
    return {"samples": samples}


# Serve Frontend Static Assets
frontend_dir = os.path.abspath("frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
async def serve_index():
    """Serves the main web application UI."""
    index_path = os.path.join("frontend", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not yet initialized. Visit /docs for API schema."}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)

