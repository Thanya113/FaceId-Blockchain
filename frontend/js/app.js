/**
 * VeriFace - Main Application Controller
 * HH Goa 2026 Shortlisting Task 3: Face ID & Blockchain Verification Pipeline
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentStep: 1,
    selectedImageB64: null,
    faceData: null,
    searchResult: null,
    selectedMatch: null,
    notarizationReceipt: null,
    tamperedBlockIndex: null
  };

  // DOM Elements
  const el = {
    // Header & Badges
    chainHeightText: document.getElementById('chain-height-text'),
    chainIntegrityText: document.getElementById('chain-integrity-text'),
    btnOpenExplorer: document.getElementById('btn-open-explorer'),
    btnToggleTerminal: document.getElementById('btn-toggle-terminal'),
    
    // Steppers
    indicatorStep1: document.getElementById('indicator-step-1'),
    indicatorStep2: document.getElementById('indicator-step-2'),
    indicatorStep3: document.getElementById('indicator-step-3'),
    line12: document.getElementById('line-step-1-2'),
    line23: document.getElementById('line-step-2-3'),
    sectionStep1: document.getElementById('section-step-1'),
    sectionStep2: document.getElementById('section-step-2'),
    sectionStep3: document.getElementById('section-step-3'),

    // Step 1: Face ID
    dropzone: document.getElementById('image-dropzone'),
    fileInput: document.getElementById('file-input'),
    btnBrowseFile: document.getElementById('btn-browse-file'),
    dropzonePrompt: document.getElementById('dropzone-prompt'),
    previewWrapper: document.getElementById('preview-wrapper'),
    rawPreviewImg: document.getElementById('raw-preview-img'),
    detectionCanvas: document.getElementById('detection-canvas'),
    samplesContainer: document.getElementById('samples-container'),
    btnScanFace: document.getElementById('btn-scan-face'),
    scanSpinner: document.getElementById('scan-spinner'),
    scanBtnText: document.getElementById('scan-btn-text'),
    bioEmptyState: document.getElementById('bio-empty-state'),
    bioResults: document.getElementById('bio-results'),
    faceChipImg: document.getElementById('face-chip-img'),
    statDetectionStatus: document.getElementById('stat-detection-status'),
    statConfidence: document.getElementById('stat-confidence'),
    statBbox: document.getElementById('stat-bbox'),
    statDims: document.getElementById('stat-dims'),
    displayFaceHash: document.getElementById('display-face-hash'),
    btnCopyFaceHash: document.getElementById('btn-copy-face-hash'),
    displayVectorPreview: document.getElementById('display-vector-preview'),
    btnGoToSearch: document.getElementById('btn-go-to-search'),

    // Identified Person Elements
    identifiedPersonCard: document.getElementById('identified-person-card'),
    identifiedPersonName: document.getElementById('identified-person-name'),
    identifiedPersonScore: document.getElementById('identified-person-score'),
    identifiedPersonRole: document.getElementById('identified-person-role'),
    identifiedPersonHandles: document.getElementById('identified-person-handles'),
    verifiedDirectoryBanner: document.getElementById('verified-directory-banner'),
    directoryEntityTitle: document.getElementById('directory-entity-title'),
    directoryHandlesGrid: document.getElementById('directory-handles-grid'),

    // Step 2: Search
    inputSearchHint: document.getElementById('input-search-hint'),
    selectPlatformFilter: document.getElementById('select-platform-filter'),
    btnExecuteSearch: document.getElementById('btn-execute-search'),
    searchSpinner: document.getElementById('search-spinner'),
    searchBtnText: document.getElementById('search-btn-text'),
    searchLoadingState: document.getElementById('search-loading-state'),
    discoveredMatchCard: document.getElementById('discovered-match-card'),
    matchPlatformTag: document.getElementById('match-platform-tag'),
    matchConfidencePill: document.getElementById('match-confidence-pill'),
    matchSourceEngine: document.getElementById('match-source-engine'),
    matchPostTitle: document.getElementById('match-post-title'),
    matchPostAuthor: document.getElementById('match-post-author'),
    matchPostLink: document.getElementById('match-post-link'),
    matchPostSnippet: document.getElementById('match-post-snippet'),
    btnOpenLiveUrl: document.getElementById('btn-open-live-url'),
    btnProceedToBlockchain: document.getElementById('btn-proceed-to-blockchain'),
    candidatesWrapper: document.getElementById('candidates-wrapper'),
    candidatesGrid: document.getElementById('candidates-grid'),

    // Step 3: Blockchain & Audit
    notarizePayloadJson: document.getElementById('notarize-payload-json'),
    btnCommitBlockchain: document.getElementById('btn-commit-blockchain'),
    notarizeSpinner: document.getElementById('notarize-spinner'),
    notarizeBtnText: document.getElementById('notarize-btn-text'),
    receiptCard: document.getElementById('receipt-card'),
    receiptBlockSubtitle: document.getElementById('receipt-block-subtitle'),
    receiptTxId: document.getElementById('receipt-tx-id'),
    receiptRecordHash: document.getElementById('receipt-record-hash'),
    receiptBlockHash: document.getElementById('receipt-block-hash'),
    receiptMerkleRoot: document.getElementById('receipt-merkle-root'),
    btnReverifyOnchain: document.getElementById('btn-reverify-onchain'),
    btnSimulateTamper: document.getElementById('btn-simulate-tamper'),
    verificationResultBox: document.getElementById('verification-result-box'),
    customRecordHashInput: document.getElementById('custom-record-hash-input'),
    btnAuditHash: document.getElementById('btn-audit-hash'),

    // Drawers
    explorerDrawer: document.getElementById('explorer-drawer'),
    btnCloseExplorer: document.getElementById('btn-close-explorer'),
    explorerBlocksList: document.getElementById('explorer-blocks-list'),
    terminalDrawer: document.getElementById('terminal-drawer'),
    btnCloseTerminal: document.getElementById('btn-close-terminal'),
    btnClearTerminal: document.getElementById('btn-clear-terminal'),
    terminalLogs: document.getElementById('terminal-logs'),
    drawerBackdrop: document.getElementById('drawer-backdrop')
  };

  // --- Logger Helper ---
  function logTerminal(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">${escapeHtml(message)}</span>`;
    el.terminalLogs.appendChild(entry);
    el.terminalLogs.scrollTop = el.terminalLogs.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- Initialization ---
  async function init() {
    logTerminal('Initializing VeriFace Core Pipeline...', 'info');
    setupEventListeners();
    await fetchChainStatus();
    await loadQuickSamples();
  }

  // --- API: Fetch Blockchain Ledger Status ---
  async function fetchChainStatus() {
    try {
      const resp = await fetch('/api/status');
      if (resp.ok) {
        const data = await resp.json();
        const bc = data.blockchain;
        el.chainHeightText.textContent = `Ledger: Block #${bc.block_height - 1}`;
        el.chainIntegrityText.textContent = bc.is_valid ? 'Verified' : 'Tamper Detected';
        el.chainIntegrityText.className = bc.is_valid ? 'status-secure' : 'status-danger';
        logTerminal(`Blockchain Status: Height ${bc.block_height}, Integrity: ${bc.integrity_status}`, 'success');
      }
    } catch (err) {
      logTerminal(`Error fetching chain status: ${err.message}`, 'error');
    }
  }

  // --- API: Load Quick Sample Presets ---
  async function loadQuickSamples() {
    try {
      const resp = await fetch('/api/samples');
      if (resp.ok) {
        const data = await resp.json();
        el.samplesContainer.innerHTML = '';
        data.samples.forEach(sample => {
          const chip = document.createElement('div');
          chip.className = 'sample-chip';
          chip.innerHTML = `
            <img src="${sample.preview_b64}" class="sample-thumb" alt="${sample.name}">
            <span>${sample.name}</span>
          `;
          chip.addEventListener('click', () => {
            selectSamplePortrait(sample);
          });
          el.samplesContainer.appendChild(chip);
        });
        logTerminal(`Loaded ${data.samples.length} quick test portrait presets.`, 'info');
      }
    } catch (err) {
      console.warn('Could not load samples:', err);
    }
  }

  function selectSamplePortrait(sample) {
    document.querySelectorAll('.sample-chip').forEach(c => c.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    loadImageData(sample.preview_b64, sample.name);
    // Prefill query hint to match entity name
    el.inputSearchHint.value = sample.name;
  }

  // --- Image Handling & Canvas Drawing ---
  function loadImageData(base64Data, label = 'Custom Upload') {
    state.selectedImageB64 = base64Data;
    el.rawPreviewImg.src = base64Data;
    el.dropzonePrompt.classList.add('hidden');
    el.previewWrapper.classList.remove('hidden');
    el.btnScanFace.disabled = false;
    
    // Clear previous canvas
    const ctx = el.detectionCanvas.getContext('2d');
    ctx.clearRect(0, 0, el.detectionCanvas.width, el.detectionCanvas.height);

    // If custom upload, clear any preset chip active class and reset query hint
    if (label === 'Custom Upload' || !label || (!label.startsWith('Sundar') && !label.startsWith('Elon') && !label.startsWith('Bill') && !label.startsWith('Satya') && !label.startsWith('Jensen') && !label.startsWith('Sam') && !label.startsWith('Alex') && !label.startsWith('Elena'))) {
      document.querySelectorAll('.sample-chip').forEach(c => c.classList.remove('active'));
      el.inputSearchHint.value = '';
      el.identifiedPersonCard.classList.add('hidden');
    }

    logTerminal(`Ingested image scan: ${label}`, 'info');
  }

  function drawDetectionOverlay(bbox, landmarks, imgWidth, imgHeight) {
    const canvas = el.detectionCanvas;
    const img = el.rawPreviewImg;

    // Match canvas coordinate size to image display size
    canvas.width = img.clientWidth || 300;
    canvas.height = img.clientHeight || 260;

    const scaleX = canvas.width / imgWidth;
    const scaleY = canvas.height / imgHeight;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bx = bbox.x * scaleX;
    const by = bbox.y * scaleY;
    const bw = bbox.width * scaleX;
    const bh = bbox.height * scaleY;

    // Main bounding box (cyan / emerald glow)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Corner tech brackets
    const cl = Math.min(bw, bh) * 0.25;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(bx, by + bh - cl); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cl, by + bh);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(bx + bw - cl, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cl);
    ctx.stroke();

    // Draw facial landmark dots
    if (landmarks && landmarks.length) {
      ctx.fillStyle = '#06b6d4';
      landmarks.forEach(lm => {
        ctx.beginPath();
        ctx.arc(lm.x * scaleX, lm.y * scaleY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Label tag
    ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.fillRect(bx, by - 22, 110, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText('FACE DETECTED', bx + 6, by - 8);
  }

  // --- Step 1 Action: Detect & Encode Face ---
  async function executeFaceScan() {
    if (!state.selectedImageB64) return;

    el.btnScanFace.disabled = true;
    el.scanSpinner.classList.remove('hidden');
    el.scanBtnText.textContent = 'Analyzing Biometrics...';
    logTerminal('Executing Face Identification & Landmark Localization...', 'info');

    const startTime = performance.now();

    try {
      const resp = await fetch('/api/face/detect-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: state.selectedImageB64 })
      });

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`);
      }

      const data = await resp.json();
      const elapsed = Math.round(performance.now() - startTime);
      state.faceData = data;

      logTerminal(`Face detected in ${elapsed}ms: Confidence ${data.confidence}%, Dimensions 128-D`, 'success');
      logTerminal(`Biometric Fingerprint SHA-256: ${data.face_hash}`, 'success');

      // Update UI with detection details
      el.bioEmptyState.classList.add('hidden');
      el.bioResults.classList.remove('hidden');

      el.faceChipImg.src = data.face_chip_b64;
      el.statDetectionStatus.textContent = data.status;
      el.statConfidence.textContent = `${data.confidence}%`;
      el.statBbox.textContent = `[x:${data.bounding_box.x}, y:${data.bounding_box.y}, w:${data.bounding_box.width}, h:${data.bounding_box.height}]`;
      el.statDims.textContent = `${data.embedding_dimensions}-D Normalized Biometric Vector`;
      el.displayFaceHash.textContent = data.face_hash;
      el.displayVectorPreview.textContent = JSON.stringify(data.embedding_preview);

      // Render detection box overlay
      drawDetectionOverlay(data.bounding_box, data.landmarks, data.bounding_box.image_width, data.bounding_box.image_height);

      // Handle identified public figure
      if (data.identified_entity) {
        const ent = data.identified_entity;
        el.identifiedPersonCard.classList.remove('hidden');
        el.identifiedPersonName.textContent = ent.name;
        el.identifiedPersonScore.textContent = `${ent.match_confidence}% Match`;
        el.identifiedPersonRole.textContent = `${ent.role} (${ent.organization})`;
        
        // Render verified handles
        el.identifiedPersonHandles.innerHTML = '';
        if (ent.verified_handles) {
          if (ent.verified_handles.twitter) {
            el.identifiedPersonHandles.innerHTML += `<a href="${ent.verified_handles.twitter_url || '#'}" target="_blank" class="handle-tag">𝕏 ${ent.verified_handles.twitter}</a>`;
          }
          if (ent.verified_handles.linkedin_url) {
            el.identifiedPersonHandles.innerHTML += `<a href="${ent.verified_handles.linkedin_url}" target="_blank" class="handle-tag">in ${ent.name}</a>`;
          }
          if (ent.verified_handles.instagram) {
            el.identifiedPersonHandles.innerHTML += `<a href="${ent.verified_handles.instagram_url || '#'}" target="_blank" class="handle-tag">IG ${ent.verified_handles.instagram}</a>`;
          }
        }

        // Automatically set the search input to the person's real name!
        el.inputSearchHint.value = ent.name;
        logTerminal(`Public Figure Identified: ${ent.name} (${ent.match_confidence}% Match) - ${ent.role}`, 'success');
      } else {
        el.identifiedPersonCard.classList.add('hidden');
        el.inputSearchHint.value = '';
        el.inputSearchHint.placeholder = 'Enter person or entity name (e.g. Sundar Pichai, Bill Gates) to search web...';
        logTerminal(`Biometric vector encoded (SHA-256: ${data.face_hash.substring(0, 10)}...). Identity is not in local gallery. Enter name in Step 2 to search live web & social networks.`, 'info');
      }

      // Unlock step 2 indicator
      el.line12.classList.add('filled');
      el.indicatorStep1.classList.add('completed');
    } catch (err) {
      logTerminal(`Face identification failed: ${err.message}`, 'error');
      alert(`Face detection failed: ${err.message}`);
    } finally {
      el.btnScanFace.disabled = false;
      el.scanSpinner.classList.add('hidden');
      el.scanBtnText.textContent = 'Detect & Encode Face';
    }
  }

  // --- Step 2 Action: Search Web & Social Media ---
  async function executeSocialSearch() {
    if (!state.faceData) {
      alert('Please detect a face in Step 1 first.');
      return;
    }

    const queryHint = el.inputSearchHint.value.trim();
    const platformFilter = el.selectPlatformFilter.value;

    el.btnExecuteSearch.disabled = true;
    el.searchSpinner.classList.remove('hidden');
    el.searchBtnText.textContent = 'Querying Networks...';
    el.searchLoadingState.classList.remove('hidden');
    el.discoveredMatchCard.classList.add('hidden');
    el.candidatesWrapper.classList.add('hidden');

    logTerminal(`Initiating genuine social media query: "${queryHint}" (Filter: ${platformFilter})...`, 'info');

    try {
      const resp = await fetch('/api/search/find-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          face_hash: state.faceData.face_hash,
          query_hint: queryHint,
          image_b64: state.faceData.face_chip_b64,
          platform_filter: platformFilter
        })
      });

      if (!resp.ok) {
        throw new Error(`Search request failed with status ${resp.status}`);
      }

      const data = await resp.json();
      state.searchResult = data;

      logTerminal(`Search completed in ${data.search_latency_ms}ms: ${data.total_candidates_found} candidates found.`, 'success');

      // Display verified official channels banner if an entity was matched
      if (data.identified_entity) {
        const ent = data.identified_entity;
        el.verifiedDirectoryBanner.classList.remove('hidden');
        el.directoryEntityTitle.textContent = `${ent.name} (${ent.organization})`;
        el.directoryHandlesGrid.innerHTML = '';
        if (ent.verified_handles) {
          if (ent.verified_handles.twitter_url) {
            el.directoryHandlesGrid.innerHTML += `<a href="${ent.verified_handles.twitter_url}" target="_blank" class="handle-tag">𝕏 Twitter: ${ent.verified_handles.twitter || '@' + ent.id}</a>`;
          }
          if (ent.verified_handles.linkedin_url) {
            el.directoryHandlesGrid.innerHTML += `<a href="${ent.verified_handles.linkedin_url}" target="_blank" class="handle-tag">in LinkedIn Profile</a>`;
          }
          if (ent.verified_handles.instagram_url) {
            el.directoryHandlesGrid.innerHTML += `<a href="${ent.verified_handles.instagram_url}" target="_blank" class="handle-tag">Instagram: ${ent.verified_handles.instagram || ent.name}</a>`;
          }
          if (ent.verified_handles.wikipedia_url) {
            el.directoryHandlesGrid.innerHTML += `<a href="${ent.verified_handles.wikipedia_url}" target="_blank" class="handle-tag">Wikipedia Knowledge Graph</a>`;
          }
        }
        logTerminal(`Verified official social handles loaded for ${ent.name}`, 'info');
      } else {
        el.verifiedDirectoryBanner.classList.add('hidden');
      }

      if (data.best_match) {
        selectPostMatch(data.best_match);
        renderCandidates(data.candidates);
        el.line23.classList.add('filled');
        el.indicatorStep2.classList.add('completed');
      } else {
        logTerminal('No matching social posts returned for this query.', 'warn');
        alert('No matching social posts found. Try a different query hint.');
      }
    } catch (err) {
      logTerminal(`Search query error: ${err.message}`, 'error');
      alert(`Social search error: ${err.message}`);
    } finally {
      el.btnExecuteSearch.disabled = false;
      el.searchSpinner.classList.add('hidden');
      el.searchBtnText.textContent = 'Execute Live Search';
      el.searchLoadingState.classList.add('hidden');
    }
  }

  function selectPostMatch(match) {
    state.selectedMatch = match;
    logTerminal(`Selected matching post: [${match.platform.toUpperCase()}] ${match.post_title} (${match.post_url})`, 'success');

    // Populate Discovered Match Card
    el.matchPlatformTag.textContent = match.platform.toUpperCase();
    el.matchConfidencePill.textContent = `${match.confidence}% Visual Match`;
    el.matchSourceEngine.textContent = `Discovered via ${match.source_engine || 'Live Network Query'}`;
    el.matchPostTitle.textContent = match.post_title;
    el.matchPostAuthor.textContent = match.post_author;
    el.matchPostLink.href = match.post_url;
    el.matchPostLink.textContent = match.post_url;
    el.matchPostSnippet.textContent = match.post_snippet;

    el.discoveredMatchCard.classList.remove('hidden');

    // Prepare Step 3 Payload preview
    updateNotarizePayloadPreview();
  }

  function renderCandidates(candidates) {
    if (!candidates || candidates.length <= 1) {
      el.candidatesWrapper.classList.add('hidden');
      return;
    }

    el.candidatesGrid.innerHTML = '';
    candidates.forEach((cand, idx) => {
      const card = document.createElement('div');
      card.className = `candidate-card ${idx === 0 ? 'selected' : ''}`;
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
          <span class="badge badge-indigo">${cand.platform.toUpperCase()}</span>
          <span style="font-size:0.75rem; color:#6ee7b7; font-weight:600;">${cand.confidence}% Match</span>
        </div>
        <div style="font-weight:600; font-size:0.85rem; margin-bottom:0.25rem;">${escapeHtml(cand.post_title)}</div>
        <div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(cand.post_author)}</div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectPostMatch(cand);
      });
      el.candidatesGrid.appendChild(card);
    });

    el.candidatesWrapper.classList.remove('hidden');
  }

  function updateNotarizePayloadPreview() {
    if (!state.faceData || !state.selectedMatch) return;

    const payload = {
      face_hash: state.faceData.face_hash,
      post_url: state.selectedMatch.post_url,
      platform: state.selectedMatch.platform,
      post_author: state.selectedMatch.post_author,
      post_title: state.selectedMatch.post_title,
      confidence: state.selectedMatch.confidence,
      timestamp: Math.floor(Date.now() / 1000)
    };

    el.notarizePayloadJson.textContent = JSON.stringify(payload, null, 2);
  }

  // --- Step 3 Action: Commit to Blockchain ---
  async function executeNotarization() {
    if (!state.faceData || !state.selectedMatch) {
      alert('Please complete Step 1 and Step 2 first.');
      return;
    }

    el.btnCommitBlockchain.disabled = true;
    el.notarizeSpinner.classList.remove('hidden');
    el.notarizeBtnText.textContent = 'Mining Block...';

    logTerminal('Constructing canonical match digest and mining block with Proof-of-Work...', 'info');

    try {
      const resp = await fetch('/api/blockchain/notarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          face_hash: state.faceData.face_hash,
          post_url: state.selectedMatch.post_url,
          platform: state.selectedMatch.platform,
          post_author: state.selectedMatch.post_author,
          post_title: state.selectedMatch.post_title,
          confidence: state.selectedMatch.confidence,
          metadata: {
            source_engine: state.selectedMatch.source_engine || 'VeriFace Search'
          }
        })
      });

      if (!resp.ok) {
        throw new Error(`Notarization failed with status ${resp.status}`);
      }

      const receipt = await resp.json();
      state.notarizationReceipt = receipt;

      logTerminal(`Block #${receipt.block_index} successfully mined! Nonce: ${receipt.nonce}`, 'success');
      logTerminal(`Transaction ID: ${receipt.tx_id}`, 'success');
      logTerminal(`Merkle Tree Root: ${receipt.merkle_root}`, 'success');

      // Populate Receipt Card
      el.receiptBlockSubtitle.textContent = `Block #${receipt.block_index} (PoW Nonce: ${receipt.nonce})`;
      el.receiptTxId.textContent = receipt.tx_id;
      el.receiptRecordHash.textContent = receipt.record_hash;
      el.receiptBlockHash.textContent = receipt.block_hash;
      el.receiptMerkleRoot.textContent = receipt.merkle_root;

      el.receiptCard.classList.remove('hidden');
      el.btnReverifyOnchain.disabled = false;
      el.btnSimulateTamper.disabled = false;
      el.customRecordHashInput.value = receipt.record_hash;

      await fetchChainStatus();
    } catch (err) {
      logTerminal(`Notarization error: ${err.message}`, 'error');
      alert(`Blockchain notarization error: ${err.message}`);
    } finally {
      el.btnCommitBlockchain.disabled = false;
      el.notarizeSpinner.classList.add('hidden');
      el.notarizeBtnText.textContent = 'Mint Block & Commit to Blockchain';
    }
  }

  // --- Step 3 Verification: On-Chain Audit ---
  async function executeOnChainVerification(hashToVerify = null) {
    const targetHash = hashToVerify || (state.notarizationReceipt ? state.notarizationReceipt.record_hash : el.customRecordHashInput.value.trim());
    if (!targetHash) {
      alert('Please enter or notarize a record hash to verify.');
      return;
    }

    logTerminal(`Auditing record ${targetHash} against blockchain ledger...`, 'info');

    try {
      const resp = await fetch('/api/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_hash: targetHash })
      });

      if (!resp.ok) throw new Error(`Verification query failed: ${resp.status}`);

      const result = await resp.json();
      renderVerificationOutcome(result);

      if (result.verified) {
        logTerminal(`VERIFIED AUTHENTIC: Confirmed in Block #${result.block_index}. Cryptographic Merkle Root matches.`, 'success');
      } else {
        logTerminal(`INTEGRITY COMPROMISED: ${result.diagnostic_message}`, 'error');
      }
    } catch (err) {
      logTerminal(`Audit failure: ${err.message}`, 'error');
      alert(`Audit error: ${err.message}`);
    }
  }

  function renderVerificationOutcome(result) {
    el.verificationResultBox.classList.remove('hidden');

    if (result.verified) {
      el.verificationResultBox.className = 'verification-box valid';
      el.verificationResultBox.innerHTML = `
        <div class="verif-seal">
          <div class="verif-icon-circle">&#10003;</div>
          <div>
            <div class="verif-title">VERIFIED ON-CHAIN &amp; AUTHENTIC</div>
            <div class="verif-msg">
              Cryptographic integrity confirmed in <strong>Block #${result.block_index}</strong> (${result.formatted_time}).
              The SHA-256 record hash matches the on-chain Merkle root. Zero tampering detected.
            </div>
            <div style="margin-top:0.5rem; font-size:0.75rem; color:#a7f3d0;" class="mono">
              Block Hash: ${result.block_hash.substring(0, 32)}...
            </div>
          </div>
        </div>
      `;
    } else {
      el.verificationResultBox.className = 'verification-box compromised';
      el.verificationResultBox.innerHTML = `
        <div class="verif-seal">
          <div class="verif-icon-circle">&#9888;</div>
          <div>
            <div class="verif-title">INTEGRITY COMPROMISED / TAMPER DETECTED</div>
            <div class="verif-msg">
              <strong>${escapeHtml(result.status)}:</strong> ${escapeHtml(result.diagnostic_message)}
            </div>
            <div style="margin-top:0.5rem; font-size:0.75rem; color:#fca5a5;">
              The blockchain has identified that data was altered after the block was mined.
            </div>
          </div>
        </div>
      `;
    }
  }

  // --- Step 3 Demo: Tamper Simulation ---
  async function executeTamperSimulation() {
    if (!state.notarizationReceipt) return;

    const blockIndex = state.notarizationReceipt.block_index;
    logTerminal(`Executing Tamper Simulation on Block #${blockIndex}: Mutating post_url to spoofed address...`, 'warn');

    try {
      const resp = await fetch('/api/blockchain/simulate-tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_index: blockIndex,
          field_to_alter: 'post_url',
          altered_value: 'https://malicious-spoofed-url.org/fake-post'
        })
      });

      if (!resp.ok) throw new Error(`Tamper simulation call failed: ${resp.status}`);

      const data = await resp.json();
      state.tamperedBlockIndex = blockIndex;
      logTerminal(`Tamper applied! Notice detection result: ${data.detection_message}`, 'error');

      // Run verification immediately to show failure
      await executeOnChainVerification();
      await fetchChainStatus();
    } catch (err) {
      logTerminal(`Tamper simulation error: ${err.message}`, 'error');
    }
  }

  // --- Block Explorer Drawer ---
  async function openBlockExplorer() {
    logTerminal('Fetching full blockchain ledger for Block Explorer...', 'info');
    try {
      const resp = await fetch('/api/blockchain/ledger');
      if (resp.ok) {
        const data = await resp.json();
        renderExplorerBlocks(data.blocks);
        el.explorerDrawer.classList.add('open');
        el.drawerBackdrop.classList.remove('hidden');
      }
    } catch (err) {
      logTerminal(`Explorer fetch error: ${err.message}`, 'error');
    }
  }

  function renderExplorerBlocks(blocks) {
    el.explorerBlocksList.innerHTML = '';
    // Reverse to show newest block at the top
    blocks.slice().reverse().forEach(b => {
      const card = document.createElement('div');
      card.className = 'block-card';
      const txCount = b.transactions ? b.transactions.length : 0;
      card.innerHTML = `
        <div class="block-card-header">
          <span class="block-index-tag">Block #${b.index} ${b.index === 0 ? '(Genesis)' : ''}</span>
          <span class="block-time">${b.formatted_time || ''}</span>
        </div>
        <div class="block-field">
          <span class="field-name">Block Hash (SHA-256):</span>
          <span class="field-val mono">${b.hash}</span>
        </div>
        <div class="block-field">
          <span class="field-name">Previous Block Hash:</span>
          <span class="field-val mono">${b.previous_hash}</span>
        </div>
        <div class="block-field">
          <span class="field-name">Merkle Root:</span>
          <span class="field-val mono">${b.merkle_root || 'N/A'}</span>
        </div>
        <div class="block-field">
          <span class="field-name">Proof-of-Work Nonce:</span>
          <span class="field-val mono">${b.nonce}</span>
        </div>
        <div class="block-field" style="margin-top:0.5rem;">
          <span class="field-name">Transactions (${txCount}):</span>
          <pre class="field-val mono" style="font-size:0.7rem; max-height:100px; overflow:auto; background:rgba(0,0,0,0.3); padding:0.35rem; border-radius:4px;">${JSON.stringify(b.transactions, null, 2)}</pre>
        </div>
      `;
      el.explorerBlocksList.appendChild(card);
    });
  }

  function closeDrawers() {
    el.explorerDrawer.classList.remove('open');
    el.terminalDrawer.classList.remove('open');
    el.drawerBackdrop.classList.add('hidden');
  }

  // --- Step Navigation Helper ---
  function goToStep(stepNumber) {
    state.currentStep = stepNumber;

    [el.sectionStep1, el.sectionStep2, el.sectionStep3].forEach((sec, idx) => {
      sec.classList.toggle('active', idx + 1 === stepNumber);
    });

    [el.indicatorStep1, el.indicatorStep2, el.indicatorStep3].forEach((ind, idx) => {
      ind.classList.toggle('active', idx + 1 === stepNumber);
    });

    logTerminal(`Navigated to Step ${stepNumber}`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Setup Event Listeners ---
  function setupEventListeners() {
    // File browse & drag drop
    el.btnBrowseFile.addEventListener('click', () => el.fileInput.click());
    el.dropzone.addEventListener('click', (e) => {
      if (e.target !== el.btnBrowseFile && !state.selectedImageB64) {
        el.fileInput.click();
      }
    });

    el.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => loadImageData(event.target.result, file.name);
        reader.readAsDataURL(file);
      }
    });

    // Drag-drop events
    el.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.dropzone.classList.add('dragover');
    });
    el.dropzone.addEventListener('dragleave', () => el.dropzone.classList.remove('dragover'));
    el.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      el.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (event) => loadImageData(event.target.result, file.name);
        reader.readAsDataURL(file);
      }
    });

    // Step 1: Scan Face
    el.btnScanFace.addEventListener('click', executeFaceScan);
    el.btnGoToSearch.addEventListener('click', () => goToStep(2));

    // Copy Face Hash
    el.btnCopyFaceHash.addEventListener('click', () => {
      if (state.faceData) {
        navigator.clipboard.writeText(state.faceData.face_hash);
        logTerminal('Biometric hash copied to clipboard.', 'info');
      }
    });

    // Step 2: Search Actions
    el.btnExecuteSearch.addEventListener('click', executeSocialSearch);
    el.inputSearchHint.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeSocialSearch();
    });

    // Quick Search Suggestions Chips
    document.querySelectorAll('.query-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (query) {
          el.inputSearchHint.value = query;
          executeSocialSearch();
        }
      });
    });

    el.btnOpenLiveUrl.addEventListener('click', () => {
      if (state.selectedMatch && state.selectedMatch.post_url) {
        window.open(state.selectedMatch.post_url, '_blank', 'noopener,noreferrer');
      }
    });
    el.btnProceedToBlockchain.addEventListener('click', () => goToStep(3));

    // Step 3: Blockchain Actions
    el.btnCommitBlockchain.addEventListener('click', executeNotarization);
    el.btnReverifyOnchain.addEventListener('click', () => executeOnChainVerification());
    el.btnSimulateTamper.addEventListener('click', executeTamperSimulation);
    el.btnAuditHash.addEventListener('click', () => {
      const val = el.customRecordHashInput.value.trim();
      if (val) executeOnChainVerification(val);
    });

    // Stepper Navigation click
    el.indicatorStep1.addEventListener('click', () => goToStep(1));
    el.indicatorStep2.addEventListener('click', () => {
      if (state.faceData) goToStep(2);
    });
    el.indicatorStep3.addEventListener('click', () => {
      if (state.selectedMatch) goToStep(3);
    });

    // Drawers
    el.btnOpenExplorer.addEventListener('click', openBlockExplorer);
    el.btnCloseExplorer.addEventListener('click', closeDrawers);
    el.btnToggleTerminal.addEventListener('click', () => {
      el.terminalDrawer.classList.toggle('open');
      el.drawerBackdrop.classList.toggle('hidden', !el.terminalDrawer.classList.contains('open'));
    });
    el.btnCloseTerminal.addEventListener('click', closeDrawers);
    el.btnClearTerminal.addEventListener('click', () => { el.terminalLogs.innerHTML = ''; });
    el.drawerBackdrop.addEventListener('click', closeDrawers);
  }

  // Launch on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
