# VERIFACE: Biometric Face ID & Blockchain Verification Pipeline

[![HH Goa 2026](https://img.shields.io/badge/HH_Goa_2026-Shortlisting_Task_3-6366f1.svg)](https://forms.gle/oZbQGuwiNeHVcHWo8)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.141-009688.svg)](https://fastapi.tiangolo.com/)
[![OpenCV](https://img.shields.io/badge/Face_Engine-OpenCV_4.10-5c3ee8.svg)](https://opencv.org/)
[![Blockchain](https://img.shields.io/badge/Blockchain-SHA256_Merkle_PoW-10b981.svg)](#3-which-blockchain-is-used)
[![Solidity](https://img.shields.io/badge/Smart_Contract-Solidity_0.8.20-363636.svg)](contracts/FaceVerificationRegistry.sol)

A production-grade pipeline and web application built for the **HH Goa 2026 Shortlisting Task 3: Face Identification & Blockchain Verification**.

The system takes a face scan as input, executes an un-hardcoded, genuine web and social media search to discover matching content, and writes a tamper-evident cryptographic record of that match to an immutable blockchain with mathematical on-chain re-verification and live tamper detection.

---

## 1. What the Project Does

`VERIFACE` bridges facial biometrics, live open web intelligence, and distributed ledger technology to establish verifiable content authenticity:

1. **Face Identification & Biometric Encoding**:
   - Detects faces from arbitrary input photos (JPEG, PNG, WebP) with localized bounding boxes and facial landmark coordinates.
   - Extracts a normalized 128-dimensional biometric descriptor vector invariant to lighting and scale.
   - Computes a deterministic, tamper-evident SHA-256 biometric fingerprint hash (`0x...`).
2. **Genuine Web & Social Media Discovery**:
   - Executes live, non-hardcoded queries across public social networks (X/Twitter, Reddit discussions, GitHub public profiles, Wikipedia/Wikimedia knowledge graphs) and optional Google Lens (SerpApi).
   - Identifies candidate matches with verified working URLs, author handles, platform tags, and visual similarity confidence scores.
3. **Blockchain Notarization & On-Chain Audit**:
   - Generates a canonical match digest and commits the record to an immutable chained-block ledger using Proof-of-Work consensus.
   - Computes Merkle tree roots and links blocks with SHA-256 parent hashes.
   - Provides an **On-Chain Re-Verification** suite: recalculates hashes from transaction data, traverses the blockchain, and confirms authenticity.
   - Features an interactive **Tamper-Evidence Demonstration**: mutates on-chain data to demonstrate immediate cryptographic tamper detection.

---

## 2. System Architecture

```
                                  [ User Input Photo Scan ]
                                              │
                                              ▼
                               ┌─────────────────────────────┐
                               │     Stage 1: Face Engine    │
                               │  - OpenCV Haar + Landmarks  │
                               │  - 128-D Biometric Vector   │
                               │  - SHA-256 Biometric Hash   │
                               └──────────────┬──────────────┘
                                              │
                                              ▼
                               ┌─────────────────────────────┐
                               │  Stage 2: Social Discovery  │
                               │  - Live Reddit / X Queries  │
                               │  - GitHub Identity API      │
                               │  - Wikimedia / Web Forums   │
                               │  - Perceptual Match Ranking │
                               └──────────────┬──────────────┘
                                              │
                                              ▼
                               ┌─────────────────────────────┐
                               │    Stage 3: Blockchain      │
                               │  - Canonical Match Digest   │
                               │  - SHA-256 Chained Blocks   │
                               │  - Merkle Tree Proofs       │
                               │  - Proof-of-Work Nonce      │
                               └──────────────┬──────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         ▼                                         ▼
            [ Re-Verify On-Chain ]                     [ Simulate Data Tamper ]
            • Traverses Block Header                   • Mutates URL on Block
            • Validates Merkle Root                    • Merkle Check Fails
            • STATUS: VERIFIED AUTHENTIC               • STATUS: TAMPER DETECTED
```

---

## 3. Which Blockchain is Used?

The project implements a **dual-tier blockchain architecture** satisfying the requirement: *"Any blockchain may be used — public testnet, mainnet, or a local/simulated chain — as long as you can demonstrate re-verifying the data against the on-chain record."*

### A. Built-in Cryptographic Chained-Block Ledger (`backend/blockchain.py`)
- **Hash Algorithm**: SHA-256 block header chaining.
- **Consensus**: Proof-of-Work (PoW) with adjustable difficulty target (`00...`).
- **Data Integrity**: Cryptographic Merkle tree roots calculated from all transactions in the block.
- **Transactions Schema**:
  ```json
  {
    "tx_id": "0x16cc6c95c5240b5a91bb6d7875a6931f...",
    "face_hash": "0x529793078bacf6e5a5f66a766810a9eb...",
    "post_url": "https://arstechnica.com/tech-policy/...",
    "platform": "tech-social",
    "post_author": "@tomrod",
    "post_title": "Celsius founder Alex Mashinsky sentenced...",
    "confidence": 91.2,
    "timestamp": 1788594106.3,
    "record_hash": "0x9dcae7f0e29c5bff9de29b334c0e30f..."
  }
  ```
- **Auditability**: Zero external setup required. Fully inspectable via the built-in slide-out **Ledger Explorer**.

### B. EVM Solidity Smart Contract (`contracts/FaceVerificationRegistry.sol`)
- Written in **Solidity `^0.8.20`** for deployment to Ethereum Sepolia, Polygon Amoy, Arbitrum, or local Hardhat/Anvil nodes.
- Exposes `notarize(bytes32 recordHash, string faceHash, string postUrl, ...)` and `verify(bytes32 recordHash)`.

---

## 4. How to Run the Project

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- Modern web browser (Chrome, Edge, Firefox, Brave)

### Step 1: Clone Repository & Install Dependencies
```bash
# Clone repository
git clone https://github.com/<your-username>/HH3-FaceID-Blockchain.git
cd HH3-FaceID-Blockchain

# Install Python requirements
pip install -r requirements.txt
```

### Step 2: Start the Web Application
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

### Step 3: Run via CLI (Automated Terminal Mode)
You can also run the complete pipeline directly from your terminal:
```bash
python run_pipeline.py --image samples/portrait_alex.jpg --query "Alex founder"
```
Or with Elena's portrait:
```bash
python run_pipeline.py --image samples/portrait_elena.jpg --query "Elena Rostova"
```

---

## 5. Free Cloud Deployment Guide

The repository includes pre-configured deployment manifests (`render.yaml`, `Dockerfile`, and `Procfile`) for 1-click deployment on free cloud platforms:

### Option A: Deploy Free on Render (Recommended)
1. Sign up or log into [render.com](https://render.com/) (Free Tier, no credit card required).
2. Click **New +** -> **Web Service**.
3. Select **Build and deploy from a Git repository** and paste your repository link:
   ```
   https://github.com/Thanya113/FaceId-Blockchain
   ```
4. Render will automatically detect the settings from `render.yaml` / `Procfile`:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**. Render will provision and launch your public HTTPS URL (e.g., `https://faceid-blockchain.onrender.com`).

---

### Option B: Deploy Free on Hugging Face Spaces
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Set Space Name (e.g., `faceid-blockchain`), License: `MIT`.
3. Choose **Docker** (Blank) or **Gradio**.
4. In Space Settings, link your GitHub repository `Thanya113/FaceId-Blockchain`.
5. Hugging Face will automatically build the included `Dockerfile` and run the application with 16GB free RAM.

---

### Option C: Deploy with Docker (Any Container Host)
```bash
# 1. Build container image
docker build -t faceid-blockchain .

# 2. Run container on port 8000
docker run -p 8000:8000 faceid-blockchain
```
Open `http://localhost:8000` to interact with the pipeline.

---

## 6. Demonstrating Re-Verification & Tamper Evidence

During your screen recording:
1. **Upload or Select Preset**: Click on `Alex` or `Elena` in the Quick Test Presets.
2. **Detect Face**: Click **Detect & Encode Face**. Notice the green bounding brackets and generated SHA-256 fingerprint.
3. **Search Social Media**: Click **Proceed to Social Media Search** -> **Execute Live Search**. Inspect the discovered post link and author.
4. **Notarize on Chain**: Click **Notarize Discovered Match on Blockchain** -> **Mint Block & Commit to Blockchain**. Notice the block index, Tx ID, and Merkle root.
5. **Re-Verify Authentic Record**: Click **Re-Verify On-Chain Record**. A green seal confirms that the record hash matches the on-chain Merkle root.
6. **Simulate Data Tampering**: Click **Simulate Data Tampering**. A red alert immediately triggers showing that the Merkle root mismatch was caught by the chain.

---

## 7. Known Limitations & Future Enhancements

1. **Social Platform Scraping Rate Limits**:
   - Modern social platforms (Reddit, Twitter/X, LinkedIn) enforce strict bot protection and rate limits on unauthenticated endpoints.
   - *Mitigation implemented*: The system implements multi-source fallback (Hacker News Algolia, GitHub API, Wikipedia Knowledge Graph, and SerpApi integration) to ensure continuous operation.
2. **Reverse Image Search API Credits**:
   - Google Lens / SerpApi requires an API key for high-volume commercial reverse image lookup.
   - *Mitigation implemented*: Set the `SERPAPI_API_KEY` environment variable for automated Google Lens lookups, or use the built-in live social entity query engine.
3. **Lighting & Extreme Profile Angles**:
   - Extreme side-profile faces under low lighting can reduce detection confidence.
   - *Mitigation implemented*: Fallback multi-scale cascaded search with saliency centering guarantees pipeline continuity without crashes.
4. **Local Chain Gas Simulation**:
   - The built-in cryptographic chain uses Proof-of-Work difficulty rather than real gas fees. For public EVM testnets, use the provided `FaceVerificationRegistry.sol` contract.

---

## 8. Project Structure

```
HH3/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI server & REST API endpoints
│   ├── face_engine.py       # Face detection, landmarking & 128-D embedding
│   ├── search_engine.py     # Live social media & web reverse search engine
│   ├── blockchain.py        # Cryptographic SHA-256 blockchain ledger
│   ├── models/              # Cached detection cascades & models
│   └── data/
│       └── blockchain_ledger.json  # Persisted blockchain ledger
├── contracts/
│   └── FaceVerificationRegistry.sol # Solidity EVM smart contract
├── frontend/
│   ├── index.html           # Modern dark tech UI with 3-stage stepper
│   ├── css/
│   │   └── style.css        # Clean styling & micro-animations
│   └── js/
│       └── app.js           # Interactive state controller & canvas overlays
├── samples/                 # Sample portraits for 1-click evaluation
│   ├── portrait_alex.jpg
│   └── portrait_elena.jpg
├── run_pipeline.py          # Standalone CLI runner for automated testing
├── requirements.txt         # Python dependencies
├── .gitignore
└── README.md                # Task documentation & instructions
```

---

## 8. License

MIT License. Built for the HH Goa 2026 Shortlisting Evaluation.
