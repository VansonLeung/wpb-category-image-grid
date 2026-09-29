/**
 * WPBakery Category Image Grid - JavaScript (Vanilla JS)
 */

(function() {
    'use strict';

    class WPB_CategoryImageGrid {
        constructor(gridId) {
            this.gridId = gridId;
            this.container = document.getElementById(gridId);
            if (!this.container) {
                console.error('Grid container not found:', gridId);
                return;
            }

            this.grid = this.container.querySelector('.wpb-cig-grid');
            this.loading = this.container.querySelector('.wpb-cig-loading');
            this.pagination = this.container.querySelector('.wpb-cig-pagination');
            this.loadMoreBtn = this.container.querySelector('.wpb-cig-load-more');
            this.pageNumbers = this.container.querySelector('.wpb-cig-page-numbers');
            this.endMessage = this.container.querySelector('.wpb-cig-end-message');
            this.scrollSentinel = this.container.querySelector('.wpb-cig-scroll-sentinel');

            this.postType = this.container.dataset.postType;
            this.category = this.container.dataset.category;
            this.columns = parseInt(this.container.dataset.columns);
            this.gapSize = this.container.dataset.gapSize;
            this.paginationType = this.container.dataset.paginationType;
            this.postsPerPage = parseInt(this.container.dataset.postsPerPage);
            this.viewMoreText = this.container.dataset.viewMoreText;
            this.endMessageText = this.container.dataset.endMessage || 'No more posts to load.';
            this.errorText = (window.wpbCigAjax && window.wpbCigAjax.strings && window.wpbCigAjax.strings.error) || 'Error loading posts. Please try again.';
            this.noPostsText = (window.wpbCigAjax && window.wpbCigAjax.strings && window.wpbCigAjax.strings.noPosts) || 'No posts found.';
            this.supportsIntersectionObserver = 'IntersectionObserver' in window;

            this.currentPage = 1;
            this.totalPages = 1;
            this.hasMore = false;
            this.isLoading = false;
            this.allPostsLoaded = false;
            this.currentPosts = [];
            this.observer = null;

            this.init();
        }

        init() {
            this.bindEvents();
            this.setupInfiniteScroll();
            this.loadPosts(true);
        }

        bindEvents() {
            const categoryBtns = this.container.querySelectorAll('.wpb-cig-category-btn');
            categoryBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const newCategory = btn.dataset.category;
                    if (newCategory !== this.category) {
                        this.changeCategory(newCategory);
                    }
                });
            });

            if (this.loadMoreBtn) {
                this.loadMoreBtn.addEventListener('click', () => {
                    this.loadMorePosts();
                });
            }
        }

        setupInfiniteScroll() {
            if (!this.scrollSentinel || !this.supportsIntersectionObserver) {
                return;
            }

            this.observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && this.paginationType === 'lazy_loading') {
                        this.loadMorePosts();
                    }
                });
            }, {
                root: null,
                rootMargin: '200px 0px',
                threshold: 0.1,
            });

            this.observer.observe(this.scrollSentinel);
        }

        refreshInfiniteScrollObserver() {
            if (!this.observer || !this.scrollSentinel) {
                return;
            }

            this.observer.unobserve(this.scrollSentinel);

            window.requestAnimationFrame(() => {
                if (!this.scrollSentinel) {
                    return;
                }

                this.observer.observe(this.scrollSentinel);
                this.maybeLoadMoreIfVisible();
            });
        }

        maybeLoadMoreIfVisible() {
            if (!this.scrollSentinel || !this.hasMore || this.isLoading || this.paginationType !== 'lazy_loading') {
                return;
            }

            const sentinelRect = this.scrollSentinel.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            if (sentinelRect.top <= viewportHeight + 200) {
                this.loadMorePosts();
            }
        }

        changeCategory(newCategory) {
            const categoryBtns = this.container.querySelectorAll('.wpb-cig-category-btn');
            categoryBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === newCategory) {
                    btn.classList.add('active');
                }
            });

            this.grid.classList.add('fade-out');
            this.allPostsLoaded = true;
            this.hasMore = false;

            setTimeout(() => {
                this.category = newCategory;
                this.resetState();
                this.loadPosts(true);
            }, 300);
        }

        resetState() {
            this.currentPage = 1;
            this.totalPages = 1;
            this.hasMore = false;
            this.allPostsLoaded = false;
            this.currentPosts = [];
            this.hideEndMessage();
            this.hidePaginationControls();
        }

        loadPosts(isInitial = false) {
            if (this.isLoading) {
                return;
            }

            this.isLoading = true;
            this.showLoading();
            if (this.loadMoreBtn) {
                this.loadMoreBtn.disabled = true;
            }

            const data = {
                action: 'wpb_cig_load_posts',
                nonce: wpbCigAjax.nonce,
                post_type: this.postType,
                category: this.category,
                posts_per_page: this.postsPerPage,
                page: this.currentPage,
                pagination_type: this.paginationType
            };

            fetch(wpbCigAjax.ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    this.handlePostsLoaded(result.data, isInitial);
                } else {
                    console.error('Failed to load posts:', result.data);
                    this.showError();
                }
            })
            .catch(error => {
                console.error('AJAX error:', error);
                this.showError();
            })
            .finally(() => {
                this.isLoading = false;
                if (this.loadMoreBtn) {
                    this.loadMoreBtn.disabled = false;
                }
                this.hideLoading();
            });
        }

        handlePostsLoaded(data, isInitial) {
            const posts = data.posts;
            this.currentPage = data.current_page;
            this.totalPages = data.total_pages;
            this.hasMore = Boolean(data.has_more);
            this.allPostsLoaded = !this.hasMore;

            if (isInitial || this.paginationType === 'pagination') {
                this.currentPosts = posts;
                this.renderGrid(posts);
            } else {
                this.currentPosts = this.currentPosts.concat(posts);
                this.appendPosts(posts);
            }

            this.updatePagination(data);

            if (this.paginationType === 'lazy_loading' && this.supportsIntersectionObserver) {
                this.refreshInfiniteScrollObserver();
            }
        }

        renderGrid(posts) {
            const existingItems = this.grid.querySelectorAll('.wpb-cig-item, .wpb-cig-error, .wpb-cig-empty');
            existingItems.forEach(item => item.remove());

            if (!posts.length) {
                this.grid.innerHTML = `<div class="wpb-cig-empty">${this.escapeHtml(this.noPostsText)}</div>`;
                this.grid.classList.remove('fade-out');
                this.grid.classList.add('fade-in');
                return;
            }

            posts.forEach((post, index) => {
                const itemHtml = this.createPostItem(post, index);
                this.grid.insertAdjacentHTML('beforeend', itemHtml);
            });

            this.grid.classList.remove('fade-out');
            this.grid.classList.add('fade-in');

            setTimeout(() => {
                const items = this.grid.querySelectorAll('.wpb-cig-item');
                items.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('animate-in');
                    }, index * 100);
                });
            }, 100);
        }

        appendPosts(posts) {
            posts.forEach((post, index) => {
                const itemHtml = this.createPostItem(post, this.currentPosts.length - posts.length + index);
                this.grid.insertAdjacentHTML('beforeend', itemHtml);
                const newItem = this.grid.lastElementChild;

                setTimeout(() => {
                    if (newItem) {
                        newItem.classList.add('animate-in');
                    }
                }, index * 100);
            });
        }

        createPostItem(post, index) {
            const title = this.escapeHtml(post.title || '');
            const permalink = this.escapeAttribute(post.permalink || '#');
            const imageUrl = this.escapeAttribute(post.image_url || '');

            return `
                <div class="wpb-cig-item" data-post-id="${post.id}" data-index="${index}">
                    <div class="wpb-cig-item-inner">
                        ${post.image_url ? `<img src="${imageUrl}" alt="${title}" loading="lazy" />` : '<div class="wpb-cig-no-image">No Image</div>'}
                        <div class="wpb-cig-overlay">
                            <h3 class="wpb-cig-overlay-title">${title}</h3>
                            <a href="${permalink}" class="wpb-cig-overlay-button">${this.escapeHtml(this.viewMoreText)}</a>
                        </div>
                    </div>
                </div>
            `;
        }

        updatePagination(data) {
            this.hidePaginationControls();

            if (this.paginationType === 'pagination') {
                if (data.total_pages > 1) {
                    this.renderPageNumbers(data);
                    this.pagination.style.display = 'block';
                }
                return;
            }

            if (this.paginationType === 'lazy_loading') {
                if (this.hasMore) {
                    this.pagination.style.display = 'block';
                    if (!this.supportsIntersectionObserver) {
                        this.loadMoreBtn.style.display = 'inline-block';
                    }
                } else if (this.currentPage > 1) {
                    this.pagination.style.display = 'block';
                    this.showEndMessage();
                }
            }
        }

        hidePaginationControls() {
            if (this.pagination) {
                this.pagination.style.display = 'none';
            }
            if (this.loadMoreBtn) {
                this.loadMoreBtn.style.display = 'none';
            }
            if (this.pageNumbers) {
                this.pageNumbers.innerHTML = '';
            }
            this.hideEndMessage();
        }

        renderPageNumbers(data) {
            const totalPages = data.total_pages;
            const currentPage = data.current_page;

            let html = '';

            html += `<button class="wpb-cig-page-number ${currentPage <= 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">&laquo;</button>`;

            for (let i = 1; i <= totalPages; i++) {
                if (i === currentPage) {
                    html += `<button class="wpb-cig-page-number active" data-page="${i}">${i}</button>`;
                } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    html += `<button class="wpb-cig-page-number" data-page="${i}">${i}</button>`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    html += '<span class="wpb-cig-page-dots">...</span>';
                }
            }

            html += `<button class="wpb-cig-page-number ${currentPage >= totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">&raquo;</button>`;

            this.pageNumbers.innerHTML = html;

            const pageBtns = this.pageNumbers.querySelectorAll('.wpb-cig-page-number:not(.disabled)');
            pageBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = parseInt(btn.dataset.page, 10);
                    if (page !== this.currentPage) {
                        this.goToPage(page);
                    }
                });
            });
        }

        goToPage(page) {
            this.currentPage = page;
            this.loadPosts(true);
        }

        loadMorePosts() {
            if (this.allPostsLoaded || this.isLoading || this.paginationType !== 'lazy_loading') {
                return;
            }

            this.currentPage++;
            this.loadPosts(false);
        }

        showEndMessage() {
            if (this.endMessage) {
                this.endMessage.textContent = this.endMessageText;
                this.endMessage.style.display = 'block';
            }
        }

        hideEndMessage() {
            if (this.endMessage) {
                this.endMessage.textContent = '';
                this.endMessage.style.display = 'none';
            }
        }

        showLoading() {
            if (this.loading) {
                this.loading.style.display = 'flex';
            }
        }

        hideLoading() {
            if (this.loading) {
                this.loading.style.display = 'none';
            }
        }

        showError() {
            this.hidePaginationControls();
            if (this.grid) {
                this.grid.innerHTML = `<div class="wpb-cig-error">${this.escapeHtml(this.errorText)}</div>`;
            }
        }

        escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        escapeAttribute(value) {
            return this.escapeHtml(value);
        }
    }

    window.WPB_CategoryImageGrid = WPB_CategoryImageGrid;

})();