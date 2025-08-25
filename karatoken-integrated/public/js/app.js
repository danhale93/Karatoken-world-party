// MCP Client with WebSocket support
class MCPClient {
    constructor() {
        this.baseUrl = window.location.origin;
        this.activeJobs = new Map();
        this.jobHistory = [];
        this.pollingInterval = null;
        this.currentAudioSource = null;
        this.currentLyrics = null;
        this.socket = null;
        this.initializeWebSocket();
        this.initializeEventListeners();
        this.startJobPolling();
        this.loadJobHistory();
    }

    // Initialize WebSocket connection for real-time updates
    initializeWebSocket() {
        try {
            // Configure Socket.IO with reconnection settings
            this.socket = io({
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000
            });
            
            this.socket.on('connect', () => {
                console.log('WebSocket connected');
                this.showToast('Connected', 'Real-time updates enabled', 'success');
                // Clear any existing polling when WebSocket connects
                this.stopJobPolling();
            });

            this.socket.on('disconnect', (reason) => {
                console.log('WebSocket disconnected:', reason);
                this.showToast('Disconnected', 'Real-time updates disabled', 'warning');
                
                // If the disconnection was not initiated by the client, try to reconnect
                if (reason !== 'io client disconnect') {
                    console.log('Attempting to reconnect...');
                    this.socket.connect();
                }
                
                // Fall back to polling after a short delay
                setTimeout(() => {
                    if (!this.socket.connected) {
                        this.showToast('Using fallback', 'Using polling for updates', 'info');
                        this.startJobPolling();
                    }
                }, 2000);
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.showToast('Connection Error', 'Failed to connect to server', 'danger');
            });

            this.socket.on('jobUpdate', (data) => {
                try {
                    console.log('Job update received:', data);
                    if (!data || !data.jobId || !data.job) {
                        throw new Error('Invalid job update format');
                    }
                    this.handleJobUpdate(data.jobId, data.job);
                } catch (error) {
                    console.error('Error processing job update:', error);
                }
            });

            // Handle reconnection attempts
            this.socket.on('reconnect_attempt', (attempt) => {
                console.log(`Reconnection attempt ${attempt}`);
            });

            this.socket.on('reconnect_failed', () => {
                console.error('Failed to reconnect to WebSocket');
                this.showToast('Connection Lost', 'Using polling for updates', 'warning');
                this.startJobPolling();
            });

        } catch (error) {
            console.error('WebSocket initialization failed:', error);
            // Fall back to polling if WebSocket fails
            this.startJobPolling();
        }
    }

    // Handle real-time job updates from WebSocket or polling
    handleJobUpdate(jobId, job) {
        try {
            if (!jobId || !job) {
                console.error('Invalid job update: missing jobId or job data');
                return;
            }
            
            // Update active jobs map
            let isNewJob = false;
            const now = new Date().toISOString();
            
            // Ensure job has required fields
            job.updatedAt = now;
            if (!job.createdAt) job.createdAt = now;
            
            if (this.activeJobs.has(jobId)) {
                const jobInfo = this.activeJobs.get(jobId);
                this.updateJobStatus(jobId, job, jobInfo?.formId);
            } else {
                // Add to active jobs if not already there
                this.activeJobs.set(jobId, { job, formId: null });
                isNewJob = true;
                console.log(`New job detected: ${jobId} (${job.type})`);
            }
            
            // Update jobs list and UI
            this.updateJobsList();
            
            // Only update history for completed/failed jobs or new job updates
            if (isNewJob || job.status === 'completed' || job.status === 'failed') {
                this.updateJobHistory();
            }
            
            // Show toast notification for job state changes
            if (job.status === 'completed') {
                this.showToast('Job Completed', `Job ${jobId.substring(0, 8)}... has completed successfully!`, 'success');
            } else if (job.status === 'failed') {
                this.showToast('Job Failed', `Job ${jobId.substring(0, 8)}... failed: ${job.error || 'Unknown error'}`, 'danger');
            } else if (isNewJob) {
                this.showToast('Job Started', `New job ${jobId.substring(0, 8)}... started`, 'info');
            }
            
        } catch (error) {
            console.error('Error handling job update:', error);
            this.showToast('Error', 'Failed to process job update', 'danger');
        }
    }

    // Start job polling
    startJobPolling() {
        // Clear any existing polling interval
        this.stopJobPolling();
        
        // Only start polling if WebSocket is not available
        if (!this.socket || !this.socket.connected) {
            console.log('Starting job polling...');
            // Initial update
            this.updateJobsList().catch(error => {
                console.error('Initial job update failed:', error);
            });
            // Set up polling interval (every 10 seconds)
            this.pollingInterval = setInterval(() => {
                console.log('Polling for job updates...');
                this.updateJobsList().catch(error => {
                    console.error('Job update failed:', error);
                });
            }, 10000);
        }
    }
    
    // Stop job polling
    stopJobPolling() {
        if (this.pollingInterval) {
            console.log('Stopping job polling');
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Set up tab change handler for YouTube tab
        const youtubeTab = document.getElementById('youtube-tab');
        if (youtubeTab) {
            youtubeTab.addEventListener('shown.bs.tab', () => {
                // Only initialize YouTube search if not already initialized
                if (!this.youtubeSearch) {
                    this.youtubeSearch = new YouTubeSearch('youtubeSearchContainer', (video) => {
                        this.handleVideoSelect(video);
                    });
                }
            });
        }

        // Initialize USDB Search immediately since it's lightweight
        this.usdbSearch = new USDBSearch('usdbSearchContainer', (song) => {
            this.handleSongSelect(song);
        });
        
        // Initialize job list refresh buttons
        const refreshJobsBtn = document.getElementById('refreshJobsBtn');
        if (refreshJobsBtn) {
            refreshJobsBtn.addEventListener('click', () => this.updateJobsList());
        }
        
        const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
        if (refreshHistoryBtn) {
            refreshHistoryBtn.addEventListener('click', () => this.updateJobHistory());
        }
        
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearJobHistory());
        }

        // Genre Swap Form
        document.getElementById('genreSwapForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const audioUrl = document.getElementById('audioUrl').value;
            const genre = document.getElementById('genre').value;
            
            this.showProgress('genreSwap');
            this.updateStatus('genreSwap', 'Starting genre swap...');
            
            try {
                const response = await this.startJob('current', { 
                    audioUrl, 
                    genre 
                });
                
                this.trackJob('genre', response.jobId, 'genreSwap');
                this.updateStatus('genreSwap', 'Processing started. Please wait...');
                
            } catch (error) {
                this.showError('genreSwap', 'Failed to start job: ' + error.message);
            }
        });

        // Stylus Transfer Form
        document.getElementById('stylusForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const contentUrl = document.getElementById('contentUrl').value;
            const styleGenre = document.getElementById('styleGenre').value;
            
            this.showProgress('stylus');
            this.updateStatus('stylus', 'Starting style transfer...');
            
            try {
                const response = await this.startStylusJob({
                    contentUrl,
                    styleGenre
                });
                
                this.trackJob('stylus', response.jobId, 'stylus');
                this.updateStatus('stylus', 'Processing started. Please wait...');
                
            } catch (error) {
                this.showError('stylus', 'Failed to start job: ' + error.message);
            }
        });
    }

    // Show toast notification
    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.role = 'alert';
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.id = toastId;
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title}</strong><br>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 });
        bsToast.show();
        
        // Remove toast from DOM after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Start a genre swap job
    async startJob(type, data) {
        // Show processing modal
        this.showProcessingModal('Starting genre swap...');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/genre/swap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audioUrl: data.audioUrl,
                    targetGenre: data.genre,
                    karaokeMode: true
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start genre swap');
            }
            
            const result = await response.json();
            this.showToast('Genre swap started', 'Your audio is being processed.', 'success');
            return result;
            
        } catch (error) {
            console.error('Error starting genre swap:', error);
            this.showToast('Error', error.message || 'Failed to start genre swap', 'danger');
            throw error;
        } finally {
            this.hideProcessingModal();
        }
    }

    // Start a stylus transfer job
    async startStylusJob(data) {
        // Show processing modal
        this.showProcessingModal('Starting style transfer...');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/stylus/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentUrl: data.contentUrl,
                    styleGenre: data.styleGenre
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start style transfer');
            }
            
            const result = await response.json();
            this.showToast('Style transfer started', 'Your audio is being processed.', 'success');
            return result;
            
        } catch (error) {
            console.error('Error starting style transfer:', error);
        }
    }

    // Fetch jobs from the server
    async fetchJobs() {
        try {
            const response = await fetch(`${this.baseUrl}/api/jobs`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching jobs:', error);
            this.showToast('Error', 'Failed to fetch jobs', 'danger');
            return [];
        }
    }

    // Update jobs list in the UI
    async updateJobsList() {
        const jobsList = document.getElementById('jobsList');
        if (!jobsList) return;

        try {
            const jobs = await this.fetchJobs();
            
            // Sort jobs by creation time (newest first)
            jobs.sort((a, b) => {
                const timeA = new Date(a.createdAt || 0).getTime();
                const timeB = new Date(b.createdAt || 0).getTime();
                return timeB - timeA;
            });
            
            if (!jobs || jobs.length === 0) {
                jobsList.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <i class="bi bi-inbox me-2"></i>
                            No active jobs found.
                            <small class="d-block text-muted mt-1">Submit a new job to get started</small>
                        </td>
                    </tr>`;
                return;
            }
            
            // Clear and rebuild the jobs list
            let html = '';
            
            jobs.forEach(job => {
                const statusClass = this.getStatusClass(job.status);
                const progress = job.progress || 0;
                const jobType = job.type ? job.type.charAt(0).toUpperCase() + job.type.slice(1) : 'Unknown';
                
                html += `
                    <tr data-job-id="${job.id}">
                        <td class="text-nowrap">
                            <span class="font-monospace" title="${job.id}">${job.id.substring(0, 8)}...</span>
                        </td>
                        <td>${jobType}</td>
                        <td>
                            <span class="badge ${statusClass}">
                                ${job.status || 'queued'}
                            </span>
                        </td>
                        <td class="text-center">
                            <div class="d-flex align-items-center">
                                <div class="table-progress me-2">
                                    <div class="progress-bar ${statusClass.replace('badge-', 'bg-')}" 
                                         role="progressbar" 
                                         style="width: ${progress}%"
                                         aria-valuenow="${progress}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                    </div>
                                </div>
                                <span class="small">${progress}%</span>
                            </div>
                        </td>
                        <td class="text-end job-actions">
                            ${this.getJobActionsHtml(job)}
                        </td>
                    </tr>`;
            });
            
            // Update the jobs list
            jobsList.innerHTML = html;
            this.attachJobActionHandlers();
            
            // Update job count and timestamp
            const jobCount = jobs.length;
            document.getElementById('jobCount').textContent = jobCount;
            document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
            
        } catch (error) {
            console.error('Error fetching jobs:', error);
            jobsList.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Failed to load jobs. Please try again.
                    </td>
                </tr>`;
                
            // Update timestamp even on error
            document.getElementById('lastUpdated').textContent = 'Error: ' + new Date().toLocaleTimeString();
        }
        
        // Add event listeners for view buttons
        document.querySelectorAll('.view-job').forEach(button => {
            button.addEventListener('click', (e) => {
                const jobId = e.target.closest('button').dataset.jobId;
                this.viewJobDetails(jobId);
            });
        });
    }

    // View job details
    viewJobDetails(jobId) {
        // In a real app, this would show a modal with job details
        alert(`Viewing details for job: ${jobId}`);
    }

    // Helper methods for UI updates
    showProgress(formId) {
        document.getElementById(`${formId}Progress`).classList.remove('d-none');
        document.getElementById(`${formId}Result`).innerHTML = '';
    }

    updateStatus(formId, message) {
        const statusElement = document.getElementById(`${formId}Status`);
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    showResult(formId, result) {
        const resultElement = document.getElementById(`${formId}Result`);
        if (!resultElement) return;
        
        let html = `
            <div class="result-card success">
                <h5>Processing Complete!</h5>
                <p>Your audio has been processed successfully.</p>
        `;
        
        if (result.audioUrl) {
            html += `
                <div class="mt-2">
                    <audio controls class="audio-player">
                        <source src="${result.audioUrl}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
                <div class="mt-2">
                    <a href="${result.audioUrl}" class="btn btn-sm btn-outline-primary" download>
                        <i class="bi bi-download"></i> Download Audio
                    </a>
            `;
            
            if (result.lrcUrl) {
                html += `
                    <a href="${result.lrcUrl}" class="btn btn-sm btn-outline-secondary ms-2" download>
                        <i class="bi bi-file-text"></i> Download LRC
                    </a>
                `;
            }
            
            html += `</div>`;
        }
        
        html += `</div>`;
        resultElement.innerHTML = html;
    }

    showError(formId, message) {
        const resultElement = document.getElementById(`${formId}Result`);
        if (resultElement) {
            resultElement.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i> ${message}
                </div>
            `;
        }
    }

    getStatusMessage(status) {
        switch (status.status) {
            case 'queued': return 'Waiting in queue...';
            case 'processing': return `Processing... (${status.progress}%)`;
            case 'completed': return 'Processing complete!';
            case 'failed':
            case 'error': return `Error: ${status.error || 'Unknown error'}`;
            default: return 'Processing...';
        }
    }

    // Handle video selection from YouTube
    handleVideoSelect(video) {
        console.log('Selected video:', video);
        
        // Update form fields
        const audioUrlInput = document.getElementById('audioUrl');
        const songTitleInput = document.getElementById('songTitle');
        
        if (audioUrlInput) audioUrlInput.value = video.url;
        if (songTitleInput && video.title) songTitleInput.value = video.title;
        
        // Try to extract artist and title from YouTube video title
        if (video.title) {
            const titleParts = video.title.split(' - ');
            if (titleParts.length === 2) {
                const artistNameInput = document.getElementById('artistName');
                if (artistNameInput) artistNameInput.value = titleParts[0].trim();
                if (songTitleInput) songTitleInput.value = titleParts[1].trim();
            }
        }
        
        // Switch to Process tab
        const processTab = document.getElementById('process-tab');
        if (processTab) {
            const tab = new bootstrap.Tab(processTab);
            tab.show();
        }
        
        // Store current audio source
        this.currentAudioSource = {
            type: 'youtube',
            id: video.id,
            title: video.title,
            url: video.url,
            thumbnail: video.thumbnail
        };
        
        // Show success message
        this.showToast('YouTube video selected', 'You can now process the audio with genre swap or style transfer.', 'success');
    }

    // Handle song selection from USDB
    handleSongSelect(song) {
        console.log('Selected song:', song);
        
        // Auto-fill form fields
        const titleInput = document.getElementById('songTitle');
        const artistInput = document.getElementById('artistName');
        const genreSelect = document.getElementById('genre');
        const yearInput = document.getElementById('releaseYear');
        
        if (titleInput && song.title) titleInput.value = song.title;
        if (artistInput && song.artist) artistInput.value = song.artist;
        if (genreSelect && song.genre) {
            const genreValue = song.genre.toLowerCase();
            const option = Array.from(genreSelect.options).find(opt => 
                opt.value.toLowerCase() === genreValue
            );
            if (option) option.selected = true;
        }
        if (yearInput && song.year) yearInput.value = song.year;
        
        // Store lyrics for later use
        if (song.lyrics) {
            this.currentLyrics = song.lyrics;
        }
        
        // Switch to Process tab
        const processTab = document.getElementById('process-tab');
        if (processTab) {
            const tab = new bootstrap.Tab(processTab);
            tab.show();
        }
        
        // Show success message
        this.showToast('Song details loaded', 'Lyrics and metadata have been loaded from USDB.', 'success');
    }

    // Helper to show processing modal
    showProcessingModal(message = 'Processing...') {
        document.getElementById('processingMessage').textContent = message;
        const modal = new bootstrap.Modal(document.getElementById('processingModal'));
        modal.show();
    }

    // Helper to update processing progress
    updateProcessingProgress(progress, message = null) {
        const progressBar = document.getElementById('processingProgress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        if (message) {
            document.getElementById('processingMessage').textContent = message;
        }
    }

    // Helper to hide processing modal
    hideProcessingModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('processingModal'));
        if (modal) modal.hide();
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize MCP Client
    window.mcpClient = new MCPClient();
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
