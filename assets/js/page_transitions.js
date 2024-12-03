document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(ScrollTrigger);


    let nm = gsap.matchMedia();

    // nm.add("(min-width: 768px)", () => {
    //     const sections = document.querySelectorAll('.panel');
    //     let worker, sharedCanvas;
    //     let currentSection = null;

    //     // Create single worker and canvas
    //     const initializeWorker = async () => {
    //         try {
    //             // Create shared canvas
    //             sharedCanvas = document.createElement('canvas');
    //             sharedCanvas.width = 1000;
    //             sharedCanvas.height = 1000;
    //             sharedCanvas.style.width = '40vw';
    //             sharedCanvas.style.height = '40vw';

    //             // Create worker
    //             worker = new Worker(window.workerURL);

    //             // Initialize worker with offscreen canvas
    //             const offscreen = sharedCanvas.transferControlToOffscreen();
    //             worker.postMessage({
    //                 type: 'init',
    //                 payload: { canvas: offscreen }
    //             }, [offscreen]);

    //             // Wait for worker to be ready
    //             await new Promise(resolve => {
    //                 worker.onmessage = (e) => {
    //                     if (e.data.type === 'ready') resolve();
    //                 };
    //             });

    //         } catch (error) {
    //             console.error('Failed to initialize worker:', error);
    //             return false;
    //         }
    //         return true;
    //     };

    //     // Function to switch sprites
    //     const switchSprite = async (section) => {
    //         if (currentSection === section) return true;

    //         try {
    //             const filename = section.dataset.file.toLowerCase();

    //             worker.postMessage({
    //                 type: 'switchSprite',
    //                 payload: { filename }
    //             });

    //             await new Promise((resolve, reject) => {
    //                 worker.onmessage = (e) => {
    //                     if (e.data.type === 'spriteReady') resolve();
    //                     if (e.data.type === 'error') reject(e.data.error);
    //                 };
    //             });

    //             currentSection = section;
    //             return true;
    //         } catch (error) {
    //             console.error('Failed to switch sprite:', error);
    //             return false;
    //         }
    //     };

    //     // Initialize everything
    //     (async () => {
    //         if (!await initializeWorker()) return;

    //         sections.forEach((section) => {
    //             const sprite_cont = section.querySelector(".sprite-container");

    //             // Setup ScrollTrigger for pinning
    //             gsap.from(section, {
    //                 scrollTrigger: {
    //                     trigger: section,
    //                     scrub: true,
    //                     pin: true,
    //                     start: "top top",
    //                     end: "+=100%",
    //                     onEnter: async () => {
    //                         // When entering a section, switch sprite and add canvas
    //                         if (await switchSprite(section)) {
    //                             sprite_cont.appendChild(sharedCanvas);
    //                         }
    //                     },
    //                     onEnterBack: async () => {
    //                         // Same for entering backwards
    //                         if (await switchSprite(section)) {
    //                             sprite_cont.appendChild(sharedCanvas);
    //                         }
    //                     },
    //                     onLeave: () => {
    //                         // Remove canvas when leaving
    //                         if (sprite_cont.contains(sharedCanvas)) {
    //                             sprite_cont.removeChild(sharedCanvas);
    //                         }
    //                     },
    //                     onLeaveBack: () => {
    //                         // Same for leaving backwards
    //                         if (sprite_cont.contains(sharedCanvas)) {
    //                             sprite_cont.removeChild(sharedCanvas);
    //                         }
    //                     },
    //                     onToggle: self => {
    //                         if (self.isActive && section.dataset.url) {
    //                             history.replaceState({ path: section.dataset.url }, '', section.dataset.url);
    //                         }
    //                     }
    //                 }
    //             });

    //             // Setup ScrollTrigger for animation
    //             ScrollTrigger.create({
    //                 trigger: section,
    //                 start: "top top",
    //                 end: "+=100%",
    //                 scrub: true,
    //                 onUpdate: (self) => {
    //                     if (currentSection !== section) return;

    //                     const totalFrames = parseInt(section.dataset.sprite);
    //                     const frame = Math.min(totalFrames - 1, Math.floor(self.progress * totalFrames));

    //                     worker.postMessage({
    //                         type: 'render',
    //                         payload: {
    //                             frame,
    //                             columns: 16
    //                         }
    //                     });
    //                 }
    //             });
    //         });
    //     })();

    //     // Cleanup function
    //     return () => {
    //         if (worker) {
    //             worker.terminate();
    //             worker = null;
    //         }
    //     };
    // });

    nm.add("(max-width: 767px)", () => {
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
            speed: 0,
            on: {
                init: function (_) {
                    this.params.speed = 300;
                    console.log("init")
                    singleSlideScrollAnimation(this);
                    playVideo(this);
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

        return () => {
            if (swiper) {
                swiper.destroy();
                swiper = null;
            }
        };
    });

})