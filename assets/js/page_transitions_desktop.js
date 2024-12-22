if (
    window.innerWidth > 767
) {

    function setupAllScrollTriggers() {
        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });

        lenis.on("scroll", () => {
            ScrollTrigger.update();
        });


        // ScrollTrigger.scrollerProxy(document.documentElement, {
        //     scrollTop(value) {
        //         // Important: handle both getting and setting scroll position
        //         if (arguments.length) {
        //             lenis.scrollTo(value);  // Set scroll position
        //         }
        //         return lenis.scroll;        // Get scroll position
        //     },
        //     getBoundingClientRect() {
        //         return {
        //             top: 0,
        //             left: 0,
        //             width: window.innerWidth,
        //             height: window.innerHeight
        //         };
        //     }
        // });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        function closeMap() {
            map.classList.add("hidden");
            document.querySelectorAll(".video-container.hidden, .view-1.hidden, .view-2.hidden").forEach(el => el.classList.remove("hidden"));
            document.querySelector(".mo-background.background-dark").classList.remove("background-dark");
            document.querySelector(".navigation-opener.active").classList.remove("active")
            lenis.start();
            document.body.style.overflow = '';
            search.blur();
            search.value = "";
            window.renderSearchResults()
        }
        function openMap(section) {
            const videoCont = section.querySelector(".video-container");
            const view1 = section.querySelector(".view-1");
            const view2 = section.querySelector(".view-2");
            const background = section.querySelector(".mo-background");
            const navigation = section.querySelector(".navigation-opener ")

            window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY);
            navigation.classList.add("active");
            [videoCont, view1, view2].forEach(el => el.classList.add("hidden"));
            map.classList.remove("hidden");
            background.classList.add("background-dark");
            lenis.stop();
            document.body.style.overflow = 'hidden';
            search.focus();
            window.renderSearchResults()
        }


        window.closeMap = closeMap
        window.openMap = openMap



        const sections = document.querySelectorAll(".desktop-only .mo-single")
        const map = document.getElementById("map")
        const search = document.getElementById("search-bar")

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();

                // Find most visible section at the moment Ctrl+K is pressed
                const sections = document.querySelectorAll('section');
                let currentSection = null;
                let maxVisibleArea = 0;

                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    const viewHeight = window.innerHeight;
                    const visibleHeight = Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0);
                    const visibleArea = Math.max(0, visibleHeight);

                    if (visibleArea > maxVisibleArea) {
                        maxVisibleArea = visibleArea;
                        currentSection = section;
                    }
                });

                if (currentSection) {
                    openMap(currentSection);
                    search.focus();
                }
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                closeMap();
            }
        });

        sections.forEach((section) => {
            const videoCont = section.querySelector(".video-container");
            const video = videoCont.querySelector("video");
            const view1 = section.querySelector(".view-1");
            const view2 = section.querySelector(".view-2");
            const background = section.querySelector(".mo-background");
            const navigation = section.querySelector(".navigation-opener ")

            navigation.addEventListener("click", () => {
                if (!navigation.classList.contains("active")) {
                    openMap(section)
                    return
                }
                closeMap()
            })

            console.log(video)
            video.playbackRate = 0.6
            gsap.to(videoCont, {
                left: -window.innerWidth,
                duration: 0.5,
                scrollTrigger: {
                    trigger: section,
                    // markers: true,
                    onEnter: () => {
                        video.currentTime = 0;
                        video.play();
                    },
                    onLeave: () => {
                        video.pause();
                    },
                    start: "50% top",
                    toggleActions: "play none none reverse"
                }
            });
            gsap.to(view1, {
                left: -window.innerWidth,
                duration: 0.5,
                scrollTrigger: {
                    trigger: section,
                    // markers: true,
                    start: "50% top",
                    toggleActions: "play none none reverse"
                }
            });
            gsap.to(view2, {
                left: 0,
                duration: 0.5,
                scrollTrigger: {
                    trigger: section,
                    // markers: true,
                    start: "50% top",
                    toggleActions: "play none none reverse",
                }
            });
            gsap.to(background, {
                opacity: 0.2,
                duration: 0.5,
                scrollTrigger: {
                    trigger: section,
                    // markers: true,
                    start: "50% top",
                    toggleActions: "play none none reverse",
                }
            });

            ScrollTrigger.create({
                trigger: section,
                pin: true,
                start: "top top",
                end: "+=100%",
                onToggle: () => {
                    if (section.dataset.url) {
                        history.replaceState({ path: section.dataset.url }, '', section.dataset.url);
                    }
                },
                onEnter: () => {
                    video.currentTime = 0;
                    video.play();
                },
                onEnterBack: () => {
                    video.currentTime = 0;
                    video.play();
                },
                onLeave: () => {
                    video.pause();
                }

            });
        })
    }
    document.addEventListener('DOMContentLoaded', function () {
        console.log("desktooop")
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