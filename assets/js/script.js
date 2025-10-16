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

            // Configuration
            this.postType = this.container.dataset.postType;
            this.category = this.container.dataset.category;
            this.columns = parseInt(this.container.dataset.columns);
            this.gapSize = this.container.dataset.gapSize;
            this.paginationType = this.container.dataset.paginationType;
            this.postsPerPage = parseInt(this.container.dataset.postsPerPage);
            this.viewMoreText = this.container.dataset.viewMoreText;

            // State
            this.currentPage = 1;
            this.isLoading = false;
            this.allPostsLoaded = false;
            this.currentPosts = [];

            this.init();
        }

        init() {
            this.bindEvents();
            this.loadPosts(true);
        }

        bindEvents() {
            const self = this;

            // Category selector
            const categoryBtns = this.container.querySelectorAll('.wpb-cig-category-btn');
            categoryBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const newCategory = this.dataset.category;
                    if (newCategory !== self.category) {
                        self.changeCategory(newCategory);
                    }
                });
            });

            // Load more button
            if (this.loadMoreBtn) {
                this.loadMoreBtn.addEventListener('click', function() {
                    self.loadMorePosts();
                });
            }
        }

        changeCategory(newCategory) {
            // Update active button
            const categoryBtns = this.container.querySelectorAll('.wpb-cig-category-btn');
            categoryBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.category === newCategory) {
                    btn.classList.add('active');
                }
            });

            // Animate out current grid
            this.grid.classList.add('fade-out');

            setTimeout(() => {
                this.category = newCategory;
                this.currentPage = 1;
                this.allPostsLoaded = false;
                this.currentPosts = [];
                this.loadPosts(true);
            }, 300);
        }

        loadPosts(isInitial = false) {
            if (this.isLoading) return;

            this.isLoading = true;
            this.showLoading();

            const self = this;
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
                    self.handlePostsLoaded(result.data, isInitial);
                } else {
                    console.error('Failed to load posts:', result.data);
                    self.showError();
                }
            })
            .catch(error => {
                console.error('AJAX error:', error);
                self.showError();
            })
            .finally(() => {
                self.isLoading = false;
            });
        }

        handlePostsLoaded(data, isInitial) {
            const posts = data.posts;

            if (isInitial) {
                this.currentPosts = posts;
                this.renderGrid(posts);
            } else {
                // For lazy loading, append posts
                this.currentPosts = this.currentPosts.concat(posts);
                this.appendPosts(posts);
            }

            this.updatePagination(data);

            // Check if all posts loaded
            if (this.paginationType === 'lazy_loading' && data.current_page >= data.total_pages) {
                this.allPostsLoaded = true;
            }
        }

        renderGrid(posts) {
            this.hideLoading();

            // Clear existing content
            const existingItems = this.grid.querySelectorAll('.wpb-cig-item, .wpb-cig-error');
            existingItems.forEach(item => item.remove());

            // Render new posts
            posts.forEach((post, index) => {
                const itemHtml = this.createPostItem(post, index);
                this.grid.insertAdjacentHTML('beforeend', itemHtml);
            });

            // Animate in
            this.grid.classList.remove('fade-out');
            this.grid.classList.add('fade-in');

            // Animate items
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

                // Animate new items
                setTimeout(() => {
                    const newItem = this.grid.lastElementChild;
                    newItem.classList.add('animate-in');
                }, index * 100);
            });
        }

        createPostItem(post, index) {
            const imageStyle = post.image_url ? `background-image: url('${post.image_url}');` : '';

            return `
                <div class="wpb-cig-item" data-post-id="${post.id}" data-index="${index}">
                    <div class="wpb-cig-item-inner">
                        ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" />` : '<div class="wpb-cig-no-image">No Image</div>'}
                        <div class="wpb-cig-overlay">
                            <h3 class="wpb-cig-overlay-title">${post.title}</h3>
                            <a href="${post.permalink}" class="wpb-cig-overlay-button" target="_blank">${this.viewMoreText}</a>
                        </div>
                    </div>
                </div>
            `;
        }

        updatePagination(data) {
            if (this.paginationType === 'pagination') {
                this.renderPageNumbers(data);
                this.pagination.style.display = 'block';
            } else if (this.paginationType === 'lazy_loading' && !this.allPostsLoaded) {
                this.loadMoreBtn.style.display = 'block';
                this.pagination.style.display = 'block';
            } else {
                this.pagination.style.display = 'none';
            }
        }

        renderPageNumbers(data) {
            const totalPages = data.total_pages;
            const currentPage = data.current_page;

            let html = '';

            // Previous button
            html += `<button class="wpb-cig-page-number ${currentPage <= 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">&laquo;</button>`;

            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                if (i === currentPage) {
                    html += `<button class="wpb-cig-page-number active" data-page="${i}">${i}</button>`;
                } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    html += `<button class="wpb-cig-page-number" data-page="${i}">${i}</button>`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    html += '<span class="wpb-cig-page-dots">...</span>';
                }
            }

            // Next button
            html += `<button class="wpb-cig-page-number ${currentPage >= totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">&raquo;</button>`;

            this.pageNumbers.innerHTML = html;

            // Bind page number events
            const pageBtns = this.pageNumbers.querySelectorAll('.wpb-cig-page-number:not(.disabled)');
            const self = this;
            pageBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const page = parseInt(this.dataset.page);
                    if (page !== self.currentPage) {
                        self.goToPage(page);
                    }
                });
            });
        }

        goToPage(page) {
            this.currentPage = page;
            this.loadPosts(true);
        }

        loadMorePosts() {
            if (this.allPostsLoaded || this.isLoading) return;

            this.currentPage++;
            this.loadPosts(false);
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
            this.hideLoading();
            if (this.grid) {
                this.grid.innerHTML = '<div class="wpb-cig-error">Error loading posts. Please try again.</div>';
            }
        }
    }

    // Make it globally available
    window.WPB_CategoryImageGrid = WPB_CategoryImageGrid;

})();