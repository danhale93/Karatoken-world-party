class USDBSearch {
    constructor(containerId, onSongSelect) {
        this.container = document.getElementById(containerId);
        this.onSongSelect = onSongSelect;
        this.initialize();
    }

    initialize() {
        this.container.innerHTML = `
            <div class="usdb-search">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" id="usdbSearchInput" 
                           placeholder="Search USDB for lyrics..." aria-label="Search UltraStar Database for lyrics">
                    <button class="btn btn-primary" type="button" id="usdbSearchBtn">
                        <i class="bi bi-search"></i> Search
                    </button>
                </div>
                <div id="usdbResults">
                    <div class="text-muted text-center p-3">
                        Search for songs in the UltraStar Database
                    </div>
                </div>
                <div id="usdbPreview" class="mt-3 d-none">
                    <div class="card">
                        <div class="card-header">
                            <h5 id="usdbSongTitle">Song Title</h5>
                            <div id="usdbSongInfo" class="text-muted small"></div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h6 class="m-0">Lyrics Preview</h6>
                                        <button id="usdbCopyLyricsBtn" class="btn btn-sm btn-outline-secondary" aria-label="Copy USDB lyrics preview to clipboard">
                                            <i class="bi bi-clipboard" id="usdbCopyIcon"></i> <span id="usdbCopyText">Copy</span>
                                        </button>
                                    </div>
                                    <div id="usdbLyricsPreview" class="lyrics-preview" tabindex="0" aria-label="USDB lyrics preview output"></div>
                                </div>
                                <div class="col-md-6">
                                    <h6>Song Details</h6>
                                    <dl class="row small">
                                        <dt class="col-4">Artist:</dt>
                                        <dd class="col-8" id="usdbArtist">-</dd>
                                        
                                        <dt class="col-4">Genre:</dt>
                                        <dd class="col-8" id="usdbGenre">-</dd>
                                        
                                        <dt class="col-4">Language:</dt>
                                        <dd class="col-8" id="usdbLanguage">-</dd>
                                        
                                        <dt class="col-4">Year:</dt>
                                        <dd class="col-8" id="usdbYear">-</dd>
                                    </dl>
                                    <button id="usdbSelectBtn" class="btn btn-primary w-100">
                                        Select This Song
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.searchInput = this.container.querySelector('#usdbSearchInput');
        this.resultsContainer = this.container.querySelector('#usdbResults');
        this.previewContainer = this.container.querySelector('#usdbPreview');
        
        this.container.querySelector('#usdbSearchBtn').addEventListener('click', () => this.search());
        this.container.querySelector('#usdbSelectBtn').addEventListener('click', () => this.selectCurrentSong());
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.search();
        });

        // Copy lyrics event listener with interactive feedback (using querySelector scoped to container)
        const copyBtn = this.container.querySelector('#usdbCopyLyricsBtn');
        copyBtn?.addEventListener('click', async () => {
            if (this.currentSong && this.currentSong.preview) {
                try {
                    await navigator.clipboard.writeText(this.currentSong.preview);
                    const copyIcon = this.container.querySelector('#usdbCopyIcon');
                    const copyText = this.container.querySelector('#usdbCopyText');
                    if (copyIcon && copyText) {
                        copyIcon.className = 'bi bi-check-lg text-success';
                        copyText.textContent = 'Copied!';
                        setTimeout(() => {
                            copyIcon.className = 'bi bi-clipboard';
                            copyText.textContent = 'Copy';
                        }, 2000);
                    }
                } catch (err) {
                    console.error('Failed to copy text:', err);
                }
            }
        });
    }

    async search() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        this.resultsContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"></div></div>';
        this.previewContainer.classList.add('d-none');

        try {
            // In a real implementation, you would call your backend API to search USDB
            // For now, we'll use a mock response
            const mockResponse = {
                songs: [
                    {
                        id: '12345',
                        title: 'Example Song',
                        artist: 'Example Artist',
                        genre: 'Pop',
                        language: 'English',
                        year: '2023',
                        preview: "[00:00.00]This is a sample lyric line\n[00:05.00]This is another line\n[00:10.00]..."
                    },
                    {
                        id: '12346',
                        title: 'Another Song',
                        artist: 'Another Artist',
                        genre: 'Rock',
                        language: 'English',
                        year: '2022',
                        preview: "[00:00.00]Rock lyrics here\n[00:04.50]With timing information\n[00:08.20]..."
                    }
                ]
            };

            this.displayResults(mockResponse.songs);
        } catch (error) {
            console.error('USDB search failed:', error);
            this.resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error searching USDB: ${error.message}
                </div>
            `;
        }
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    displayResults(songs) {
        if (!songs || songs.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="alert alert-info">
                    No songs found. Try a different search term.
                </div>
            `;
            return;
        }

        let html = '<div class="list-group">';
        songs.forEach(song => {
            html += `
                <a href="#" class="list-group-item list-group-item-action" data-song-id="${this.escapeHTML(song.id)}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${this.escapeHTML(song.title)}</h6>
                        <small>${this.escapeHTML(song.year || 'N/A')}</small>
                    </div>
                    <p class="mb-1">${this.escapeHTML(song.artist)}</p>
                    <small class="text-muted">
                        ${this.escapeHTML(song.genre || 'Unknown genre')} • ${this.escapeHTML(song.language || 'Unknown language')}
                    </small>
                </a>
            `;
        });
        html += '</div>';
        
        this.resultsContainer.innerHTML = html;

        // Add click handlers
        this.container.querySelectorAll('[data-song-id]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const songId = e.currentTarget.dataset.songId;
                const song = songs.find(s => s.id === songId);
                if (song) {
                    this.showSongPreview(song);
                }
            });
        });
    }

    showSongPreview(song) {
        this.currentSong = song;
        
        // Update preview elements scoped to the container
        this.container.querySelector('#usdbSongTitle').textContent = song.title;
        this.container.querySelector('#usdbArtist').textContent = song.artist || '-';
        this.container.querySelector('#usdbGenre').textContent = song.genre || '-';
        this.container.querySelector('#usdbLanguage').textContent = song.language || '-';
        this.container.querySelector('#usdbYear').textContent = song.year || '-';
        
        // Format and display lyrics preview
        const lyricsPreview = this.container.querySelector('#usdbLyricsPreview');
        if (song.preview) {
            const previewLines = song.preview.split('\n').slice(0, 5).join('\n');
            lyricsPreview.textContent = previewLines;
            if (song.preview.split('\n').length > 5) {
                lyricsPreview.innerHTML += '\n<span class="text-muted">...</span>';
            }
        } else {
            lyricsPreview.textContent = 'No preview available';
        }
        
        // Show preview container and scroll to it
        this.previewContainer.classList.remove('d-none');
        this.previewContainer.scrollIntoView({ behavior: 'smooth' });
    }

    selectCurrentSong() {
        if (this.currentSong) {
            this.onSongSelect({
                id: this.currentSong.id,
                title: this.currentSong.title,
                artist: this.currentSong.artist,
                genre: this.currentSong.genre,
                language: this.currentSong.language,
                year: this.currentSong.year,
                lyrics: this.currentSong.preview
            });
        }
    }
}
