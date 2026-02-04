/**
 * PHOTO STORM - Ultimate Edition v2.0
 * Fixed & Upgraded Photo Experience
 * 12SinhLN Class Memories
 */

class PhotoStorm {
    constructor() {
        this.container = document.getElementById('stormContainer');
        this.photos = [];
        this.allData = [];
        this.speed = 1;
        this.category = 'all';
        this.searchId = null;
        this.uploadType = 'collective';
        this.uploadMSHS = null;
        this.lastTime = 0;
        this.paused = false;
        this.gridMode = false;
        this.pinterestMode = false;
        this.pinterestScrollSpeed = 1;
        this.currentSpotlight = -1;
        this.slideshow = false;
        this.slideshowInterval = null;
        this.isCreatingVideo = false;
        this.loadedCount = 0;
        this.totalPhotos = 40;
        this.pinterestAnimationId = null;

        this.settings = {
            autoSlide: false,
            slideDuration: 5000,
            showHints: true,
            photoRotation: true,
            depthEffect: true
        };

        this.students = {};
        for (let i = 1; i <= 48; i++) {
            const id = '2324' + String(i).padStart(2, '0');
            this.students[id] = { name: `Học sinh 12SinhLN - ${id}`, photos: [] };
        }

        this.init();
    }

    init() {
        this.bindEvents();
        this.bindKeyboard();
        this.loadAllPhotos();
        this.animate();
    }

    bindEvents() {
        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.speed = parseFloat(e.target.value);
                document.getElementById('speedValue').textContent = this.speed.toFixed(1) + 'x';
            });
        }

        // Header buttons
        document.getElementById('shuffleBtn')?.addEventListener('click', () => this.shuffle());
        document.getElementById('videoBtn')?.addEventListener('click', () => this.openModal('videoModal'));
        document.getElementById('uploadBtn')?.addEventListener('click', () => this.openModal('uploadModal'));
        document.getElementById('gridBtn')?.addEventListener('click', () => this.togglePinterestMode());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('slideshowBtn')?.addEventListener('click', () => this.startSlideshow());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openModal('settingsModal'));
        document.getElementById('randomBtn')?.addEventListener('click', () => this.spotlightRandom());
        document.getElementById('pinterestBtn')?.addEventListener('click', () => this.togglePinterestMode());

        // Close modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.classList.remove('open');
                    this.stopSlideshow();
                }
            });
        });

        document.querySelectorAll('.modal').forEach(m => {
            m.addEventListener('click', (e) => {
                if (e.target === m) {
                    m.classList.remove('open');
                    this.stopSlideshow();
                }
            });
        });

        // Spotlight navigation
        document.getElementById('spotlightPrev')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.spotlightNavigate(-1);
        });
        document.getElementById('spotlightNext')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.spotlightNavigate(1);
        });
        document.getElementById('downloadPhotoBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadCurrentPhoto();
        });

        // Video buttons
        document.getElementById('previewBtn')?.addEventListener('click', () => this.makeVideo(false));
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.makeVideo(true));

        // Theme selection
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Upload tabs
        document.querySelectorAll('.upload-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.uploadType = tab.dataset.type;
                const input = document.getElementById('mshsInput');
                if (input) {
                    input.style.display = this.uploadType === 'personal' ? 'block' : 'none';
                }
            });
        });

        // Drop area
        const drop = document.getElementById('dropArea');
        if (drop) {
            drop.addEventListener('click', () => document.getElementById('fileInput')?.click());
            drop.addEventListener('dragover', (e) => {
                e.preventDefault();
                drop.classList.add('drag-over');
            });
            drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
            drop.addEventListener('drop', (e) => {
                e.preventDefault();
                drop.classList.remove('drag-over');
                this.uploadFiles(e.dataTransfer.files);
            });
        }

        document.getElementById('fileInput')?.addEventListener('change', (e) => this.uploadFiles(e.target.files));
        document.getElementById('mshsInput')?.addEventListener('input', (e) => this.uploadMSHS = e.target.value.trim());

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.category = btn.dataset.filter;
                this.searchId = null;
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = '';
                this.applyFilter();
            });
        });

        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            this.searchId = (val.length === 6 && this.students[val]) ? val : null;
            this.applyFilter();
        });

        // Settings toggles
        document.querySelectorAll('.toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('on');
                const setting = toggle.dataset.setting;
                if (setting) {
                    this.settings[setting] = toggle.classList.contains('on');
                }
            });
        });

        // Touch support for mobile
        this.setupTouchGestures();
    }

    setupTouchGestures() {
        let startX = 0, startY = 0;
        const spotlightModal = document.getElementById('spotlightModal');

        if (spotlightModal) {
            spotlightModal.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });

            spotlightModal.addEventListener('touchend', (e) => {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = endX - startX;
                const diffY = Math.abs(endY - startY);

                if (Math.abs(diffX) > 50 && diffY < 100) {
                    if (diffX > 0) {
                        this.spotlightNavigate(-1);
                    } else {
                        this.spotlightNavigate(1);
                    }
                }
            }, { passive: true });
        }
    }

    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'g':
                case 'G':
                    this.togglePinterestMode();
                    break;
                case 'f':
                case 'F':
                    this.toggleFullscreen();
                    break;
                case 'r':
                case 'R':
                    this.spotlightRandom();
                    break;
                case 's':
                case 'S':
                    this.shuffle();
                    break;
                case 'p':
                case 'P':
                    this.togglePinterestMode();
                    break;
                case 'Escape':
                    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
                    this.stopSlideshow();
                    break;
                case 'ArrowLeft':
                    if (document.getElementById('spotlightModal')?.classList.contains('open')) {
                        e.preventDefault();
                        this.spotlightNavigate(-1);
                    }
                    break;
                case 'ArrowRight':
                    if (document.getElementById('spotlightModal')?.classList.contains('open')) {
                        e.preventDefault();
                        this.spotlightNavigate(1);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.speed = Math.min(3, this.speed + 0.2);
                    this.updateSpeedUI();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.speed = Math.max(0.2, this.speed - 0.2);
                    this.updateSpeedUI();
                    break;
            }
        });
    }

    updateSpeedUI() {
        const slider = document.getElementById('speedSlider');
        const value = document.getElementById('speedValue');
        if (slider) slider.value = this.speed;
        if (value) value.textContent = this.speed.toFixed(1) + 'x';
        this.showToast(`Tốc độ: ${this.speed.toFixed(1)}x`, 'success');
    }

    loadAllPhotos() {
        // Always fetch from photos.json (loads from Google Drive)
        console.log('Fetching photos.json...');
        fetch('Pic/photos.json')
            .then(response => {
                if (!response.ok) throw new Error('Could not load photos.json');
                return response.json();
            })
            .then(config => {
                this.loadPhotosFromConfig(config);
            })
            .catch(error => {
                console.error('Failed to load photos.json:', error);
                this.showToast('Không thể tải ảnh. Vui lòng kiểm tra kết nối.', 'error');
            });
    }

    loadPhotosFromConfig(config) {
        const photoList = [];
        const driveBaseUrl = config.driveBaseUrl || 'https://lh3.googleusercontent.com/d/';

        // Load collective photos (in root Pic folder)
        if (config.collective && Array.isArray(config.collective)) {
            config.collective.forEach(filename => {
                photoList.push({
                    path: `Pic/${filename}`,
                    type: 'collective',
                    mshs: null,
                    filename: filename
                });
            });
        }

        // Load personal photos (in MSHS subfolders)
        if (config.personal && typeof config.personal === 'object') {
            Object.entries(config.personal).forEach(([mshs, files]) => {
                if (Array.isArray(files)) {
                    files.forEach(filename => {
                        photoList.push({
                            path: `Pic/${mshs}/${filename}`,
                            type: 'personal',
                            mshs: mshs,
                            filename: filename
                        });
                    });
                }
            });
        }

        // Load photos from Google Drive
        if (config.drive && Array.isArray(config.drive)) {
            config.drive.forEach((item, idx) => {
                // Item can be just a fileId string or an object with more info
                if (typeof item === 'string') {
                    photoList.push({
                        path: driveBaseUrl + item,
                        type: 'collective',
                        mshs: null,
                        filename: `drive_${idx + 1}`
                    });
                } else if (typeof item === 'object') {
                    photoList.push({
                        path: driveBaseUrl + item.id,
                        type: item.type || 'collective',
                        mshs: item.mshs || null,
                        filename: item.name || `drive_${idx + 1}`
                    });
                }
            });
        }

        this.totalPhotos = photoList.length;
        this.loadedCount = 0;

        if (photoList.length === 0) {
            console.warn('No photos found in config');
            this.showToast('Không tìm thấy ảnh trong cấu hình', 'error');
            return;
        }

        // Batch parallel loading - load 5 images at a time
        const BATCH_SIZE = 5;
        const BATCH_DELAY = 300; // ms between batches

        const loadBatch = (startIndex) => {
            if (startIndex >= photoList.length) return;

            const endIndex = Math.min(startIndex + BATCH_SIZE, photoList.length);
            let batchCompleted = 0;

            for (let i = startIndex; i < endIndex; i++) {
                const photo = photoList[i];
                const img = new Image();
                img.crossOrigin = 'anonymous';

                const onComplete = (success) => {
                    this.loadedCount++;
                    this.updateLoadingProgress();
                    batchCompleted++;

                    if (success) {
                        const data = {
                            src: img.src,
                            type: photo.type,
                            mshs: photo.mshs,
                            filename: photo.filename,
                            width: img.naturalWidth,
                            height: img.naturalHeight
                        };
                        this.allData.push(data);

                        if (photo.mshs && this.students[photo.mshs]) {
                            this.students[photo.mshs].photos.push(data);
                        }

                        this.createCard(data);
                    }

                    // Start next batch when current batch is done
                    if (batchCompleted >= (endIndex - startIndex)) {
                        setTimeout(() => loadBatch(endIndex), BATCH_DELAY);
                    }
                };

                img.onload = () => onComplete(true);
                img.onerror = () => {
                    console.warn(`Failed to load: ${photo.path}`);
                    onComplete(false);
                };

                img.src = photo.path;
            }
        };

        // Start loading first batch
        loadBatch(0);
    }

    updateLoadingProgress() {
        const progress = Math.round((this.loadedCount / this.totalPhotos) * 100);
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (this.loadedCount >= this.totalPhotos) {
            setTimeout(() => {
                document.querySelector('.loading-overlay')?.classList.add('hidden');
                this.showToast(`Đã tải ${this.allData.length} ảnh`, 'success');
            }, 500);
        }
    }

    uploadFiles(files) {
        const mshs = this.uploadType === 'personal' ? this.uploadMSHS : null;

        if (this.uploadType === 'personal' && (!mshs || !this.students[mshs])) {
            this.showToast('Vui lòng nhập MSHS hợp lệ (232401-232448)', 'error');
            return;
        }

        if (!files || files.length === 0) {
            this.showToast('Vui lòng chọn ảnh', 'error');
            return;
        }

        let count = 0;
        const totalFiles = files.length;

        Array.from(files).forEach((file, i) => {
            if (!file.type.startsWith('image/')) {
                this.showToast(`${file.name} không phải ảnh`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const data = {
                        src: e.target.result,
                        type: this.uploadType,
                        mshs,
                        filename: file.name,
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    };
                    this.allData.push(data);
                    if (mshs) this.students[mshs].photos.push(data);
                    setTimeout(() => this.createCard(data), i * 80);
                    count++;
                    if (count === totalFiles) {
                        this.showToast(`Đã thêm ${count} ảnh`, 'success');
                        this.closeModal('uploadModal');
                    }
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                this.showToast(`Lỗi đọc file ${file.name}`, 'error');
            };
            reader.readAsDataURL(file);
        });
    }

    createCard(data) {
        const card = document.createElement('div');
        card.className = 'photo-card';

        // Better sizing based on aspect ratio
        const baseSize = 140 + Math.random() * 120;
        let width, height;
        if (data.width && data.height) {
            const aspect = data.width / data.height;
            if (aspect > 1) {
                width = baseSize;
                height = baseSize / aspect;
            } else {
                height = baseSize;
                width = baseSize * aspect;
            }
        } else {
            width = baseSize;
            height = baseSize * (0.7 + Math.random() * 0.5);
        }

        card.style.width = `${width}px`;
        card.style.height = `${height}px`;

        const img = document.createElement('img');
        img.src = data.src;
        img.loading = 'lazy';
        img.alt = data.filename || 'Kỷ niệm 12SinhLN';
        card.appendChild(img);

        const pos = this.randomEdge(width, height);
        card.style.left = `${pos.x}px`;
        card.style.top = `${pos.y}px`;

        const depth = 0.2 + Math.random() * 0.8;
        const vel = this.randomVelocity(depth);

        card.dataset.vx = vel.x;
        card.dataset.vy = vel.y;
        card.dataset.depth = depth;
        card.dataset.w = width;
        card.dataset.h = height;
        card.dataset.type = data.type;
        card.dataset.mshs = data.mshs || '';
        card.dataset.src = data.src;
        card.dataset.offset = Math.random() * Math.PI * 2;
        card.dataset.rot = this.settings.photoRotation ? (Math.random() - 0.5) * 8 : 0;
        card.dataset.rotSpeed = (Math.random() - 0.5) * 0.02;
        card.dataset.index = this.photos.length;

        card.style.zIndex = Math.floor(depth * 100);
        card.style.opacity = '0';
        card.style.transform = `scale(${0.4 + depth * 0.6}) rotate(${card.dataset.rot}deg)`;

        card.addEventListener('click', () => this.spotlight(card));

        this.container.appendChild(card);
        this.photos.push(card);

        // Fade in animation
        requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.6s ease-out';
            card.style.opacity = String(0.3 + depth * 0.7);
        });

        this.updateCounts();
    }

    randomEdge(w, h) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 100;
        const edge = Math.floor(Math.random() * 4);

        switch (edge) {
            case 0: // Top
                return { x: margin + Math.random() * (vw - w - margin * 2), y: -h - margin };
            case 1: // Right
                return { x: vw + margin, y: margin + Math.random() * (vh - h - margin * 2) };
            case 2: // Bottom
                return { x: margin + Math.random() * (vw - w - margin * 2), y: vh + margin };
            default: // Left
                return { x: -w - margin, y: margin + Math.random() * (vh - h - margin * 2) };
        }
    }

    randomVelocity(depth) {
        const baseSpeed = 0.3 + depth * 0.7;
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.cos(angle) * baseSpeed,
            y: Math.sin(angle) * baseSpeed
        };
    }

    animate(time = 0) {
        if (!this.paused && !this.gridMode && !this.isCreatingVideo) {
            const delta = Math.min((time - this.lastTime) / 16.67, 3);
            this.lastTime = time;

            const w = window.innerWidth;
            const h = window.innerHeight;
            const t = time * 0.001;

            this.photos.forEach(card => {
                const opacity = parseFloat(card.style.opacity);
                if (opacity < 0.1) return;

                let x = parseFloat(card.style.left) || 0;
                let y = parseFloat(card.style.top) || 0;
                let vx = parseFloat(card.dataset.vx) || 0;
                let vy = parseFloat(card.dataset.vy) || 0;
                const depth = parseFloat(card.dataset.depth) || 0.5;
                const cw = parseFloat(card.dataset.w) || 150;
                const ch = parseFloat(card.dataset.h) || 150;
                let rot = parseFloat(card.dataset.rot) || 0;
                const rotSpeed = parseFloat(card.dataset.rotSpeed) || 0;
                const offset = parseFloat(card.dataset.offset) || 0;

                // Movement
                x += vx * this.speed * delta;
                y += vy * this.speed * delta;

                // Subtle floating motion
                if (this.settings.depthEffect) {
                    x += Math.sin(t * 0.25 + offset) * 0.08 * this.speed * delta;
                    y += Math.cos(t * 0.18 + offset * 1.3) * 0.05 * this.speed * delta;
                }

                // Rotation
                if (this.settings.photoRotation) {
                    rot += rotSpeed * this.speed * delta;
                    if (rot > 15) rot = 15;
                    if (rot < -15) rot = -15;
                }

                // Boundary check with margin
                const margin = 150;
                if (x < -cw - margin || x > w + margin || y < -ch - margin || y > h + margin) {
                    const pos = this.randomEdge(cw, ch);
                    x = pos.x;
                    y = pos.y;
                    const vel = this.randomVelocity(depth);
                    vx = vel.x;
                    vy = vel.y;
                    rot = this.settings.photoRotation ? (Math.random() - 0.5) * 10 : 0;
                    card.dataset.rotSpeed = (Math.random() - 0.5) * 0.02;
                }

                card.style.left = `${x}px`;
                card.style.top = `${y}px`;
                card.style.transform = `scale(${0.4 + depth * 0.6}) rotate(${rot}deg)`;
                card.dataset.vx = vx;
                card.dataset.vy = vy;
                card.dataset.rot = rot;
            });
        }

        requestAnimationFrame((t) => this.animate(t));
    }

    applyFilter() {
        let visibleCount = 0;

        this.photos.forEach(card => {
            const type = card.dataset.type;
            const mshs = card.dataset.mshs;
            const depth = parseFloat(card.dataset.depth);

            let show = true;
            if (this.searchId) {
                show = mshs === this.searchId;
            } else if (this.category === 'collective') {
                show = type === 'collective';
            } else if (this.category === 'personal') {
                show = type === 'personal';
            }

            if (show) visibleCount++;

            card.style.transition = 'opacity 0.4s ease-out';
            card.style.opacity = show ? String(0.3 + depth * 0.7) : '0.05';
            card.style.pointerEvents = show ? 'auto' : 'none';
        });

        if (this.searchId && visibleCount === 0) {
            this.showToast('Không tìm thấy MSHS này', 'error');
        } else if (this.searchId && visibleCount > 0) {
            this.showToast(`Tìm thấy ${visibleCount} ảnh`, 'success');
        }
    }

    shuffle() {
        // First burst - scatter photos
        this.photos.forEach(card => {
            const angle = Math.random() * Math.PI * 2;
            const force = 6 + Math.random() * 10;
            card.dataset.vx = String(Math.cos(angle) * force);
            card.dataset.vy = String(Math.sin(angle) * force);
            card.dataset.rotSpeed = String((Math.random() - 0.5) * 0.1);
        });

        this.showToast('Đang xáo trộn...', 'success');

        // Then calm down
        setTimeout(() => {
            this.photos.forEach(card => {
                const depth = parseFloat(card.dataset.depth);
                const vel = this.randomVelocity(depth);
                card.dataset.vx = vel.x;
                card.dataset.vy = vel.y;
                card.dataset.rotSpeed = String((Math.random() - 0.5) * 0.02);
            });
        }, 2500);
    }

    togglePause() {
        this.paused = !this.paused;
        document.body.classList.toggle('paused', this.paused);
        document.getElementById('pauseBtn')?.classList.toggle('active', this.paused);

        const icon = document.getElementById('pauseIcon');
        if (icon) {
            icon.innerHTML = this.paused
                ? '<polygon points="5 3 19 12 5 21 5 3"/>'
                : '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        }

        this.showToast(this.paused ? 'Đã tạm dừng' : 'Tiếp tục', 'success');
    }

    toggleGrid() {
        this.gridMode = !this.gridMode;
        document.body.classList.toggle('grid-mode', this.gridMode);
        document.getElementById('gridBtn')?.classList.toggle('active', this.gridMode);

        if (this.gridMode) {
            // Sort by index for consistent grid order
            const sortedCards = [...this.photos].sort((a, b) =>
                parseInt(a.dataset.index) - parseInt(b.dataset.index)
            );
            sortedCards.forEach(card => {
                this.container.appendChild(card);
            });
        }

        this.showToast(this.gridMode ? 'Chế độ lưới' : 'Chế độ bay', 'success');
    }

    togglePinterestMode() {
        this.pinterestMode = !this.pinterestMode;
        document.body.classList.toggle('pinterest-mode', this.pinterestMode);
        document.getElementById('pinterestBtn')?.classList.toggle('active', this.pinterestMode);

        if (this.pinterestMode) {
            // Disable grid mode if active
            if (this.gridMode) {
                this.gridMode = false;
                document.body.classList.remove('grid-mode');
                document.getElementById('gridBtn')?.classList.remove('active');
            }

            this.createPinterestLayout();
        } else {
            this.destroyPinterestLayout();
        }

        this.showToast(this.pinterestMode ? 'Chế độ Pinterest' : 'Chế độ bay', 'success');
    }

    createPinterestLayout() {
        // Create Pinterest container
        let pinterestContainer = document.querySelector('.pinterest-container');
        if (!pinterestContainer) {
            pinterestContainer = document.createElement('div');
            pinterestContainer.className = 'pinterest-container';
            this.container.appendChild(pinterestContainer);
        }
        pinterestContainer.innerHTML = '';

        // Create scroll wrapper
        const scrollWrapper = document.createElement('div');
        scrollWrapper.className = 'pinterest-scroll-wrapper';
        pinterestContainer.appendChild(scrollWrapper);

        // Get visible photos and shuffle
        const visible = this.getVisiblePhotos();
        const shuffled = [...visible].sort(() => Math.random() - 0.5);

        // Create 4 columns for masonry effect
        const numColumns = 4;
        const columns = [];
        const columnHeights = new Array(numColumns).fill(0);

        for (let i = 0; i < numColumns; i++) {
            const column = document.createElement('div');
            column.className = 'pinterest-column';
            columns.push(column);
            scrollWrapper.appendChild(column);
        }

        // Distribute photos across columns (shortest column first for balanced layout)
        shuffled.forEach((card, idx) => {
            // Find the shortest column
            const shortestIdx = columnHeights.indexOf(Math.min(...columnHeights));
            const item = this.createPinterestItem(card, idx);
            columns[shortestIdx].appendChild(item);

            // Estimate height based on aspect ratio
            const w = parseFloat(card.dataset.w) || 200;
            const h = parseFloat(card.dataset.h) || 200;
            columnHeights[shortestIdx] += (h / w) * 250 + 20;
        });

        // Create control bar
        this.createPinterestControls(visible.length);

        // Enable smooth scroll with mouse wheel
        this.setupPinterestScroll(pinterestContainer);

        // Animate items in with stagger
        setTimeout(() => {
            const items = pinterestContainer.querySelectorAll('.pinterest-item');
            items.forEach((item, i) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, i * 30);
            });
        }, 100);

        // Hide original photo cards
        this.photos.forEach(card => {
            card.style.display = 'none';
        });
    }

    createPinterestControls(count) {
        // Remove existing controls
        document.querySelector('.pinterest-controls')?.remove();

        const controls = document.createElement('div');
        controls.className = 'pinterest-controls';
        controls.innerHTML = `
            <span class="pinterest-count"><strong>${count}</strong> ảnh</span>
            <div class="pinterest-divider"></div>
            <button class="btn btn-ghost btn-icon" id="pinterestShuffleBtn" title="Xáo trộn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="16 3 21 3 21 8"/>
                    <line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="21 16 21 21 16 21"/>
                    <line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
            </button>
            <button class="btn btn-ghost btn-icon" id="pinterestRandomBtn" title="Ảnh ngẫu nhiên">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
            </button>
            <div class="pinterest-divider"></div>
            <button class="btn btn-ghost" id="pinterestExitBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>Thoát</span>
            </button>
        `;
        document.body.appendChild(controls);

        // Event listeners
        document.getElementById('pinterestShuffleBtn')?.addEventListener('click', () => {
            this.createPinterestLayout();
            this.showToast('Đã xáo trộn', 'success');
        });

        document.getElementById('pinterestRandomBtn')?.addEventListener('click', () => {
            this.spotlightRandom();
        });

        document.getElementById('pinterestExitBtn')?.addEventListener('click', () => {
            this.togglePinterestMode();
        });
    }

    setupPinterestScroll(container) {
        let scrollY = 0;
        let lastTime = performance.now();
        const scrollWrapper = container.querySelector('.pinterest-scroll-wrapper');
        if (!scrollWrapper) return;

        // Smooth CSS transition for auto-scroll
        scrollWrapper.style.transition = 'transform 0.1s linear';

        // Get max scroll height
        const getMaxScroll = () => {
            const wrapperHeight = scrollWrapper.scrollHeight;
            const containerHeight = container.offsetHeight;
            return Math.max(0, wrapperHeight - containerHeight + 100);
        };

        // Continuous auto-scroll animation
        const autoScroll = (currentTime) => {
            if (!this.pinterestMode) return;

            // Calculate delta time for smooth animation
            const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to ~60fps
            lastTime = currentTime;

            if (!this.paused) {
                // Slow continuous movement (0.3 pixels per frame)
                scrollY += 0.3 * deltaTime;

                const maxScroll = getMaxScroll();
                // Infinite loop - reset to top smoothly when reaching the end
                if (maxScroll > 0 && scrollY >= maxScroll) {
                    scrollY = 0;
                }

                scrollWrapper.style.transform = `translateY(-${scrollY}px)`;
            }

            this.pinterestAnimationId = requestAnimationFrame(autoScroll);
        };

        // Start auto-scroll immediately
        this.pinterestAnimationId = requestAnimationFrame(autoScroll);

        // Manual scroll with wheel (smooth)
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            scrollY += e.deltaY * 0.5;
            scrollY = Math.max(0, Math.min(scrollY, getMaxScroll()));
            scrollWrapper.style.transform = `translateY(-${scrollY}px)`;
        }, { passive: false });

        // Touch scroll for mobile
        let touchStartY = 0;
        container.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            touchStartY = touchY;
            scrollY += deltaY * 1.2;
            scrollY = Math.max(0, Math.min(scrollY, getMaxScroll()));
            scrollWrapper.style.transform = `translateY(-${scrollY}px)`;
        }, { passive: true });
    }

    createPinterestItem(card, index = 0) {
        const item = document.createElement('div');
        item.className = 'pinterest-item';

        // Initial state for stagger animation
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';

        const img = document.createElement('img');
        img.src = card.dataset.src;
        img.loading = 'lazy';
        img.alt = 'Kỷ niệm 12SinhLN';

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'pinterest-item-actions';
        actions.innerHTML = `
            <button class="pinterest-action-btn" title="Xem chi tiết">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
            </button>
        `;

        // Info overlay
        const info = document.createElement('div');
        info.className = 'pinterest-item-info';

        const mshs = card.dataset.mshs;
        const type = card.dataset.type;
        info.innerHTML = `
            <div class="pinterest-item-title">${mshs ? `Học sinh ${mshs}` : 'Kỷ Niệm Tập Thể'}</div>
            <div class="pinterest-item-sub">
                <span class="pinterest-item-badge" style="background: ${type === 'collective' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(168, 85, 247, 0.4)'};">
                    ${type === 'collective' ? '👥 Tập Thể' : '👤 Cá Nhân'}
                </span>
            </div>
        `;

        item.appendChild(img);
        item.appendChild(actions);
        item.appendChild(info);

        // Click to open spotlight
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.pinterest-action-btn')) {
                this.spotlight(card);
            }
        });

        return item;
    }

    destroyPinterestLayout() {
        if (this.pinterestAnimationId) {
            cancelAnimationFrame(this.pinterestAnimationId);
            this.pinterestAnimationId = null;
        }

        // Remove Pinterest container
        const pinterestContainer = document.querySelector('.pinterest-container');
        if (pinterestContainer) {
            pinterestContainer.remove();
        }

        // Remove Pinterest controls
        const pinterestControls = document.querySelector('.pinterest-controls');
        if (pinterestControls) {
            pinterestControls.remove();
        }

        // Show original photo cards
        this.photos.forEach(card => {
            card.style.display = 'block';
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                this.showToast('Không thể mở toàn màn hình', 'error');
            });
            this.showToast('Toàn màn hình', 'success');
        } else {
            document.exitFullscreen().catch(() => { });
            this.showToast('Thoát toàn màn hình', 'success');
        }
    }

    spotlight(card) {
        const idx = parseInt(card.dataset.index);
        this.currentSpotlight = idx;

        const modal = document.getElementById('spotlightModal');
        const img = document.getElementById('spotlightImg');

        if (img) {
            img.style.opacity = '0';
            img.src = card.dataset.src;
            img.onload = () => {
                img.style.transition = 'opacity 0.3s ease-out';
                img.style.opacity = '1';
            };
        }

        const mshs = card.dataset.mshs;
        const title = document.getElementById('spotlightTitle');
        const sub = document.getElementById('spotlightSub');

        if (title) title.textContent = mshs ? `Học sinh ${mshs}` : 'Kỷ Niệm Tập Thể';
        if (sub) sub.textContent = mshs ? `MSHS ${mshs}` : 'Lớp 12SinhLN';

        const visible = this.getVisiblePhotos();
        const pos = visible.findIndex(p => parseInt(p.dataset.index) === idx);
        const counter = document.getElementById('spotlightCounter');
        if (counter) counter.textContent = `${pos + 1} / ${visible.length}`;

        modal?.classList.add('open');
    }

    spotlightNavigate(dir) {
        const visible = this.getVisiblePhotos();
        if (!visible.length) return;

        const current = visible.findIndex(p => parseInt(p.dataset.index) === this.currentSpotlight);
        let next = (current + dir + visible.length) % visible.length;

        this.spotlight(visible[next]);
    }

    spotlightRandom() {
        const visible = this.getVisiblePhotos();
        if (!visible.length) {
            this.showToast('Không có ảnh để hiển thị', 'error');
            return;
        }

        const random = visible[Math.floor(Math.random() * visible.length)];
        this.spotlight(random);
    }

    getVisiblePhotos() {
        return this.photos.filter(p => parseFloat(p.style.opacity) > 0.15);
    }

    downloadCurrentPhoto() {
        if (this.currentSpotlight < 0) return;

        const card = this.photos[this.currentSpotlight];
        if (!card) return;

        try {
            const a = document.createElement('a');
            a.href = card.dataset.src;
            a.download = `12SinhLN-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            this.showToast('Đang tải ảnh...', 'success');
        } catch (err) {
            this.showToast('Lỗi tải ảnh', 'error');
        }
    }

    startSlideshow() {
        const visible = this.getVisiblePhotos();
        if (!visible.length) {
            this.showToast('Không có ảnh để trình chiếu', 'error');
            return;
        }

        this.slideshow = true;
        this.spotlight(visible[0]);

        this.slideshowInterval = setInterval(() => {
            if (document.getElementById('spotlightModal')?.classList.contains('open')) {
                this.spotlightNavigate(1);
            } else {
                this.stopSlideshow();
            }
        }, this.settings.slideDuration);

        this.showToast('Bắt đầu trình chiếu', 'success');
    }

    stopSlideshow() {
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
            this.slideshow = false;
        }
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('open');
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('open');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        const icon = toast.querySelector('svg');
        if (icon) {
            if (type === 'success') {
                icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
            } else if (type === 'error') {
                icon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
            } else {
                icon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>';
            }
        }

        const span = toast.querySelector('span');
        if (span) span.textContent = message;

        toast.className = `toast ${type} show`;

        setTimeout(() => toast.classList.remove('show'), 2800);
    }

    async makeVideo(download = false) {
        if (this.isCreatingVideo) {
            this.showToast('Đang tạo video, vui lòng đợi...', 'error');
            return;
        }

        const canvas = document.getElementById('videoCanvas');
        if (!canvas) {
            this.showToast('Lỗi: Không tìm thấy canvas', 'error');
            return;
        }

        const ctx = canvas.getContext('2d');
        canvas.width = 1920;
        canvas.height = 1080;

        const theme = document.querySelector('.theme-option.active')?.dataset.theme || 'cinematic';
        const durations = {
            cinematic: 2500,
            memories: 2200,
            energetic: 1600,
            romantic: 3000
        };
        const dur = durations[theme];

        const visible = this.getVisiblePhotos().slice(0, 25);
        if (!visible.length) {
            this.showToast('Không có ảnh để tạo video!', 'error');
            return;
        }

        this.isCreatingVideo = true;
        this.showToast(`Đang tải ${visible.length} ảnh...`, 'success');

        const progress = document.getElementById('progressFill');
        if (progress) progress.style.width = '0%';

        // Preload all images first
        const loadedImages = await this.preloadImages(visible, progress);

        if (loadedImages.length === 0) {
            this.showToast('Không thể tải ảnh!', 'error');
            this.isCreatingVideo = false;
            return;
        }

        this.showToast(`Đang render video với ${loadedImages.length} ảnh...`, 'success');

        let recorder = null, chunks = [];

        if (download) {
            try {
                const stream = canvas.captureStream(30);
                const mimeTypes = [
                    'video/webm;codecs=vp9',
                    'video/webm;codecs=vp8',
                    'video/webm'
                ];

                let mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
                if (!mimeType) {
                    throw new Error('No supported video format');
                }

                recorder = new MediaRecorder(stream, {
                    mimeType,
                    videoBitsPerSecond: 10000000
                });

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) chunks.push(e.data);
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: mimeType });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `12SinhLN-${theme}-${Date.now()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(a.href);
                    this.showToast('Đã tải video thành công!', 'success');
                };

                recorder.onerror = (e) => {
                    console.error('Recording error:', e);
                    this.showToast('Lỗi ghi video', 'error');
                };

                recorder.start();
            } catch (err) {
                console.error('MediaRecorder error:', err);
                this.showToast('Trình duyệt không hỗ trợ ghi video', 'error');
                this.isCreatingVideo = false;
                return;
            }
        }

        try {
            // Intro
            await this.renderIntro(ctx, canvas, 2500);
            if (progress) progress.style.width = '8%';

            // Photos with transitions
            for (let i = 0; i < loadedImages.length; i++) {
                await this.renderPhotoFrame(ctx, canvas, loadedImages[i], theme, i, loadedImages.length, dur);
                if (progress) progress.style.width = `${8 + ((i + 1) / loadedImages.length) * 82}%`;
            }

            // Outro
            await this.renderOutro(ctx, canvas, 3000);
            if (progress) progress.style.width = '100%';

            if (download && recorder && recorder.state === 'recording') {
                setTimeout(() => recorder.stop(), 100);
            }
        } catch (err) {
            console.error('Video creation error:', err);
            this.showToast('Lỗi tạo video', 'error');
            if (recorder && recorder.state === 'recording') {
                recorder.stop();
            }
        }

        this.isCreatingVideo = false;
    }

    async preloadImages(cards, progressEl) {
        const images = [];
        let loaded = 0;

        const promises = cards.map((card, index) => {
            return new Promise((resolve) => {
                // Try to get the actual image element from the card
                const cardImg = card.querySelector('img');

                if (cardImg && cardImg.complete && cardImg.naturalWidth > 0) {
                    // Use the already loaded image
                    loaded++;
                    if (progressEl) progressEl.style.width = `${(loaded / cards.length) * 5}%`;
                    resolve({ img: cardImg, index });
                } else {
                    // Create new image and load
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    img.onload = () => {
                        loaded++;
                        if (progressEl) progressEl.style.width = `${(loaded / cards.length) * 5}%`;
                        resolve({ img, index });
                    };

                    img.onerror = () => {
                        loaded++;
                        if (progressEl) progressEl.style.width = `${(loaded / cards.length) * 5}%`;
                        // Still resolve but with the card's img element as fallback
                        if (cardImg) {
                            resolve({ img: cardImg, index });
                        } else {
                            resolve(null);
                        }
                    };

                    // Use the src from dataset
                    img.src = card.dataset.src;
                }
            });
        });

        const results = await Promise.all(promises);
        return results.filter(r => r !== null).sort((a, b) => a.index - b.index).map(r => r.img);
    }

    async renderIntro(ctx, canvas, dur) {
        return new Promise(resolve => {
            const start = performance.now();

            const run = (now) => {
                const elapsed = now - start;
                const t = Math.min(elapsed / dur, 1);

                this.drawBg(ctx, canvas, t);
                this.drawOrbs(ctx, canvas, t);

                ctx.save();

                const ease = this.easeOutQuart(t);
                const fadeIn = t < 0.3 ? t / 0.3 : 1;
                const fadeOut = t > 0.8 ? (1 - t) / 0.2 : 1;
                ctx.globalAlpha = Math.min(fadeIn, fadeOut);

                // Particles
                for (let i = 0; i < 20; i++) {
                    const px = canvas.width * (0.2 + Math.sin(t * 2 + i) * 0.3 + i * 0.03);
                    const py = canvas.height * (0.3 + Math.cos(t * 1.5 + i * 0.5) * 0.2);
                    const size = 2 + Math.sin(t * 3 + i) * 1;
                    ctx.fillStyle = `rgba(168, 85, 247, ${0.3 * fadeIn * fadeOut})`;
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Main title with gradient
                const grad = ctx.createLinearGradient(
                    canvas.width / 2 - 250, canvas.height / 2,
                    canvas.width / 2 + 250, canvas.height / 2
                );
                grad.addColorStop(0, '#6366f1');
                grad.addColorStop(0.5, '#a855f7');
                grad.addColorStop(1, '#ec4899');

                ctx.fillStyle = grad;
                ctx.font = '800 120px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const titleY = canvas.height / 2 - 30 + (1 - ease) * 50;
                const scale = 0.8 + ease * 0.2;
                ctx.save();
                ctx.translate(canvas.width / 2, titleY);
                ctx.scale(scale, scale);
                ctx.fillText('12SinhLN', 0, 0);
                ctx.restore();

                // Subtitle
                ctx.font = '400 36px Outfit, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * fadeIn * fadeOut})`;
                const subY = canvas.height / 2 + 70 + (1 - ease) * 30;
                ctx.fillText('Những Kỷ Niệm Đẹp Nhất', canvas.width / 2, subY);

                // Year
                ctx.font = '300 24px Outfit, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * fadeIn * fadeOut})`;
                ctx.fillText('2023 - 2024', canvas.width / 2, canvas.height / 2 + 120);

                ctx.restore();

                if (elapsed < dur) {
                    requestAnimationFrame(run);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(run);
        });
    }

    async renderPhotoFrame(ctx, canvas, img, theme, idx, total, dur) {
        return new Promise(resolve => {
            if (!img || !img.naturalWidth) {
                console.warn('Invalid image at index', idx);
                resolve();
                return;
            }

            const start = performance.now();

            const run = (now) => {
                const elapsed = now - start;
                const t = Math.min(elapsed / dur, 1);
                const ease = this.easeInOutCubic(t);

                this.drawBg(ctx, canvas, t + idx * 0.1);
                this.drawOrbs(ctx, canvas, (idx + t) / total);

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);

                let scale, opacity, dx = 0, dy = 0, rot = 0;
                let kenBurns = 1;

                switch (theme) {
                    case 'cinematic':
                        scale = 0.55 + ease * 0.1;
                        opacity = t < 0.1 ? t * 10 : t > 0.85 ? (1 - t) / 0.15 : 1;
                        dy = (1 - ease) * 40;
                        kenBurns = 1 + t * 0.05;
                        break;
                    case 'memories':
                        scale = 0.52 + Math.sin(t * Math.PI) * 0.08;
                        opacity = Math.sin(t * Math.PI);
                        rot = Math.sin(t * Math.PI * 2) * 0.03;
                        kenBurns = 1 + Math.sin(t * Math.PI) * 0.03;
                        break;
                    case 'energetic':
                        scale = 0.4 + ease * 0.3;
                        opacity = t < 0.08 ? t * 12 : t > 0.9 ? (1 - t) * 10 : 1;
                        rot = (1 - ease) * 0.12;
                        dx = Math.sin(t * Math.PI * 3) * 20;
                        kenBurns = 1 + ease * 0.08;
                        break;
                    case 'romantic':
                        scale = 0.5 + Math.sin(t * Math.PI) * 0.08;
                        opacity = Math.pow(Math.sin(t * Math.PI), 0.6);
                        dx = Math.sin(t * Math.PI * 2) * 25;
                        dy = Math.cos(t * Math.PI) * 15;
                        kenBurns = 1 + t * 0.04;
                        break;
                    default:
                        scale = 0.55;
                        opacity = 1;
                        kenBurns = 1;
                }

                ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
                ctx.translate(dx, dy);
                ctx.rotate(rot);

                const maxSize = Math.min(canvas.width * 0.75, canvas.height * 0.75) * scale;
                const ar = img.naturalWidth / img.naturalHeight;
                let dw, dh;
                if (ar > 1.5) {
                    dw = maxSize * 1.2;
                    dh = dw / ar;
                } else if (ar < 0.7) {
                    dh = maxSize;
                    dw = dh * ar;
                } else {
                    dw = ar > 1 ? maxSize : maxSize * ar;
                    dh = ar > 1 ? maxSize / ar : maxSize;
                }

                // Shadow
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 80;
                ctx.shadowOffsetY = 40;

                // Draw with ken burns effect
                ctx.save();
                ctx.scale(kenBurns, kenBurns);

                // Rounded corners
                ctx.beginPath();
                const radius = 24;
                ctx.roundRect(-dw / 2, -dh / 2, dw, dh, radius);
                ctx.clip();

                // Border glow
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
                ctx.restore();

                ctx.restore();

                // Counter at bottom
                ctx.save();
                ctx.globalAlpha = 0.6 * opacity;
                ctx.fillStyle = '#fff';
                ctx.font = '500 20px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${idx + 1} / ${total}`, canvas.width / 2, canvas.height - 50);
                ctx.restore();

                // Progress bar at bottom
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(canvas.width * 0.3, canvas.height - 25, canvas.width * 0.4, 3);
                ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
                ctx.fillRect(canvas.width * 0.3, canvas.height - 25, canvas.width * 0.4 * ((idx + t) / total), 3);
                ctx.restore();

                if (elapsed < dur) {
                    requestAnimationFrame(run);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(run);
        });
    }

    async renderOutro(ctx, canvas, dur) {
        return new Promise(resolve => {
            const start = performance.now();

            const run = (now) => {
                const elapsed = now - start;
                const t = Math.min(elapsed / dur, 1);

                this.drawBg(ctx, canvas, t);
                this.drawOrbs(ctx, canvas, t);

                ctx.save();

                const ease = this.easeOutQuart(t);
                const fadeIn = t < 0.2 ? t / 0.2 : 1;
                const fadeOut = t > 0.75 ? (1 - t) / 0.25 : 1;
                ctx.globalAlpha = Math.min(fadeIn, fadeOut);

                // Confetti particles
                for (let i = 0; i < 30; i++) {
                    const px = canvas.width * (0.1 + (i / 30) * 0.8);
                    const py = canvas.height * (0.2 + Math.sin(t * 3 + i * 0.5) * 0.15 + t * 0.3);
                    const size = 3 + Math.sin(t * 4 + i) * 2;
                    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'];
                    ctx.fillStyle = colors[i % colors.length];
                    ctx.globalAlpha = (0.5 + Math.sin(t * 5 + i) * 0.3) * fadeIn * fadeOut;
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalAlpha = Math.min(fadeIn, fadeOut);

                // Gradient text
                const grad = ctx.createLinearGradient(
                    canvas.width / 2 - 200, canvas.height / 2,
                    canvas.width / 2 + 200, canvas.height / 2
                );
                grad.addColorStop(0, '#6366f1');
                grad.addColorStop(0.5, '#a855f7');
                grad.addColorStop(1, '#ec4899');

                ctx.fillStyle = grad;
                ctx.font = '700 100px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const titleY = canvas.height / 2 - 20 + (1 - ease) * 40;
                ctx.fillText('Cảm Ơn', canvas.width / 2, titleY);

                ctx.font = '400 32px Outfit, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * fadeIn * fadeOut})`;
                ctx.fillText('12SinhLN – Mãi Nhớ Kỷ Niệm', canvas.width / 2, canvas.height / 2 + 60);

                ctx.font = '300 22px Outfit, sans-serif';
                ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * fadeIn * fadeOut})`;
                ctx.fillText('♥ 2024 ♥', canvas.width / 2, canvas.height / 2 + 110);

                ctx.restore();

                if (elapsed < dur) {
                    requestAnimationFrame(run);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(run);
        });
    }

    drawBg(ctx, canvas, t = 0) {
        const grad = ctx.createRadialGradient(
            canvas.width / 2 + Math.sin(t) * 50,
            canvas.height / 2 + Math.cos(t) * 30,
            0,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.85
        );
        grad.addColorStop(0, '#0f0a1a');
        grad.addColorStop(0.3, '#0a0812');
        grad.addColorStop(0.6, '#050408');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawOrbs(ctx, canvas, t) {
        const orbs = [
            { x: 0.2, y: 0.25, s: 550, c1: 'rgba(99, 102, 241, 0.12)', c2: 'transparent' },
            { x: 0.8, y: 0.75, s: 480, c1: 'rgba(168, 85, 247, 0.1)', c2: 'transparent' },
            { x: 0.5, y: 0.5, s: 400, c1: 'rgba(236, 72, 153, 0.08)', c2: 'transparent' }
        ];

        orbs.forEach((o, i) => {
            const x = canvas.width * o.x + Math.sin(t * Math.PI * 2 + i * 2.5) * 80;
            const y = canvas.height * o.y + Math.cos(t * Math.PI * 2 + i * 2.5) * 60;
            const g = ctx.createRadialGradient(x, y, 0, x, y, o.s);
            g.addColorStop(0, o.c1);
            g.addColorStop(1, o.c2);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    updateCounts() {
        const total = this.allData.length;
        const collective = this.allData.filter(d => d.type === 'collective').length;
        const personal = this.allData.filter(d => d.type === 'personal').length;

        const setCount = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setCount('countTotal', total);
        setCount('countAll', total);
        setCount('countCollective', collective);
        setCount('countPersonal', personal);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.storm = new PhotoStorm();
});
