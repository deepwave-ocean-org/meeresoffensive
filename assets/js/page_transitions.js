if (
    window.matchMedia('(pointer: coarse), (pointer: fine) and (max-height: 649px)').matches
) {
    document.addEventListener('DOMContentLoaded', function () {
        console.log("mooobille!")

        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.config({
            autoRefreshEvents: "visibilitychange,DOMContentLoaded,load", // Exclude 'resize'
        });

        // const handleResize = () => {
        //     if (window.innerWidth !== previousWidth) {
        //         previousWidth = window.innerWidth;
        //         ScrollTrigger.refresh(); // Refresh only when width changes
        //     }
        // };

        // let previousWidth = window.innerWidth;
        // window.addEventListener("resize", handleResize);

        function killTimeline(timeline) {
            if (timeline) {
                timeline.kill()
            }
        }

        // Dynamisch die Höhenaufteilung zwischen mo-main-content und mo-translation berechnen
        function adjustMobileLayout(swiper) {
            const activeSlide = swiper.slides[swiper.activeIndex];
            if (!activeSlide) return;

            const mainContent = activeSlide.querySelector('.mo-main-content');
            const mainContentP = activeSlide.querySelector('.mo-main-content p');
            if (!mainContentP) return;

            const vh = window.innerHeight;
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const quoteHeight = 5 * rem;  // .quote-icon height
            const navHeight = 4 * rem;    // Navigation/Pagination
            const marginTotal = 2.5 * rem; // margins oben+unten

            // Text-Höhe messen: Klone erzeugen, der frei fließen darf
            const measure = mainContentP.cloneNode(true);
            measure.style.cssText = 'position:absolute;visibility:hidden;height:auto;overflow:visible;width:' + mainContentP.offsetWidth + 'px;font-size:large;max-width:80vw;';
            document.body.appendChild(measure);
            const textNeeded = measure.scrollHeight;
            document.body.removeChild(measure);

            console.log('adjustMobileLayout: vh=' + vh + ' textNeeded=' + textNeeded + ' quoteH=' + quoteHeight + ' navH=' + navHeight);

            // Gesamter Platzbedarf für den oberen Bereich (Nav + Quote + Text + Margins)
            const upperNeeded = navHeight + quoteHeight + textNeeded + marginTotal;

            // Translation bekommt den restlichen Platz, aber mit Grenzen
            const minTranslation = Math.round(vh * 0.20); // Mindestens 20vh
            const maxTranslation = Math.round(vh * 0.55); // Maximal 55vh

            let translationHeight = vh - upperNeeded;
            translationHeight = Math.max(minTranslation, Math.min(maxTranslation, translationHeight));

            // Höhe für den Text-Bereich
            const contentHeight = vh - translationHeight - navHeight - quoteHeight;

            console.log('adjustMobileLayout: translationH=' + translationHeight + ' contentH=' + contentHeight);

            // Inline-Styles setzen (überschreiben die CSS-Variablen-basierten Werte)
            const translation = activeSlide.querySelector('.mo-translation');
            if (translation) translation.style.height = translationHeight + 'px';
            if (mainContent) {
                mainContent.style.bottom = translationHeight + 'px';
                mainContent.style.height = contentHeight + 'px';
                mainContent.style.margin = '0';
                mainContent.style.padding = (marginTotal / 2) + 'px 0';
            }

            // CTA-Wrapper muss gleiche Höhe wie mo-translation bekommen
            const ctaWrapper = activeSlide.querySelector('.mo-cta-wrapper');
            if (ctaWrapper) ctaWrapper.style.height = translationHeight + 'px';
        }

        function singleSlideScrollAnimation(swiper) {
            killTimeline(window.backgroundTimeline);
            killTimeline(window.videoTimeline);
            killTimeline(window.videoDescriptionTimeline1);
            killTimeline(window.videoDescriptionTimeline2);

            const activeSlide = swiper.slides[swiper.activeIndex];
            const background = activeSlide.querySelector('.mo-background')
            if (!background) {
                console.log("not a slide")
                return
            }
            const video = activeSlide.querySelector('.mo-video video');
            const videoContainer = activeSlide.querySelector('.video-container');
            const gifTranslation = activeSlide.querySelector('.gif-explanation');

            const height = window.innerHeight

            gsap.set(background, { clearProps: "transform" })
            window.backgroundTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: document.querySelector(".swiper"),
                    start: 'top top',
                    end: `+=${height * 2.1}`,
                    scrub: true,
                    // markers: true,
                    ease: "power1.inOut"
                }
            }).to(background, {
                // opacity: 0,
                y: height * 0.9,
                force3D: true
            });

            window.videoTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: videoContainer,
                    start: "top 33%",
                    end: "bottom-=200 25%",
                    scrub: true,
                    // markers: true,
                }
            }).fromTo(video, {
                width: "75vw",
                y: 0
            }, {
                width: "33vh",
                y: 100,
                ease: "none",
                duration: 0.6
            })
                .to(video, {
                    width: "33vh",
                    y: 200,
                    ease: "none",
                    duration: 0.4
                });

            window.videoDescriptionTimeline1 = gsap.timeline({
                scrollTrigger: {
                    trigger: gifTranslation,
                    start: 'top bottom',
                    end: 'top center',
                    scrub: true,
                    // markers: true,
                },
            }).to(gifTranslation, {
                y: -20,
                opacity: 1,
                ease: "none"
            })


            window.videoDescriptionTimeline2 = gsap.timeline({
                scrollTrigger: {
                    trigger: gifTranslation,
                    start: 'top 40%',
                    end: 'bottom 45%',
                    scrub: true,
                    // markers: true,
                }
            }).fromTo(gifTranslation,
                {
                    y: -20
                },
                {
                    y: 50
                }
            );
        }

        function playVideo(swiper) {
            const activeVideo = swiper.slides[swiper.activeIndex].querySelector('.mo-video video');
            document.querySelectorAll('.mo-video video').forEach(video => {
                if (video !== activeVideo) {
                    video.pause();
                }
            });

            if (activeVideo) {
                activeVideo.currentTime = 0;
                activeVideo.play();
            }
        }

        function loadRessources(swiper) {
            const loadCriticalSlides = () => {
                const relevantSlides = [
                    swiper.slides[swiper.activeIndex - 2],
                    swiper.slides[swiper.activeIndex - 1],
                    swiper.slides[swiper.activeIndex],
                    swiper.slides[swiper.activeIndex + 1],
                    swiper.slides[swiper.activeIndex + 2]
                ].filter(Boolean);

                const loadPromises = [];

                relevantSlides.forEach(slide => {
                    const videoContainer = slide.querySelector('.video-container');
                    if (videoContainer) {
                        videoContainer.innerHTML += '<div class="video-spinner"></div>';
                    }

                    const background = slide.querySelector('.mo-background');
                    if (background && !background.style.background) {
                        const gradient = "linear-gradient(180deg, rgba(0,0,0,0.35) 1%, rgba(0,0,0,0) 14%, rgba(10,10,10,0.5) 60%, rgba(10,10,10,1) 98%, #0a0a0a 100%)";
                        const bgUrl = background.dataset.bg;

                        if (gradient && bgUrl) {
                            const imagePromise = new Promise((resolve) => {
                                const img = new Image();
                                img.onload = () => {
                                    background.style.background = `${gradient}, url('${bgUrl}')`;
                                    resolve();
                                };
                                img.onerror = () => {
                                    console.log('Image failed to load:', bgUrl);
                                    background.style.background = gradient;
                                    resolve();
                                };
                                img.src = bgUrl;
                            });
                            loadPromises.push(imagePromise);
                        }
                    }

                    const video = slide.querySelector('video');
                    if (video) {
                        const videoPromise = new Promise((resolve) => {
                            const sources = video.querySelectorAll('source[data-src]');
                            let currentSourceIndex = 0;
                            let hasRetried = false;

                            function onVideoReady() {
                                video.removeEventListener('canplay', onVideoReady);
                                video.removeEventListener('loadeddata', onVideoReady);
                                video.play();
                                const spinner = slide.querySelector('.video-spinner');
                                if (spinner) spinner.remove();
                                video.style.display = 'block';
                                resolve();
                            }

                            function tryLoadSource() {
                                if (currentSourceIndex >= sources.length) {
                                    // Retry once with MP4 source (last one) and longer timeout
                                    if (!hasRetried) {
                                        hasRetried = true;
                                        currentSourceIndex = sources.length - 1;
                                        const source = sources[currentSourceIndex];
                                        source.src = source.dataset.src;
                                        video.load();
                                        video.playbackRate = 0.4;

                                        const retryTimeout = setTimeout(() => {
                                            console.error('All video sources failed to load');
                                            video.style.display = 'none';
                                            resolve();
                                        }, 20000);

                                        video.addEventListener('canplay', () => { clearTimeout(retryTimeout); onVideoReady(); }, { once: true });
                                        video.addEventListener('loadeddata', () => { clearTimeout(retryTimeout); onVideoReady(); }, { once: true });
                                        return;
                                    }
                                    console.error('All video sources failed to load');
                                    resolve();
                                    return;
                                }

                                const source = sources[currentSourceIndex];
                                if (!source.src) {
                                    source.src = source.dataset.src;
                                }
                                video.style.display = 'none';
                                video.load();
                                video.playbackRate = 0.4;

                                const loadTimeout = setTimeout(() => {
                                    console.warn('Video load timeout for source', currentSourceIndex);
                                    video.removeEventListener('canplay', onVideoReady);
                                    video.removeEventListener('loadeddata', onVideoReady);
                                    currentSourceIndex++;
                                    tryLoadSource();
                                }, 12000);

                                video.addEventListener('canplay', () => { clearTimeout(loadTimeout); onVideoReady(); }, { once: true });
                                video.addEventListener('loadeddata', () => { clearTimeout(loadTimeout); onVideoReady(); }, { once: true });

                                // Handle source error and try next
                                source.addEventListener('error', () => {
                                    clearTimeout(loadTimeout);
                                    video.removeEventListener('canplay', onVideoReady);
                                    video.removeEventListener('loadeddata', onVideoReady);
                                    console.log(`Source ${currentSourceIndex} failed, trying next`);
                                    currentSourceIndex++;
                                    tryLoadSource();
                                }, { once: true });
                            }

                            tryLoadSource();
                        });
                        loadPromises.push(videoPromise);
                    }
                });

                Promise.all([
                    new Promise(resolve => window.addEventListener('load', resolve, { once: true })),
                    loadPromises
                ]).then(() => {
                    console.log("loading done")
                    loadRemainingSlides()
                });
            };

            // Load all other slides in the background
            const loadRemainingSlides = () => {
                console.log("loading remaining")
                const allSlides = Array.from(swiper.slides);
                console.log(allSlides)
                const nonCriticalSlides = allSlides.filter((slide, index) => {
                    return Math.abs(index - swiper.activeIndex) > 2;
                });
                console.log(nonCriticalSlides)


                    nonCriticalSlides.forEach(slide => {
                    // Load background images

                        const background = slide.querySelector('.mo-background');
                        if (background && !background.style.background) {
                            const gradient = "linear-gradient(180deg, rgba(0,0,0,0.35) 1%, rgba(0,0,0,0) 14%, rgba(10,10,10,0.5) 60%, rgba(10,10,10,1) 98%, #0a0a0a 100%)";
                            const bgUrl = background.dataset.bg;
                            if (gradient && bgUrl) {
                                background.style.background = `${gradient}, url('${bgUrl}')`;
                            }
                        }

                        const video = slide.querySelector('video');
                        if (video) {
                            const sources = video.querySelectorAll('source[data-src]');
                            sources.forEach(source => {
                                if (!source.src) {
                                    source.src = source.dataset.src;
                                }
                            });
                            video.load();
                            video.preload = 'auto';
                        }
                    });
                };

            loadCriticalSlides();
        }

        const swiper = new Swiper('.swiper', {
            direction: 'horizontal',
            slidesPerView: 1,
            autoHeight: true,
            hashNavigation: true,
            mousewheel: {
                forceToAxis: true,
                sensitivity: 1,
            },
            keyboard: {
                enabled: true,
                onlyInViewport: true,
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
                dynamicBullets: true,
                dynamicMainBullets: 1,
                renderBullet: function (index, className) {
                    return '<li class="' + className + '">' + menu[index] + "</li>";
                }
            },
            on: {
                init: function () {
                    console.log("init")
                    singleSlideScrollAnimation(this);
                    playVideo(this);
                    loadRessources(this);
                    adjustMobileLayout(this);
                },
                afterInit: (swiper) => {
                    swiper.updateAutoHeight(1)
                    document.querySelector(".swiper").classList.remove("swiper-hidden");
                },
                slideChange: function () {
                    window.scrollTo(0, 0);
                    console.log("slide_change")
                    singleSlideScrollAnimation(this);
                    playVideo(this);
                    adjustMobileLayout(this);
                },
                destroy: function () {
                    killTimeline(window.backgroundTimeline);
                    killTimeline(window.videoTimeline);
                    killTimeline(window.videoDescriptionTimeline1);
                    killTimeline(window.videoDescriptionTimeline2);
                }
            }
        });
        window.mobileSwiper = swiper;

        function watchMobileUI() {
            let oldHeight = window.innerHeight
            const resizeObserver = new ResizeObserver(() => {
                console.log(window.innerHeight, oldHeight)
                if (window.innerHeight != oldHeight) {
                    console.log("mobile UI is changing")
                    swiper.updateAutoHeight(1);
                }
            });

            resizeObserver.observe(document.documentElement);
            return resizeObserver;
        }

        const resizeObserver = watchMobileUI();

        // if (window.location.hash) {
        //     // Let browser's native scroll-to-hash happen first
        //     console.log("hello?")
        //     requestAnimationFrame(() => {
        //         swiper.init();
        //         // Remove the initial hiding styles
        //         swiper.classList.toggle("swiper-hidden");
        //     });
        // } else {
        //     swiper.init();
            
        // }

        return () => {
            if (swiper) {
                swiper.destroy();
                swiper = null;
            }
            resizeObserver.disconnect();
        };
    }

    )

}