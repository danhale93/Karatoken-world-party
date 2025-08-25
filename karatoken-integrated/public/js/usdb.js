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
                           placeholder="Search USDB for lyrics...">
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
                                    <h6>Lyrics Preview</h6>
                                    <div id="usdbLyricsPreview" class="lyrics-preview"></div>
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

        this.searchInput = document.getElementById('usdbSearchInput');
        this.resultsContainer = document.getElementById('usdbResults');
        this.previewContainer = document.getElementById('usdbPreview');
        
        document.getElementById('usdbSearchBtn').addEventListener('click', () => this.search());
        document.getElementById('usdbSelectBtn').addEventListener('click', () => this.selectCurrentSong());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
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
                <a href="#" class="list-group-item list-group-item-action" data-song-id="${song.id}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${song.title}</h6>
                        <small>${song.year || 'N/A'}</small>
                    </div>
                    <p class="mb-1">${song.artist}</p>
                    <small class="text-muted">
                        ${song.genre || 'Unknown genre'} • ${song.language || 'Unknown language'}
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
        
        // Update preview elements
        document.getElementById('usdbSongTitle').textContent = song.title;
        document.getElementById('usdbArtist').textContent = song.artist || '-';
        document.getElementById('usdbGenre').textContent = song.genre || '-';
        document.getElementById('usdbLanguage').textContent = song.language || '-';
        document.getElementById('usdbYear').textContent = song.year || '-';
        
        // Format and display lyrics preview
        const lyricsPreview = document.getElementById('usdbLyricsPreview');
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
