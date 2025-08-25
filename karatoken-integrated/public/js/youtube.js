class YouTubeSearch {
    constructor(containerId, onVideoSelect) {
        this.container = document.getElementById(containerId);
        this.onVideoSelect = onVideoSelect;
        this.initialize();
    }

    initialize() {
        this.container.innerHTML = `
            <div class="youtube-search">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" id="youtubeSearchInput" 
                           placeholder="Search YouTube...">
                    <button class="btn btn-primary" type="button" id="youtubeSearchBtn">
                        <i class="bi bi-search"></i> Search
                    </button>
                </div>
                <div id="youtubeResults" class="row g-3"></div>
                <div id="youtubePlayer" class="mt-3 d-none">
                    <div class="ratio ratio-16x9">
                        <div id="player"></div>
                    </div>
                </div>
            </div>
        `;

        this.searchInput = document.getElementById('youtubeSearchInput');
        this.resultsContainer = document.getElementById('youtubeResults');
        this.playerContainer = document.getElementById('youtubePlayer');
        
        document.getElementById('youtubeSearchBtn').addEventListener('click', () => this.search());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });

        this.loadYouTubeAPI();
    }

    loadYouTubeAPI() {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            this.player = new YT.Player('player', {
                height: '360',
                width: '640',
                playerVars: {
                    'playsinline': 1
                },
                events: {
                    'onReady': (event) => this.onPlayerReady(event),
                    'onStateChange': (event) => this.onPlayerStateChange(event)
                }
            });
        };
    }

    onPlayerReady(event) {
        console.log('YouTube player ready');
    }

    onPlayerStateChange(event) {
        // Handle player state changes
    }

    async search() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        this.resultsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"></div></div>';

        try {
            const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.ok) {
                throw new Error(data.error || 'Search failed');
            }

            this.displayResults(data.items);
        } catch (error) {
            console.error('YouTube search failed:', error);
            this.resultsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Error searching YouTube: ${error.message}
                    </div>
                </div>
            `;
        }
    }

    displayResults(videos) {
        this.resultsContainer.innerHTML = '';

        if (!videos || videos.length === 0) {
            this.resultsContainer.innerHTML = '<div class="col-12">No videos found</div>';
            return;
        }

        videos.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'col-md-6 col-lg-4';
            videoElement.innerHTML = `
                <div class="card h-100">
                    <img src="${video.thumbnail}"
                         class="card-img-top"
                         alt="${video.title}">
                    <div class="card-body">
                        <h6 class="card-title">${video.title}</h6>
                        <p class="card-text text-muted small">${video.channel || 'Unknown Channel'}</p>
                        ${video.duration ? `<small class="text-muted">Duration: ${this.formatDuration(video.duration)}</small>` : ''}
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-sm btn-primary select-video"
                                data-video-id="${video.id}"
                                data-title="${video.title}"
                                data-url="${video.url}">
                            Select
                        </button>
                        <button class="btn btn-sm btn-outline-secondary preview-video"
                                data-video-id="${video.id}">
                            Preview
                        </button>
                    </div>
                </div>
            `;
            this.resultsContainer.appendChild(videoElement);
        });

        // Add event listeners
        this.container.querySelectorAll('.select-video').forEach(button => {
            button.addEventListener('click', (e) => {
                const videoId = e.target.dataset.videoId;
                const title = e.target.dataset.title;
                const url = e.target.dataset.url;
                this.onVideoSelect({
                    id: videoId,
                    title: title,
                    url: url
                });
            });
        });

        this.container.querySelectorAll('.preview-video').forEach(button => {
            button.addEventListener('click', (e) => {
                const videoId = e.target.dataset.videoId;
                this.previewVideo(videoId);
            });
        });
    }

    // Format duration from seconds to MM:SS
    formatDuration(seconds) {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    previewVideo(videoId) {
        this.playerContainer.classList.remove('d-none');
        this.player.loadVideoById(videoId);
        this.player.playVideo();
        
        // Scroll to player
        this.playerContainer.scrollIntoView({ behavior: 'smooth' });
    }
}
