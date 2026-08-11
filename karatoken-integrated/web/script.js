(() => {
  const $ = (sel) => document.querySelector(sel);
  const healthBtn = $('#btn-health');
  const healthOut = $('#health-output');
  const cbBtn = $('#btn-callback');
  const cbOut = $('#callback-output');

  const ytQueryInput = document.getElementById('yt-query');
  const ytSearchBtn = document.getElementById('btn-yt-search');
  const ytSearchOut = document.getElementById('yt-search-out');
  const ytUrlInput = document.getElementById('yt-url');
  const ytDlBtn = document.getElementById('btn-yt-download');
  const ytDlOut = document.getElementById('yt-dl-out');
  const genreAudioUrlInput = document.getElementById('genre-audio-url');
  const genreTargetInput = document.getElementById('genre-target');
  const genreSwapBtn = document.getElementById('btn-genre-swap');
  const genreSwapOut = document.getElementById('genre-swap-out');
  const genreProgressBar = document.getElementById('genre-progress-bar');
  const progressStatus = document.getElementById('progress-status');
  const progressPercent = document.getElementById('progress-percent');
  const progressDetails = document.getElementById('progress-details');
  const genreAudioEl = document.getElementById('genre-audio');
  const genreLrcOut = document.getElementById('genre-lrc');
  const audioPreviewEl = document.getElementById('audio-preview');
  const audioErrorEl = document.getElementById('audio-error');
  const copyLrcBtn = document.getElementById('btn-copy-lrc');
  const copyText = document.getElementById('copy-text');

  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to trigger genre swap
    if (e.ctrlKey && e.key === 'Enter' && genreSwapBtn && !genreSwapBtn.disabled) {
      e.preventDefault();
      swapGenre();
    }
  });

  // Audio URL change handler
  genreAudioUrlInput?.addEventListener('change', updateAudioPreview);
  genreAudioUrlInput?.addEventListener('paste', (e) => {
    // Add small delay to allow the paste to complete
    setTimeout(updateAudioPreview, 100);
  });

  // Enter keydown listeners for accessible form submission
  ytQueryInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ytSearch();
    }
  });

  ytUrlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ytDownload();
    }
  });

  document.getElementById('code')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendCallback();
    }
  });

  document.getElementById('state')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendCallback();
    }
  });

  // Copy LRC lyrics to clipboard when copy button is clicked
  copyLrcBtn?.addEventListener('click', async () => {
    const text = genreLrcOut?.textContent;
    if (!text || text === 'LRC will appear here…' || text === 'Failed to load LRC') return;
    try {
      await navigator.clipboard.writeText(text);
      if (copyText) {
        copyText.textContent = 'Copied!';
      }
      copyLrcBtn.setAttribute('aria-label', 'Lyrics copied successfully');
      copyLrcBtn.style.setProperty('background', 'var(--success)', 'important');
      copyLrcBtn.style.setProperty('color', 'white', 'important');
      copyLrcBtn.style.setProperty('border-color', 'var(--success)', 'important');
      setTimeout(() => {
        if (copyText) {
          copyText.textContent = 'Copy LRC';
        }
        copyLrcBtn.setAttribute('aria-label', 'Copy LRC lyrics to clipboard');
        copyLrcBtn.style.removeProperty('background');
        copyLrcBtn.style.removeProperty('color');
        copyLrcBtn.style.removeProperty('border-color');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  });

  // Update audio preview when URL changes
  async function updateAudioPreview() {
    const url = genreAudioUrlInput.value.trim();
    if (!url) {
      audioPreviewEl.style.display = 'none';
      audioErrorEl.style.display = 'none';
      return;
    }

    try {
      // Test if the URL is valid and accessible
      const testUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
      const response = await fetch(testUrl, { method: 'HEAD' });
      
      if (!response.ok) throw new Error('Audio not found');
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('audio/')) {
        throw new Error('URL does not point to an audio file');
      }

      // Update audio source and show player
      audioPreviewEl.src = url.startsWith('http') ? url : `${API_BASE}${url}`;
      audioPreviewEl.load();
      audioPreviewEl.style.display = 'block';
      audioErrorEl.style.display = 'none';
    } catch (error) {
      console.error('Audio preview error:', error);
      audioPreviewEl.style.display = 'none';
      audioErrorEl.style.display = 'block';
      audioErrorEl.textContent = `Error: ${error.message}`;
    }
  }

  // Point to our simple backend server on port 3100
  const API_BASE = 'http://localhost:3100';
  const ORIGIN = (typeof window !== 'undefined' && window.location && /^https?:/.test(window.location.origin))
    ? window.location.origin
    : API_BASE;

  function toDlUrl(u) {
    if (!u) return null;
    try {
      // Build a relative /dl path so it works via the current origin/proxy
      const abs = u;
      const relPath = (abs.startsWith('http') ? new URL(abs).pathname : abs);
      const rel = relPath.replace(/^\/?tmp\//, '');
      return `/dl/${rel}`;
    } catch (_) {
      return null;
    }
  }

  async function checkHealth() {
    healthOut.textContent = 'Checking…';
    if (healthBtn) {
      healthBtn.disabled = true;
      healthBtn.classList.add('button-loading');
      healthBtn.setAttribute('aria-busy', 'true');
    }
    try {
      const res = await fetch(`${API_BASE}/health`);
      const json = await res.json();
      healthOut.textContent = JSON.stringify(json, null, 2);
    } catch (e) {
      healthOut.textContent = 'Error: ' + (e?.message || e);
    } finally {
      if (healthBtn) {
        healthBtn.disabled = false;
        healthBtn.classList.remove('button-loading');
        healthBtn.removeAttribute('aria-busy');
      }
    }
  }

  async function sendCallback() {
    cbOut.textContent = 'Sending…';
    if (cbBtn) {
      cbBtn.disabled = true;
      cbBtn.classList.add('button-loading');
      cbBtn.setAttribute('aria-busy', 'true');
    }
    const code = document.getElementById('code').value || 'TEST_CODE';
    const state = document.getElementById('state').value || 'XYZ';
    const url = `${API_BASE}/api/spotify/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      cbOut.textContent = JSON.stringify(json, null, 2);
    } catch (e) {
      cbOut.textContent = 'Error: ' + (e?.message || e);
    } finally {
      if (cbBtn) {
        cbBtn.disabled = false;
        cbBtn.classList.remove('button-loading');
        cbBtn.removeAttribute('aria-busy');
      }
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function createVideoElement(video) {
    const div = document.createElement('div');
    div.className = 'video-result';
    div.setAttribute('tabindex', '0');
    div.setAttribute('role', 'button');
    // Sanitize values for security attributes and innerHTML to prevent DOM-based XSS
    const safeTitle = escapeHTML(video.title);
    const safeChannel = escapeHTML(video.channel || 'Unknown');
    const safeThumbnail = escapeHTML(video.thumbnail);
    const safeDuration = escapeHTML(formatDuration(video.duration));

    div.setAttribute('aria-label', `Select video: ${safeTitle} by ${safeChannel}`);
    div.innerHTML = `
      <div class="video-thumbnail">
        <img src="${safeThumbnail}" alt="" aria-hidden="true" loading="lazy">
        <span class="duration">${safeDuration}</span>
      </div>
      <div class="video-details">
        <h4 class="video-title">${safeTitle}</h4>
        <div class="video-meta">
          <span class="channel">${safeChannel}</span>
          <span class="duration">${safeDuration}</span>
        </div>
      </div>
    `;
    const selectVideo = () => {
      ytUrlInput.value = video.url;
      // Auto-select this video in the list
      document.querySelectorAll('.video-result').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
    };
    div.addEventListener('click', selectVideo);
    div.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectVideo();
      }
    });
    return div;
  }

  async function ytSearch() {
    const q = (ytQueryInput?.value || '').trim();
    if (!q) {
      ytSearchOut.innerHTML = '<div class="error">Please enter a search term</div>';
      return;
    }

    if (ytSearchBtn) {
      ytSearchBtn.disabled = true;
      ytSearchBtn.classList.add('button-loading');
      ytSearchBtn.setAttribute('aria-busy', 'true');
    }
    ytSearchOut.innerHTML = `
      <div class="search-status">
        <div class="spinner"></div>
        <span>Searching YouTube for "${escapeHTML(q)}"...</span>
      </div>
    `;

    try {
      const response = await fetch(`${API_BASE}/api/youtube/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      if (!data.items || data.items.length === 0) {
        ytSearchOut.innerHTML = `
          <div class="no-results">
            No videos found for "${escapeHTML(q)}"
            <button class="retry-btn" id="retry-search">Try again</button>
          </div>
        `;
        document.getElementById('retry-search')?.addEventListener('click', ytSearch);
        return;
      }

      const resultsDiv = document.createElement('div');
      resultsDiv.className = 'video-results';
      
      data.items.forEach(video => {
        resultsDiv.appendChild(createVideoElement(video));
      });

      ytSearchOut.innerHTML = '';
      ytSearchOut.appendChild(resultsDiv);

      // Auto-select first result if URL field is empty
      if (data.items.length > 0 && !ytUrlInput.value) {
        ytUrlInput.value = data.items[0].url;
        resultsDiv.firstChild.classList.add('selected');
      }

    } catch (error) {
      console.error('YouTube search error:', error);
      ytSearchOut.innerHTML = `
        <div class="error">
          Error: ${escapeHTML(error.message || 'Failed to search YouTube')}
          <button class="retry-btn" id="retry-search">Retry</button>
        </div>
      `;
      document.getElementById('retry-search')?.addEventListener('click', ytSearch);
    } finally {
      if (ytSearchBtn) {
        ytSearchBtn.disabled = false;
        ytSearchBtn.classList.remove('button-loading');
        ytSearchBtn.removeAttribute('aria-busy');
      }
    }
  }

  async function ytDownload() {
    const url = (ytUrlInput?.value || '').trim();
    if (!url) {
      ytDlOut.innerHTML = '<div class="error">Please enter or select a YouTube URL</div>';
      return;
    }

    // Validate URL format
    if (!url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
      ytDlOut.innerHTML = '<div class="error">Please enter a valid YouTube URL</div>';
      return;
    }

    const downloadBtn = ytDlBtn;
    const originalText = downloadBtn.textContent;
    
    try {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `
        <span class="spinner"></span>
        <span>Downloading...</span>
      `;
      
      ytDlOut.innerHTML = `
        <div class="download-status">
          <div class="spinner"></div>
          <span>Downloading audio from YouTube...</span>
        </div>
      `;

      const response = await fetch(`${API_BASE}/api/youtube/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      // Auto-fill Genre Swap audio URL field with the web-accessible URL
      if (data.url && genreAudioUrlInput) {
        genreAudioUrlInput.value = data.url;
        // Trigger audio preview update
        updateAudioPreview();
        updateSwapButtonState();
        highlightInput(genreAudioUrlInput);
      } else if (data.file && genreAudioUrlInput) {
        // Fallback to local path (less ideal for web usage)
        genreAudioUrlInput.value = data.file;
        updateSwapButtonState();
        highlightInput(genreAudioUrlInput);
      }

      ytDlOut.innerHTML = `
        <div class="success">
          <span class="success-icon">✓</span>
          <span>Download complete! Audio ready for genre swap.</span>
        </div>
      `;

    } catch (error) {
      console.error('Download error:', error);
      ytDlOut.innerHTML = `
        <div class="error">
          <span>Error: ${escapeHTML(error.message || 'Failed to download video')}</span>
          <button class="retry-btn" id="retry-download">Retry</button>
        </div>
      `;
      document.getElementById('retry-download')?.addEventListener('click', ytDownload);
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = originalText;
    }
  }

  async function pollGenreStatus(statusUrl, startTime) {
    let lastProgress = 0;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    try {
      // Poll backend job status until completed or failed
      while (true) {
        try {
          const res = await fetch(`${API_BASE}${statusUrl}`, {
            headers: { 'Cache-Control': 'no-cache' }
          });

          if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

          const js = await res.json();
          if (!js.ok) throw new Error(js.error || 'Status failed');

          const job = js.job || {};
          const progress = typeof job.progress === 'number' ? job.progress : lastProgress;
          lastProgress = progress;
          retryCount = 0; // Reset retry counter on successful fetch

          // Update progress and status
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const elapsedStr = elapsed > 60
            ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
            : `${elapsed}s`;

          let status = job.status || 'Processing';
          let details = job.message || '';
          
          // Add more context to the status
          if (status === 'processing') {
            status = 'Processing';
            if (job.stage) {
              details = `Step: ${job.stage.charAt(0).toUpperCase() + job.stage.slice(1)}`;
            }
          } else if (status === 'queued') {
            status = 'Queued';
            details = 'Waiting for a worker to become available...';
          }

          // Update progress UI
          updateProgress(
            progress,
            status,
            details + (details ? ' • ' : '') + `Elapsed: ${elapsedStr}`
          );

          // Handle completed job
          if (job.status === 'completed') {
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            updateProgress(100, 'Complete', `Processing completed in ${totalTime}s`);
            const outRel = job.outputUrl
              ? (job.outputUrl.startsWith('http') ? new URL(job.outputUrl).pathname : job.outputUrl)
              : null;
            const lrcRel = job.lrcUrl
              ? (job.lrcUrl.startsWith('http') ? new URL(job.lrcUrl).pathname : job.lrcUrl)
              : null;
            // Prefer relative URLs so they work through the preview proxy
            let outUrl = outRel && outRel.startsWith('/') ? outRel : (outRel ? `/${outRel}` : null);
            let lrcUrl = lrcRel && lrcRel.startsWith('/') ? lrcRel : (lrcRel ? `/${lrcRel}` : null);
            // Optionally validate existence
            if (outUrl) {
              try { const h = await fetch(outUrl, { method: 'HEAD' }); if (!h.ok) throw new Error('bad'); } catch (_) {}
            }
            if (lrcUrl) {
              try { const h = await fetch(lrcUrl, { method: 'HEAD' }); if (!h.ok) throw new Error('bad'); } catch (_) {}
            }
            const outName = outUrl ? (outUrl.split('/').pop() || 'output.wav') : null;
            const lrcName = lrcUrl ? (lrcUrl.split('/').pop() || 'lyrics.lrc') : null;
            const outDl = toDlUrl(outUrl);
            const lrcDl = toDlUrl(lrcUrl);
            // Render clickable links to outputs
            const lines = [];
            lines.push(`<div><strong>Status:</strong> ${job.status} (${job.progress}%)</div>`);
            if (outUrl) {
              if (outDl) {
                lines.push(`<div><a href="${outDl}" download="${outName}">Download Output</a> <small><a href="${outUrl}" target="_blank" rel="noopener">(open)</a></small></div>`);
              } else {
                lines.push(`<div><a href="${outUrl}" download="${outName}" target="_blank" rel="noopener">Download Output</a></div>`);
              }
            }
            if (lrcUrl) {
              if (lrcDl) {
                lines.push(`<div><a href="${lrcDl}" download="${lrcName}">Download LRC</a> <small><a href="${lrcUrl}" target="_blank" rel="noopener">(open)</a></small></div>`);
              } else {
                lines.push(`<div><a href="${lrcUrl}" download="${lrcName}" target="_blank" rel="noopener">Download LRC</a></div>`);
              }
            }
            genreSwapOut.innerHTML = lines.join('\n');

            // Show inline audio player for the result
            if (genreAudioEl && outUrl) {
              genreAudioEl.src = outUrl;
              genreAudioEl.style.display = 'block';
              genreAudioEl.load().catch(e => {
                console.error('Failed to load result audio:', e);
                const msg = document.createElement('div');
                msg.className = 'error-message';
                msg.textContent = 'Audio preview failed to load. Try downloading the file instead.';
                genreSwapOut.appendChild(msg);
              });
            }

            // Fetch and display LRC text
            if (genreLrcOut && lrcUrl) {
              try {
                const lrcRes = await fetch(lrcUrl);
                const lrcText = await lrcRes.text();
                genreLrcOut.textContent = lrcText;
                genreLrcOut.style.display = '';
                if (copyLrcBtn) copyLrcBtn.style.display = 'inline-flex';
              } catch (_) {
                genreLrcOut.textContent = 'Failed to load LRC';
                genreLrcOut.style.display = '';
                if (copyLrcBtn) copyLrcBtn.style.display = 'none';
              }
            }
            break;
          } else if (job.status === 'failed') {
            updateProgress(0, 'Failed', job.error || 'An error occurred during processing');
            genreSwapOut.textContent = `Error: ${job.error || 'Unknown error'}\n\n${JSON.stringify(js, null, 2)}`;
            break;
          } else {
            // Show detailed status while processing
            genreSwapOut.textContent = `Processing... (${progress}%)\n${JSON.stringify(js, null, 2)}`;

            // Wait before polling again with exponential backoff for retries
            const delay = Math.min(5000, 1000 * Math.pow(2, retryCount));
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } catch (e) {
          console.error('Polling error:', e);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            updateProgress(0, 'Error', 'Failed to get updates from server');
            genreSwapOut.textContent = `Error: Failed to check status after ${maxRetries} attempts: ${e?.message || e}`;
            break;
          }

          updateProgress(
            lastProgress,
            'Connecting...',
            `Retrying (${retryCount}/${maxRetries}) - ${e?.message || 'Connection error'}`
          );
        }
      }
    } finally {
      if (genreSwapBtn) {
        genreSwapBtn.disabled = false;
        genreSwapBtn.classList.remove('button-loading');
        genreSwapBtn.removeAttribute('aria-busy');
      }
    }
  }

  async function swapGenre() {
    const audioUrl = (genreAudioUrlInput?.value || '').trim();
    const targetGenre = (genreTargetInput?.value || '').trim();
    
    if (!audioUrl) {
      genreSwapOut.textContent = 'Enter an audio URL';
      return;
    }
    if (!targetGenre) {
      genreSwapOut.textContent = 'Enter a target genre';
      return;
    }

    // Reset UI
    if (genreSwapBtn) {
      genreSwapBtn.disabled = true;
      genreSwapBtn.classList.add('button-loading');
      genreSwapBtn.setAttribute('aria-busy', 'true');
    }
    genreSwapOut.textContent = 'Starting genre swap...';
    updateProgress(0, 'Starting...', 'Preparing to process your request');
    genreAudioEl.style.display = 'none';
    genreLrcOut.style.display = 'none';
    if (copyLrcBtn) copyLrcBtn.style.display = 'none';

    try {
      // Validate URL first
      if (!isValidUrl(audioUrl) && !audioUrl.startsWith('/')) {
        throw new Error('Please enter a valid URL or path');
      }

      const startTime = Date.now();
      const res = await fetch(`${API_BASE}/api/genre/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl,
          targetGenre,
        }),
      });
      
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Swap failed');
      
      // Start polling for status if status URL is provided
      if (json.statusUrl) {
        updateProgress(5, 'Processing...', 'Initializing audio processing');
        pollGenreStatus(json.statusUrl, startTime);
      } else {
        updateProgress(100, 'Complete', 'Processing complete');
        genreSwapOut.textContent = 'Started processing, but no status URL provided';
        if (genreSwapBtn) {
          genreSwapBtn.disabled = false;
          genreSwapBtn.classList.remove('button-loading');
          genreSwapBtn.removeAttribute('aria-busy');
        }
      }
    } catch (e) {
      console.error('Genre swap error:', e);
      updateProgress(0, 'Error', 'An error occurred');
      genreSwapOut.textContent = `Error: ${e?.message || e}`;
      if (genreSwapBtn) {
        genreSwapBtn.disabled = false;
        genreSwapBtn.classList.remove('button-loading');
        genreSwapBtn.removeAttribute('aria-busy');
      }
    }
  }

  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  function updateProgress(progress, status, details = '') {
    if (progress !== undefined) {
      const percent = Math.round(progress);
      genreProgressBar.style.setProperty('--progress', `${percent}%`);
      progressPercent.textContent = `${percent}%`;
      
      // Add working animation when progress is between 0-99%
      if (percent > 0 && percent < 100) {
        genreProgressBar.classList.add('working');
      } else {
        genreProgressBar.classList.remove('working');
      }
    }
    
    if (status !== undefined) {
      progressStatus.textContent = status;
    }
    
    if (details !== undefined) {
      progressDetails.textContent = details;
    }
  }

  // Initialize UI
  updateProgress(0, 'Ready', 'Enter an audio URL and target genre');
  
  // Set up event listeners
  healthBtn?.addEventListener('click', checkHealth);
  cbBtn?.addEventListener('click', sendCallback);
  ytSearchBtn?.addEventListener('click', ytSearch);
  ytDlBtn?.addEventListener('click', ytDownload);
  genreSwapBtn?.addEventListener('click', swapGenre);
  
  // Enable/disable swap button based on input
  function updateSwapButtonState() {
    const hasAudio = genreAudioUrlInput.value.trim() !== '';
    const hasGenre = genreTargetInput.value.trim() !== '';
    genreSwapBtn.disabled = !(hasAudio && hasGenre);

    if (genreSwapBtn.disabled) {
      if (!hasAudio && !hasGenre) {
        genreSwapBtn.setAttribute('title', 'Please provide an Audio URL and Target Genre to process the swap');
        genreSwapBtn.setAttribute('aria-label', 'Please provide an Audio URL and Target Genre to process the swap');
      } else if (!hasAudio) {
        genreSwapBtn.setAttribute('title', 'Please provide a valid Audio URL');
        genreSwapBtn.setAttribute('aria-label', 'Please provide a valid Audio URL');
      } else {
        genreSwapBtn.setAttribute('title', 'Please enter a target genre');
        genreSwapBtn.setAttribute('aria-label', 'Please enter a target genre');
      }
    } else {
      genreSwapBtn.setAttribute('title', 'Swap Genre (Ctrl + Enter)');
      genreSwapBtn.setAttribute('aria-label', 'Swap Genre (Ctrl + Enter)');
    }
  }

  // Highlight input with a pleasant visual pulse
  function highlightInput(input) {
    if (!input) return;
    input.focus();
    input.style.setProperty('border-color', 'var(--success)', 'important');
    input.style.setProperty('box-shadow', '0 0 0 4px rgba(16, 185, 129, 0.25)', 'important');
    input.style.setProperty('transition', 'all 0.3s ease-in-out', 'important');

    setTimeout(() => {
      input.style.removeProperty('border-color');
      input.style.removeProperty('box-shadow');
      input.style.removeProperty('transition');
    }, 2000);
  }
  
  genreAudioUrlInput?.addEventListener('input', updateSwapButtonState);
  genreTargetInput?.addEventListener('input', updateSwapButtonState);
  updateSwapButtonState();
})();
