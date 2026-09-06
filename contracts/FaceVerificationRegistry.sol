// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FaceVerificationRegistry
 * @dev Immutable on-chain registry for face identification and social media verification proofs.
 * Built for HH Goa 2026 Shortlisting Task 3: Face Identification & Blockchain Verification.
 */
contract FaceVerificationRegistry {
    
    struct NotarizedRecord {
        bytes32 recordHash;       // SHA-256 / keccak256 hash of canonical match data
        string faceHash;         // Biometric fingerprint hash of input face
        string postUrl;          // Verified social media post URL
        string platform;         // Social platform (Twitter/X, Reddit, Instagram, etc.)
        string postAuthor;       // Social media post creator/handle
        uint256 confidenceBps;   // Match confidence in basis points (e.g. 9500 = 95.00%)
        uint256 timestamp;       // Block timestamp when record was notarized
        address notarizedBy;     // Address of the notary
        bool exists;             // Existence flag
    }

    // Mapping from recordHash to NotarizedRecord
    mapping(bytes32 => NotarizedRecord) private _records;
    
    // Mapping from faceHash to array of recordHashes (one face can be associated with multiple social posts)
    mapping(string => bytes32[]) private _faceToRecords;
    
    // Total count of notarized records
    uint256 public totalRecordsCount;
    
    // Array of all record hashes for public enumeration / indexing
    bytes32[] public allRecordHashes;

    // Events
    event RecordNotarized(
        bytes32 indexed recordHash,
        string indexed faceHash,
        string platform,
        string postUrl,
        uint256 confidenceBps,
        uint256 timestamp,
        address notarizedBy
    );

    /**
     * @dev Notarize a face-to-social-post match on chain.
     * Prevents duplicate registration of the exact same record hash.
     */
    function notarize(
        bytes32 recordHash,
        string calldata faceHash,
        string calldata postUrl,
        string calldata platform,
        string calldata postAuthor,
        uint256 confidenceBps
    ) external returns (bool) {
        require(recordHash != bytes32(0), "Invalid record hash");
        require(bytes(faceHash).length > 0, "Face hash required");
        require(bytes(postUrl).length > 0, "Post URL required");
        require(!_records[recordHash].exists, "Record already notarized on chain");

        NotarizedRecord memory newRecord = NotarizedRecord({
            recordHash: recordHash,
            faceHash: faceHash,
            postUrl: postUrl,
            platform: platform,
            postAuthor: postAuthor,
            confidenceBps: confidenceBps,
            timestamp: block.timestamp,
            notarizedBy: msg.sender,
            exists: true
        });

        _records[recordHash] = newRecord;
        _faceToRecords[faceHash].push(recordHash);
        allRecordHashes.push(recordHash);
        totalRecordsCount += 1;

        emit RecordNotarized(
            recordHash,
            faceHash,
            platform,
            postUrl,
            confidenceBps,
            block.timestamp,
            msg.sender
        );

        return true;
    }

    /**
     * @dev Re-verifies whether a given recordHash exists and returns on-chain proof data.
     */
    function verify(bytes32 recordHash) external view returns (
        bool exists,
        string memory faceHash,
        string memory postUrl,
        string memory platform,
        string memory postAuthor,
        uint256 confidenceBps,
        uint256 timestamp,
        address notarizedBy
    ) {
        NotarizedRecord memory r = _records[recordHash];
        return (
            r.exists,
            r.faceHash,
            r.postUrl,
            r.platform,
            r.postAuthor,
            r.confidenceBps,
            r.timestamp,
            r.notarizedBy
        );
    }

    /**
     * @dev Fetches all record hashes linked to a specific face biometric hash.
     */
    function getRecordsForFace(string calldata faceHash) external view returns (bytes32[] memory) {
        return _faceToRecords[faceHash];
    }
}
