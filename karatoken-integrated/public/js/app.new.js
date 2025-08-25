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
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('WebSocket connected');
                this.showToast('Connected', 'Real-time updates enabled', 'success');
            });

            this.socket.on('disconnect', () => {
                console.log('WebSocket disconnected');
                this.showToast('Disconnected', 'Real-time updates disabled', 'warning');
            });

            this.socket.on('jobUpdate', (data) => {
                console.log('Job update received:', data);
                this.handleJobUpdate(data.jobId, data.job);
            });

        } catch (error) {
            console.error('WebSocket initialization failed:', error);
            // Fall back to polling if WebSocket fails
        }
    }

    // Handle real-time job updates from WebSocket
    handleJobUpdate(jobId, job) {
        // Update active jobs map
        let isNewJob = false;
        if (this.activeJobs.has(jobId)) {
            const jobInfo = this.activeJobs.get(jobId);
            this.updateJobStatus(jobId, job, jobInfo.formId);
        } else if (job.status === 'completed' || job.status === 'failed') {
            // Add to active jobs if not already there (for completed/failed jobs)
            this.activeJobs.set(jobId, { job, formId: null });
            isNewJob = true;
        }
        
        // Update jobs list and UI
        this.updateJobsList();
        
        // Only update history for completed/failed jobs or new job updates
        if (isNewJob || job.status === 'completed' || job.status === 'failed') {
            this.updateJobHistory();
        }
        
        // Show toast notification for job completion/failure
        if (job.status === 'completed') {
            this.showToast('Job Completed', `Job ${job.id} has completed successfully!`, 'success');
        } else if (job.status === 'failed') {
            this.showToast('Job Failed', `Job ${job.id} failed: ${job.error || 'Unknown error'}`, 'danger');
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Initialize YouTube Search
        this.youtubeSearch = new YouTubeSearch('youtubeSearchContainer', (video) => {
            this.handleVideoSelect(video);
        });

        // Initialize USDB Search
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
        const genreSwapForm = document.getElementById('genreSwapForm');
        if (genreSwapForm) {
            genreSwapForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const audioUrl = document.getElementById('audioUrl').value;
                const genre = document.getElementById('genre').value;
                
                try {
                    const result = await this.startJob('genre-swap', { audioUrl, genre });
                    this.showToast('Success', 'Genre swap job started', 'success');
                } catch (error) {
                    console.error('Error starting genre swap:', error);
                    this.showToast('Error', error.message || 'Failed to start genre swap', 'danger');
                }
            });
        }

        // Stylus Transfer Form
        const stylusForm = document.getElementById('stylusForm');
        if (stylusForm) {
            stylusForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const contentUrl = document.getElementById('contentUrl').value;
                const styleGenre = document.getElementById('styleGenre').value;
                
                try {
                    const result = await this.startJob('stylus-transfer', { contentUrl, styleGenre });
                    this.showToast('Success', 'Style transfer job started', 'success');
                } catch (error) {
                    console.error('Error starting style transfer:', error);
                    this.showToast('Error', error.message || 'Failed to start style transfer', 'danger');
                }
            });
        }
    }

    // Start a job
    async startJob(type, data) {
        try {
            const endpoint = type === 'genre-swap' ? '/api/genre/swap' : '/api/stylus/transfer';
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to start job');
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error(`Error starting ${type} job:`, error);
            throw error;
        }
    }

    // Load job history from local storage
    loadJobHistory() {
        try {
            const savedHistory = localStorage.getItem('karatokenJobHistory');
            if (savedHistory) {
                this.jobHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Error loading job history:', error);
        }
    }
    
    // Save job history to local storage
    saveJobHistory() {
        try {
            localStorage.setItem('karatokenJobHistory', JSON.stringify(this.jobHistory));
        } catch (error) {
            console.error('Error saving job history:', error);
        }
    }
    
    // Clear job history
    async clearJobHistory() {
        if (!confirm('Are you sure you want to clear job history? This action cannot be undone.')) {
            return;
        }
        
        this.jobHistory = [];
        this.saveJobHistory();
        this.updateJobHistory();
        this.showToast('Success', 'Job history cleared', 'success');
    }

    // Update job status
    updateJobStatus(jobId, jobData, formId) {
        const now = new Date().toISOString();
        
        if (!this.activeJobs.has(jobId)) {
            // New job
            this.activeJobs.set(jobId, { 
                job: { 
                    ...jobData, 
                    id: jobId,
                    createdAt: now,
                    updatedAt: now 
                }, 
                formId 
            });
        } else {
            // Update existing job
            const jobInfo = this.activeJobs.get(jobId);
            const previousStatus = jobInfo.job?.status;
            
            jobInfo.job = { 
                ...jobInfo.job, 
                ...jobData, 
                id: jobId,
                updatedAt: now,
                // Preserve created date if it exists
                createdAt: jobInfo.job?.createdAt || now
            };
            
            jobInfo.formId = formId || jobInfo.formId;
            this.activeJobs.set(jobId, jobInfo);
            
            // If status changed to completed or failed, update history
            if ((jobData.status === 'completed' || jobData.status === 'failed') && 
                previousStatus !== jobData.status) {
                this.addJobToHistory(jobInfo.job);
            }
        }
        
        // Update UI
        this.updateJobsList();
        
        // Only update history if this is a status change to completed/failed
        if (jobData.status === 'completed' || jobData.status === 'failed') {
            this.updateJobHistory();
        }
    }
    
    // Add a job to history
    addJobToHistory(job) {
        if (!job) return;
        
        // Check if job already exists in history
        const existingIndex = this.jobHistory.findIndex(j => j.id === job.id);
        
        // Create a clean copy of the job with only the properties we want to store
        const historyJob = {
            id: job.id,
            type: job.type,
            status: job.status,
            progress: job.progress,
            error: job.error,
            result: job.result,
            log: job.log ? [...job.log] : [],
            createdAt: job.createdAt || new Date().toISOString(),
            updatedAt: job.updatedAt || new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            // Update existing entry
            this.jobHistory[existingIndex] = historyJob;
        } else {
            // Add new entry to the beginning of the array
            this.jobHistory.unshift(historyJob);
            
            // Keep only the most recent 50 jobs
            if (this.jobHistory.length > 50) {
                this.jobHistory = this.jobHistory.slice(0, 50);
            }
        }
        
        // Save to local storage
        this.saveJobHistory();
    }

    // Update jobs list in the UI
    updateJobsList() {
        const jobsList = document.getElementById('activeJobsList');
        if (!jobsList) return;
        
        // Get active jobs (not completed or failed)
        const activeJobs = Array.from(this.activeJobs.entries())
            .filter(([_, jobInfo]) => {
                const status = jobInfo.job?.status?.toLowerCase();
                return status !== 'completed' && status !== 'failed' && status !== 'cancelled';
            })
            .sort((a, b) => {
                // Sort by updatedAt (newest first)
                const timeA = new Date(a[1]?.job?.updatedAt || 0);
                const timeB = new Date(b[1]?.job?.updatedAt || 0);
                return timeB - timeA;
            });
            
        if (activeJobs.length === 0) {
            jobsList.innerHTML = '<div class="text-muted text-center py-4">No active jobs</div>';
            return;
        }
        
        // Generate HTML for active jobs
        let html = '';
        activeJobs.forEach(([jobId, jobInfo]) => {
            const job = jobInfo.job;
            const progress = Math.min(100, Math.max(0, job.progress || 0));
            const progressClass = job.status === 'processing' ? 'progress-bar-striped progress-bar-animated' : '';
            const timeAgo = job.updatedAt ? this.formatTimeAgo(new Date(job.updatedAt)) : 'Just now';
            
            html += `
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center py-2">
                        <div class="d-flex align-items-center">
                            <span class="badge bg-${this.getStatusBadgeClass(job.status)} me-2">
                                ${job.type ? job.type.replace('-', ' ') : 'job'}
                            </span>
                            <small class="text-muted">${timeAgo}</small>
                        </div>
                        <span class="badge bg-${this.getStatusBadgeClass(job.status)} text-uppercase">
                            ${job.status || 'unknown'}
                        </span>
                    </div>
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between small text-muted mb-2">
                            <span>ID: ${job.id || 'N/A'}</span>
                            <span>${progress}% complete</span>
                        </div>
                        <div class="progress mb-3" style="height: 6px;">
                            <div class="progress-bar ${progressClass} bg-${this.getStatusBadgeClass(job.status)}" 
                                 role="progressbar" 
                                 style="width: ${progress}%" 
                                 aria-valuenow="${progress}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                        ${job.log && job.log.length > 0 ? `
                            <div class="log-output small bg-light p-2 mb-2 rounded" style="max-height: 100px; overflow-y: auto;">
                                ${job.log.slice(-3).map(entry => `<div class="text-truncate" title="${this.escapeHtml(entry)}">${this.escapeHtml(entry)}</div>`).join('')}
                            </div>
                        ` : ''}
                        ${job.error ? `
                            <div class="alert alert-danger py-1 px-2 mb-2 small">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                ${this.escapeHtml(job.error.length > 200 ? job.error.substring(0, 200) + '...' : job.error)}
                            </div>
                        ` : ''}
                        ${job.result ? `
                            <div class="mt-2 d-flex flex-wrap gap-2">
                                ${job.result.outputUrl ? `
                                    <a href="${job.result.outputUrl}" class="btn btn-sm btn-success" download>
                                        <i class="bi bi-download me-1"></i> Download
                                    </a>
                                ` : ''}
                                ${job.result.lrcUrl ? `
                                    <a href="${job.result.lrcUrl}" class="btn btn-sm btn-outline-primary" download>
                                        <i class="bi bi-file-text me-1"></i> Lyrics
                                    </a>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        jobsList.innerHTML = html;
    }

    // Update job history in the UI
    updateJobHistory() {
        const historyList = document.getElementById('jobHistoryList');
        if (!historyList) return;
        
        try {
            // Combine active completed/failed jobs with saved history
            const completedJobs = Array.from(this.activeJobs.values())
                .filter(jobInfo => 
                    jobInfo.job && 
                    (jobInfo.job.status === 'completed' || jobInfo.job.status === 'failed')
                )
                .map(jobInfo => jobInfo.job);
                
            // Sort by updatedAt (newest first) and take most recent 50
            const allHistory = [...completedJobs, ...this.jobHistory]
                .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
                .slice(0, 50);
            
            if (allHistory.length === 0) {
                historyList.innerHTML = '<div class="text-muted text-center py-4">No job history available</div>';
                return;
            }
            
            // Generate HTML for job history
            let html = '';
            allHistory.forEach(job => {
                const timeAgo = job.updatedAt ? this.formatTimeAgo(new Date(job.updatedAt)) : 'Recently';
                const isFailed = job.status === 'failed';
                
                html += `
                    <div class="list-group-item list-group-item-action border-start-0 border-end-0 py-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-${this.getStatusBadgeClass(job.status)} me-2">
                                    ${job.type ? job.type.replace('-', ' ') : 'job'}
                                </span>
                                <small class="text-muted">${timeAgo}</small>
                            </div>
                            <span class="badge bg-${this.getStatusBadgeClass(job.status)} text-uppercase">
                                ${job.status || 'unknown'}
                            </span>
                        </div>
                        <div class="mt-2 small">
                            <div class="text-truncate mb-1">
                                <span class="text-muted">ID:</span> ${job.id || 'N/A'}
                            </div>
                            ${isFailed && job.error ? `
                                <div class="text-danger small">
                                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                    ${this.escapeHtml(job.error.length > 100 ? job.error.substring(0, 100) + '...' : job.error)}
                                </div>
                            ` : ''}
                            ${job.result ? `
                                <div class="mt-1 d-flex flex-wrap gap-2">
                                    ${job.result.outputUrl ? `
                                        <a href="${job.result.outputUrl}" class="btn btn-xs btn-outline-success" download>
                                            <i class="bi bi-download"></i> Download
                                        </a>
                                    ` : ''}
                                    ${job.result.lrcUrl ? `
                                        <a href="${job.result.lrcUrl}" class="btn btn-xs btn-outline-primary" download>
                                            <i class="bi bi-file-text"></i> Lyrics
                                        </a>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            
            historyList.innerHTML = html;
            
        } catch (error) {
            console.error('Error updating job history:', error);
            historyList.innerHTML = `
                <div class="alert alert-warning py-2">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    Failed to load job history
                </div>
            `;
        }
    }

    // Start polling for job updates
    startJobPolling() {
        // Only start polling if not already polling and WebSocket is not available
        if (!this.pollingInterval && (!this.socket || !this.socket.connected)) {
            this.pollingInterval = setInterval(() => this.fetchJobs(), 5000);
        }
    }

    // Stop polling for job updates
    stopJobPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Fetch jobs from the server
    async fetchJobs() {
        try {
            const response = await fetch(`${this.baseUrl}/jobs`);
            if (!response.ok) throw new Error('Failed to fetch jobs');
            
            const jobs = await response.json();
            return jobs || [];
            
        } catch (error) {
            console.error('Error fetching jobs:', error);
            this.showToast('Error', 'Failed to fetch jobs', 'danger');
            return [];
        }
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
                    <strong>${title}</strong><br>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Initialize and show the toast
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 });
        bsToast.show();
        
        // Remove the toast from DOM after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Escape HTML to prevent XSS
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Format time ago string
    formatTimeAgo(date) {
        if (!(date instanceof Date) || isNaN(date)) return '';
        
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = Math.floor(seconds / 31536000);
        
        if (interval >= 1) return interval + 'y ago';
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + 'mo ago';
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + 'd ago';
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + 'h ago';
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + 'm ago';
        return 'Just now';
    }

    // Get status badge class based on job status
    getStatusBadgeClass(status) {
        if (!status) return 'secondary';
        
        const statusMap = {
            'completed': 'success',
            'failed': 'danger',
            'processing': 'info',
            'pending': 'warning',
            'queued': 'primary',
            'cancelled': 'dark'
        };
        
        return statusMap[status.toLowerCase()] || 'secondary';
    }

    // Handle video selection from YouTube
    handleVideoSelect(video) {
        console.log('Selected video:', video);
        // Auto-fill the audio URL field in the genre swap form
        const audioUrlInput = document.getElementById('audioUrl');
        if (audioUrlInput) {
            audioUrlInput.value = video.url;
        }
    }

    // Handle song selection from USDB
    handleSongSelect(song) {
        console.log('Selected song:', song);
        // Auto-fill form fields based on the selected song
        const audioUrlInput = document.getElementById('contentUrl');
        if (audioUrlInput) {
            audioUrlInput.value = song.audioUrl || '';
        }
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
