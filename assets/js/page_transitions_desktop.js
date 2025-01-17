if (
    window.innerWidth > 767
) {
    let isChanging = false
    function switchVideoVisibility(oldVideo, newVideo) {
        isChanging = true;
        const onSeeked = () => {
            newVideo.classList.remove("hidden");
            oldVideo.classList.add("hidden");
            isChanging = false
        };

        newVideo.addEventListener('seeked', onSeeked, { once: true });
    }

    function playVideo(video, otherVideo, scaledVelocity) {
        const isVisible = !video.classList.contains("hidden");
        if (!isVisible && !isChanging) {
            switchVideoVisibility(otherVideo, video);
            return;
        }
        if (video.readyState != 4) {
            console.log(video.readyState)
            return;
        }
        isChanging = false

        try {
            const rate = Math.max(0.0625, Math.min(16, scaledVelocity));
            if (video.playbackRate !== rate) {
                video.playbackRate = rate;
            }

            if (video.paused && video.currentTime !== video.duration) {
                video.play().catch(e => console.warn('Video play failed:', e));
            }
        } catch (e) {
            if (e instanceof DOMException && e.name === "NotSupportedError") {
                const fallbackRate = Math.max(0.5, Math.min(4, scaledVelocity));
                video.playbackRate = fallbackRate;
                if (video.paused && video.currentTime !== video.duration) {
                    video.play().catch(e => console.warn('Video play failed:', e));
                }
            } else {
                console.error('Video playback error:', e);
            }
        }
    }

    function setupAllScrollTriggers() {
        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });

        lenis.on("scroll", () => {
            ScrollTrigger.update();
        });

        window.lenis = lenis

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);


        const sections = document.querySelectorAll(".desktop-only .mo-single")

        let currentAnimation = null;

        sections.forEach((section, index) => {
            const videoCont = section.querySelector(".video-container");
            const video = videoCont.querySelector("video");
            const videoReversed = videoCont.querySelector("video.reversed");
            const view1 = section.querySelector(".view-1");
            const view2 = section.querySelector(".view-2");
            const background = section.querySelector(".mo-background");
            const navigation = section.querySelector(".navigation-opener ")
            const sectionParent = document.getElementsByClassName("mo-section")[index]

            navigation.addEventListener("click", () => {
                if (!navigation.classList.contains("active")) {
                    window.openMap(section)
                    return
                }
                window.closeMap()
            })

            let isPlayingForward = true;

            const animationTrigger = {
                id: "show-explanation-" + section.id,
                trigger: section,
                start: "900% top",
                end: "920% top",
                // markers: true,
                scrub: true,
                onLeaveBack: () => {
                    if (isPlayingForward) {
                        videoReversed.currentTime = 0.1;
                    }
                },
            };

            gsap.to(videoCont, {
                left: -window.innerWidth,
                scrollTrigger: animationTrigger
            });
            gsap.to(view1, {
                left: -window.innerWidth,
                scrollTrigger: animationTrigger
            });
            gsap.to(view2, {
                left: 0,
                scrollTrigger: animationTrigger
            });
            gsap.to(background, {
                opacity: 0.2,
                scrollTrigger: animationTrigger
            });

            video.addEventListener('ended', () => {
                const triggerPosition = ScrollTrigger.getById("show-explanation-" + section.id).start;
                // console.log("video ended", window.scrollY, triggerPosition, sectionParent.getBoundingClientRect().y)
                if (window.scrollY > triggerPosition) {
                    return
                }
                if (sectionParent.getBoundingClientRect().y > 0) {
                    return
                }
                if (currentAnimation) {
                    currentAnimation.abort();
                }
                const controller = new AbortController();
                currentAnimation = controller;
                lenis.scrollTo(triggerPosition, {
                    offset: -150,
                    immediate: true,
                    signal: controller.signal,
                    onComplete: () => {
                        if (currentAnimation === controller) {
                            currentAnimation = null;
                        }
                    },
                    onAbort: () => {
                        console.log('Scroll animation aborted');
                    }
                })
            });

            videoReversed.addEventListener('ended', () => {
                if (sectionParent.getBoundingClientRect().y > 0 && sectionParent.getBoundingClientRect().y < window.innerHeight * 10) {
                    return
                }
                if (currentAnimation) {
                    currentAnimation.abort();
                }

                const controller = new AbortController();
                currentAnimation = controller;
                lenis.scrollTo(sectionParent.getBoundingClientRect().y + window.scrollY, {
                    offset: 0,
                    immediate: true,
                    signal: controller.signal,
                    onComplete: () => {
                        if (currentAnimation === controller) {
                            currentAnimation = null;
                        }
                    },
                    onAbort: () => {
                        console.log('Scroll animation aborted');
                    }
                })
            });

            const velocityToPlaybackFactor = 1000

            ScrollTrigger.create({
                trigger: section,
                id: "pin-section-" + section.id,
                pin: true,
                start: "top top",
                // markers: true,
                end: "+=1000%",
                onToggle: (e) => {
                    if (!e.isActive) {
                        return
                    }
                    if (section.dataset.url) {
                        history.replaceState({ path: section.dataset.url }, '', section.dataset.url);
                    };
                },
                onEnter: () => {
                    video.currentTime = 0.1;
                },
                onEnterBack: () => {
                    videoReversed.currentTime = 0.1;
                },
                onUpdate: (e) => {
                    const scaledVelocity = e.getVelocity() / velocityToPlaybackFactor

                    if (Math.abs(scaledVelocity) > 16) {
                        return
                    }
                    if (scaledVelocity > 0.2) {
                        if (!isPlayingForward) {
                            video.currentTime = video.duration - videoReversed.currentTime;
                            isPlayingForward = true;
                        }
                        playVideo(video, videoReversed, scaledVelocity);
                    }
                    else if (scaledVelocity < -0.2 && videoReversed.readyState > 0) {
                        if (isPlayingForward) {
                            videoReversed.currentTime = videoReversed.duration - video.currentTime;
                            isPlayingForward = false;
                        }
                        playVideo(videoReversed, video, -1 * scaledVelocity);
                    }
                    else {
                        video.pause();
                        videoReversed.pause();
                    }
                },
            });
        })
    }
    document.addEventListener('DOMContentLoaded', function () {
        setupAllScrollTriggers();

        ScrollTrigger.refresh();

        requestAnimationFrame(() => {
            document.querySelector('.desktop-only').classList.remove('swiper-hidden');
        });
    })
}

// if (document.documentElement.classList.contains('is-desktop')) {
//     document.addEventListener('DOMContentLoaded', function () {
//         console.log("deesktop!")
//         gsap.registerPlugin(ScrollTrigger);

//         const sections = document.querySelectorAll('.panel');
//         let worker, sharedCanvas;

//         // Create single worker and canvas
//         const initializeWorker = async () => {
//             try {
//                 // Create shared canvas
//                 sharedCanvas = document.createElement('canvas');
//                 sharedCanvas.width = 1000;
//                 sharedCanvas.height = 1000;
//                 sharedCanvas.style.width = '40vw';
//                 sharedCanvas.style.height = '40vw';

//                 // Create worker
//                 worker = new Worker(window.workerURL);

//                 // Initialize worker with offscreen canvas
//                 const offscreen = sharedCanvas.transferControlToOffscreen();
//                 worker.postMessage({
//                     type: 'init',
//                     payload: { canvas: offscreen, load_first: 0 }
//                 }, [offscreen]);

//                 // Wait for worker to be ready
//                 await new Promise(resolve => {
//                     worker.onmessage = (e) => {
//                         if (e.data.type === 'ready') resolve();
//                     };
//                 });

//             } catch (error) {
//                 console.error('Failed to initialize worker:', error);
//                 return false;
//             }
//             return true;
//         };


//         // Initialize everything
//         sections.forEach((section, index) => {
//             const sprite_cont = section.querySelector(".sprite-container");

//             // Setup ScrollTrigger for pinning
//             gsap.from(section, {
//                 scrollTrigger: {
//                     trigger: section,
//                     scrub: true,
//                     pin: true,
//                     start: "top top",
//                     end: "+=100%",
//                     onEnter: () => {
//                         sprite_cont.appendChild(sharedCanvas);
//                     },
//                     onEnterBack: async () => {
//                         sprite_cont.appendChild(sharedCanvas);
//                     },
//                     onLeave: () => {
//                         if (sprite_cont.contains(sharedCanvas)) {
//                             sprite_cont.removeChild(sharedCanvas);
//                         }
//                     },
//                     onLeaveBack: () => {
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
//                     const totalFrames = parseInt(section.dataset.sprite);
//                     const frame = Math.min(totalFrames - 1, Math.floor(self.progress * totalFrames));

//                     worker.postMessage({
//                         type: 'render',
//                         payload: {
//                             index,
//                             frame,
//                             columns: 16
//                         }
//                     });
//                 }
//             });
//         });
//         (async () => {
//             if (!await initializeWorker()) return;
//         })();

//         // Cleanup function
//         return () => {
//             if (worker) {
//                 worker.terminate();
//                 worker = null;
//             }
//         };
//     });

// }