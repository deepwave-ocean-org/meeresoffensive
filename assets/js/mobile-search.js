if (window.matchMedia('(pointer: coarse)').matches) {

    import('https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js').then(({ default: Fuse }) => {

        function init() {
            if (!window.mapdata) {
                console.warn('Mobile search: window.mapdata not available');
                return;
            }

            // ── Flatten mapdata hierarchy into searchable array ──
            function flattenMapdata(data) {
                const items = [];
                if (data.children) {
                    data.children.forEach(category => {
                        if (category.children) {
                            category.children.forEach(item => {
                                let content = item.content;
                                if (typeof content === 'string') {
                                    try { content = JSON.parse(content); } catch (e) { content = {}; }
                                }
                                items.push({
                                    name: item.name,
                                    anchor: item.anchor,
                                    thumbnail: item.thumbnail,
                                    content: content
                                });
                            });
                        }
                    });
                }
                return items;
            }

            const searchableNodes = flattenMapdata(window.mapdata);

            const fuse = new Fuse(searchableNodes, {
                keys: [
                    'name',
                    'content.text_translation',
                    'content.title',
                    'content.explanations.text',
                ],
                threshold: 0.2,
                includeMatches: true,
                minMatchCharLength: 2,
                includeScore: true,
                ignoreLocation: true,
            });

            // ── Build anchor → Swiper slide index map ──
            const anchorToSlideIndex = {};
            document.querySelectorAll('.swiper-slide').forEach((slide, index) => {
                const hash = slide.dataset.hash;
                if (hash) anchorToSlideIndex[hash] = index;
            });

            // ── DOM references ──
            const etikett = document.getElementById('mobile-search-etikett');
            const panel = document.getElementById('mobile-search-panel');
            const searchBar = document.getElementById('mobile-search-bar');
            const searchResults = document.getElementById('mobile-search-results');
            const closeBtn = document.getElementById('mobile-search-close');
            const backdrop = document.getElementById('mobile-search-backdrop');

            if (!etikett || !panel || !searchBar) return;

            // ── Open / Close ──
            function openSearch() {
                panel.classList.add('is-open');
                panel.setAttribute('aria-hidden', 'false');
                backdrop.classList.add('is-visible');
                etikett.classList.add('is-hidden');
                setTimeout(() => searchBar.focus(), 150);
            }

            function closeSearch() {
                panel.classList.remove('is-open');
                panel.setAttribute('aria-hidden', 'true');
                backdrop.classList.remove('is-visible');
                etikett.classList.remove('is-hidden');
                searchBar.blur();
                searchBar.value = '';
                searchResults.innerHTML = '';
            }

            etikett.addEventListener('click', openSearch);
            closeBtn.addEventListener('click', closeSearch);
            backdrop.addEventListener('click', closeSearch);

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && panel.classList.contains('is-open')) {
                    closeSearch();
                }
            });

            // ── Debounced search ──
            let debounceTimer;
            function debounce(func, wait) {
                return function (...args) {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => func.apply(this, args), wait);
                };
            }

            function renderResults(searchTerm) {
                searchResults.innerHTML = '';

                if (!searchTerm || searchTerm.trim().length < 2) return;

                const results = fuse.search(searchTerm.trim());

                if (results.length === 0) {
                    const p = document.createElement('p');
                    p.className = 'mobile-search-no-results';
                    p.textContent = 'Keine Ergebnisse gefunden';
                    searchResults.appendChild(p);
                    return;
                }

                const ul = document.createElement('ul');
                ul.className = 'mobile-search-results-list';

                results.forEach(result => {
                    const li = document.createElement('li');
                    li.className = 'mobile-search-result-item';

                    const link = document.createElement('a');
                    link.href = '#' + result.item.anchor;

                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const slideIndex = anchorToSlideIndex[result.item.anchor];
                        if (slideIndex !== undefined && window.mobileSwiper) {
                            closeSearch();
                            window.mobileSwiper.slideTo(slideIndex, 300);
                        }
                    });

                    // Thumbnail
                    if (result.item.thumbnail) {
                        const thumb = document.createElement('img');
                        thumb.src = result.item.thumbnail;
                        thumb.alt = '';
                        thumb.loading = 'lazy';
                        link.appendChild(thumb);
                    }

                    // Name
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = result.item.name;
                    nameSpan.style.color = 'rgba(255,255,255,0.9)';
                    link.appendChild(nameSpan);

                    li.appendChild(link);
                    ul.appendChild(li);
                });

                searchResults.appendChild(ul);
            }

            searchBar.addEventListener('input', debounce((e) => {
                renderResults(e.target.value);
            }, 250));
        }

        // DOM may already be loaded by the time Fuse.js arrives from CDN
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

    }).catch(err => {
        console.error('Failed to load Fuse.js for mobile search:', err);
    });
}
