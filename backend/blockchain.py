"""
Cryptographic Tamper-Evident Blockchain Ledger
Built for HH Goa 2026 Shortlisting Task 3: Face Identification & Blockchain Verification.

Provides an immutable, cryptographically verifiable ledger with SHA-256 block chaining,
Merkle tree proofs, Proof-of-Work validation, and automated tamper detection.
"""

import hashlib
import json
import time
import os
from typing import List, Dict, Any, Optional, Tuple


def sha256(data: str) -> str:
    """Compute SHA-256 hexadecimal digest of input string."""
    return hashlib.sha256(data.encode('utf-8')).hexdigest()


def get_tx_content_hash(tx: Dict[str, Any]) -> str:
    """Compute deterministic cryptographic hash of transaction contents."""
    # Exclude dynamic signature/status if any, hash the payload content
    content = {k: v for k, v in tx.items() if k not in ("signature",)}
    return sha256(json.dumps(content, sort_keys=True))


def compute_merkle_root(tx_hashes: List[str]) -> str:
    """Compute Merkle Tree root for a list of transaction hashes."""
    if not tx_hashes:
        return sha256("EMPTY_TREE")
    
    current_level = [h for h in tx_hashes]
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i + 1] if i + 1 < len(current_level) else left
            combined = sha256(left + right)
            next_level.append(combined)
        current_level = next_level
    return current_level[0]


class Block:
    """Represents a single cryptographic block in the chain."""

    def __init__(
        self,
        index: int,
        timestamp: float,
        transactions: List[Dict[str, Any]],
        previous_hash: str,
        nonce: int = 0,
        merkle_root: Optional[str] = None,
        block_hash: Optional[str] = None
    ):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        
        # Calculate or assign Merkle root
        if merkle_root is None:
            tx_hashes = [get_tx_content_hash(tx) for tx in transactions]
            self.merkle_root = compute_merkle_root(tx_hashes)
        else:
            self.merkle_root = merkle_root

        # Calculate or assign block hash
        if block_hash is None:
            self.hash = self.compute_hash()
        else:
            self.hash = block_hash

    def compute_hash(self) -> str:
        """Compute SHA-256 hash of the block header."""
        block_header = {
            "index": self.index,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce
        }
        return sha256(json.dumps(block_header, sort_keys=True))

    def to_dict(self) -> Dict[str, Any]:
        """Convert block to JSON-serializable dictionary."""
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "formatted_time": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(self.timestamp)),
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce,
            "hash": self.hash
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Block":
        return cls(
            index=data["index"],
            timestamp=data["timestamp"],
            transactions=data["transactions"],
            previous_hash=data["previous_hash"],
            nonce=data["nonce"],
            merkle_root=data.get("merkle_root"),
            block_hash=data.get("hash")
        )


class Blockchain:
    """Manages the verifiable ledger, mining, persistence, and audit proofs."""

    def __init__(self, ledger_file: str = "backend/data/blockchain_ledger.json", difficulty: int = 2):
        self.ledger_file = ledger_file
        self.difficulty = difficulty
        self.chain: List[Block] = []
        self.pending_transactions: List[Dict[str, Any]] = []
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(self.ledger_file), exist_ok=True)

        # Load existing chain or create Genesis block
        if not self.load_from_disk():
            self.create_genesis_block()

    def create_genesis_block(self):
        """Mints the primordial Genesis block."""
        genesis_tx = {
            "tx_id": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "type": "GENESIS",
            "description": "HH Goa 2026 Shortlisting Task 3 - Primordial Genesis Block",
            "timestamp": time.time(),
            "record_hash": sha256("HH_GOA_2026_GENESIS_ROOT")
        }
        genesis_block = Block(
            index=0,
            timestamp=time.time(),
            transactions=[genesis_tx],
            previous_hash="0" * 64,
            nonce=0
        )
        # Mine genesis block to satisfy initial difficulty
        target = "0" * self.difficulty
        while not genesis_block.hash.startswith(target):
            genesis_block.nonce += 1
            genesis_block.hash = genesis_block.compute_hash()

        self.chain = [genesis_block]
        self.save_to_disk()

    @property
    def last_block(self) -> Block:
        return self.chain[-1]

    def create_record_hash(
        self,
        face_hash: str,
        post_url: str,
        platform: str,
        post_author: str,
        timestamp: float
    ) -> str:
        """Create a deterministic cryptographic fingerprint of the match record."""
        canonical_payload = {
            "face_hash": face_hash,
            "post_url": post_url.strip(),
            "platform": platform.strip().lower(),
            "post_author": post_author.strip(),
            "timestamp": int(timestamp)
        }
        serialized = json.dumps(canonical_payload, sort_keys=True)
        return "0x" + sha256(serialized)

    def notarize_match(
        self,
        face_hash: str,
        post_url: str,
        platform: str,
        post_author: str,
        post_title: str,
        confidence: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Notarizes a discovered face-to-social-post match into a new block.
        Returns full transaction receipt with cryptographic proofs.
        """
        now = time.time()
        record_hash = self.create_record_hash(
            face_hash=face_hash,
            post_url=post_url,
            platform=platform,
            post_author=post_author,
            timestamp=now
        )
        
        tx_payload = {
            "face_hash": face_hash,
            "post_url": post_url,
            "platform": platform,
            "post_author": post_author,
            "post_title": post_title,
            "confidence": round(confidence, 2),
            "timestamp": now,
            "record_hash": record_hash,
            "metadata": metadata or {}
        }
        tx_id = "0x" + sha256(json.dumps(tx_payload, sort_keys=True))
        tx_payload["tx_id"] = tx_id

        # Mine a new block containing this notarized match
        block = self.mine_block([tx_payload])
        
        receipt = {
            "status": "NOTARIZED_ON_CHAIN",
            "tx_id": tx_id,
            "record_hash": record_hash,
            "block_index": block.index,
            "block_hash": block.hash,
            "previous_hash": block.previous_hash,
            "merkle_root": block.merkle_root,
            "timestamp": block.timestamp,
            "nonce": block.nonce,
            "verified": True
        }
        return receipt

    def mine_block(self, transactions: List[Dict[str, Any]]) -> Block:
        """Mines a block using Proof-of-Work to guarantee immutable sequencing."""
        previous_block = self.last_block
        new_index = previous_block.index + 1
        timestamp = time.time()
        
        tx_hashes = [get_tx_content_hash(tx) for tx in transactions]
        merkle_root = compute_merkle_root(tx_hashes)

        block = Block(
            index=new_index,
            timestamp=timestamp,
            transactions=transactions,
            previous_hash=previous_block.hash,
            nonce=0,
            merkle_root=merkle_root
        )

        target = "0" * self.difficulty
        while not block.hash.startswith(target):
            block.nonce += 1
            block.hash = block.compute_hash()

        self.chain.append(block)
        self.save_to_disk()
        return block

    def verify_record(self, record_hash: str) -> Dict[str, Any]:
        """
        Re-verifies data against the on-chain record:
        1. Checks whether record_hash exists inside any confirmed block.
        2. Validates Merkle tree root of that block.
        3. Validates block header hash and Proof-of-Work.
        4. Validates chain continuity from Genesis to the target block.
        """
        # Normalize record_hash
        norm_hash = record_hash.lower()
        if not norm_hash.startswith("0x") and len(norm_hash) == 64:
            norm_hash = "0x" + norm_hash

        for block in self.chain:
            for tx in block.transactions:
                stored_record_hash = tx.get("record_hash", "").lower()
                stored_tx_id = tx.get("tx_id", "").lower()

                if stored_record_hash == norm_hash or stored_tx_id == norm_hash:
                    # Found candidate block! Now verify cryptographic integrity
                    block_valid, reason = self.verify_single_block(block)
                    chain_valid, chain_reason = self.verify_chain_integrity()

                    return {
                        "verified": block_valid and chain_valid,
                        "status": "VERIFIED_AUTHENTIC" if (block_valid and chain_valid) else "INTEGRITY_COMPROMISED",
                        "block_index": block.index,
                        "block_hash": block.hash,
                        "timestamp": block.timestamp,
                        "formatted_time": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(block.timestamp)),
                        "merkle_root": block.merkle_root,
                        "matched_transaction": tx,
                        "chain_integrity_valid": chain_valid,
                        "tamper_detected": not (block_valid and chain_valid),
                        "diagnostic_message": "Cryptographic signature and block hashes match on-chain record." if (block_valid and chain_valid) else f"Block issue: {reason}, Chain issue: {chain_reason}"
                    }

        return {
            "verified": False,
            "status": "RECORD_NOT_FOUND",
            "tamper_detected": True,
            "diagnostic_message": f"No block on chain matches record hash {record_hash}. The data is not authentic or has been modified."
        }

    def verify_single_block(self, block: Block) -> Tuple[bool, str]:
        """Validates internal integrity of a single block."""
        # 1. Check PoW target
        target = "0" * self.difficulty
        if not block.hash.startswith(target):
            return False, f"Proof of work failed: hash does not start with {target}"

        # 2. Check hash recalculation
        expected_hash = block.compute_hash()
        if block.hash != expected_hash:
            return False, f"Block hash mismatch: stored={block.hash}, calculated={expected_hash}"

        # 3. Check Merkle root recalculation
        tx_hashes = [get_tx_content_hash(tx) for tx in block.transactions]
        expected_merkle = compute_merkle_root(tx_hashes)
        if block.merkle_root != expected_merkle:
            return False, f"Merkle root mismatch: stored={block.merkle_root}, calculated={expected_merkle}"

        return True, "Block is valid"

    def verify_chain_integrity(self) -> Tuple[bool, str]:
        """Validates entire chain from genesis to head."""
        if not self.chain:
            return False, "Chain is empty"

        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i - 1]

            # Link verification
            if current.previous_hash != prev.hash:
                return False, f"Broken link at block #{current.index}: previous_hash ({current.previous_hash[:10]}...) != #{prev.index} hash ({prev.hash[:10]}...)"

            # Block integrity verification
            valid, reason = self.verify_single_block(current)
            if not valid:
                return False, f"Block #{current.index} corrupt: {reason}"

        return True, "Chain integrity 100% valid"

    def simulate_tamper(self, block_index: int, field_to_alter: str = "post_url", altered_value: str = "https://malicious-spoofed-link.org") -> Dict[str, Any]:
        """
        Demonstrates tamper evidence for evaluators:
        Intentionally modifies a transaction inside a mined block without re-mining.
        Chain integrity checks will immediately catch the corruption!
        """
        if block_index <= 0 or block_index >= len(self.chain):
            return {"error": f"Invalid block index {block_index} for tampering demonstration"}

        target_block = self.chain[block_index]
        if not target_block.transactions:
            return {"error": "Block has no transactions to alter"}

        original_value = target_block.transactions[0].get(field_to_alter, "")
        # Apply modification
        target_block.transactions[0][field_to_alter] = altered_value

        # Run verification to witness the tamper detection
        is_valid, reason = self.verify_chain_integrity()
        
        result = {
            "tamper_simulation": "ACTIVE",
            "block_index": block_index,
            "altered_field": field_to_alter,
            "original_value": original_value,
            "tampered_value": altered_value,
            "chain_valid_after_tamper": is_valid,
            "detection_message": f"Tamper successfully caught! Reason: {reason}" if not is_valid else "Warning: Not detected"
        }
        return result

    def restore_tamper(self, block_index: int, field: str, original_value: str):
        """Restores original value after tamper simulation."""
        if 0 < block_index < len(self.chain):
            self.chain[block_index].transactions[0][field] = original_value
            self.save_to_disk()

    def get_chain_summary(self) -> Dict[str, Any]:
        """Returns high-level statistics for the UI header."""
        is_valid, msg = self.verify_chain_integrity()
        total_txs = sum(len(b.transactions) for b in self.chain)
        return {
            "block_height": len(self.chain),
            "latest_block_hash": self.last_block.hash,
            "total_transactions": total_txs,
            "difficulty": self.difficulty,
            "is_valid": is_valid,
            "integrity_status": "SECURE" if is_valid else "COMPROMISED",
            "consensus": "Proof-of-Work (PoW) + SHA-256 Chaining"
        }

    def save_to_disk(self):
        """Persists blockchain state to disk."""
        data = [block.to_dict() for block in self.chain]
        with open(self.ledger_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_from_disk(self) -> bool:
        """Loads blockchain state from disk if exists."""
        if not os.path.exists(self.ledger_file):
            return False
        try:
            with open(self.ledger_file, "r", encoding="utf-8") as f:
                raw_blocks = json.load(f)
            if not raw_blocks:
                return False
            self.chain = [Block.from_dict(b) for b in raw_blocks]
            return True
        except Exception as e:
            print(f"[Blockchain] Failed to load ledger: {e}")
            return False
