if (document.documentElement.classList.contains('is-mobile')) {
    document.addEventListener('DOMContentLoaded', function () {
        console.log("mooobille!")

        gsap.registerPlugin(ScrollTrigger);

        function killTimeline(timeline) {
            if (timeline) {
                timeline.kill()
            }
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

                            function tryLoadSource() {
                                if (currentSourceIndex >= sources.length) {
                                    console.error('All video sources failed to load');
                                    resolve(); // Resolve anyway to not block other loading
                                    return;
                                }

                                const source = sources[currentSourceIndex];
                                if (!source.src) {
                                    source.src = source.dataset.src;
                                    video.style.display = 'none';
                                    video.load();

                                    video.addEventListener('canplaythrough', () => {
                                        video.play();
                                        const spinner = slide.querySelector('.video-spinner');
                                        if (spinner) spinner.remove();
                                        video.style.display = 'block';
                                        resolve();
                                    }, { once: true });

                                    // Handle error and try next source
                                    source.addEventListener('error', () => {
                                        console.log(`Source ${currentSourceIndex} failed, trying next`);
                                        currentSourceIndex++;
                                        tryLoadSource();
                                    }, { once: true });
                                }
                            }

                            tryLoadSource(); // Start loading first source
                        });
                        loadPromises.push(videoPromise);
                    }
                });

                // Once critical slides are loaded, load the rest
                Promise.all(loadPromises).then(() => {
                    loadRemainingSlides();
                });
            };

            // Load all other slides in the background
            const loadRemainingSlides = () => {
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
                },
                afterInit: () => {
                    document.querySelector(".swiper").classList.remove("swiper-hidden");
                },
                slideChange: function () {
                    window.scrollTo(0, 0);
                    console.log("slide_change")
                    singleSlideScrollAnimation(this);
                    playVideo(this);
                },
                destroy: function () {
                    killTimeline(window.backgroundTimeline);
                    killTimeline(window.videoTimeline);
                    killTimeline(window.videoDescriptionTimeline1);
                    killTimeline(window.videoDescriptionTimeline2);
                }
            }
        });

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
        };
    }

    )
}