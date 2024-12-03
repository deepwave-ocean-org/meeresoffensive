if (
    window.innerWidth > 767
) {

    function setupAllScrollTriggers() {
        gsap.registerPlugin(ScrollTrigger);

        const sections = document.querySelectorAll(".desktop-only .mo-single")
        sections.forEach((section) => {
            const videoCont = section.querySelector(".video-container");
            const video = videoCont.querySelector("video");
            const view1 = section.querySelector(".view-1");
            const view2 = section.querySelector(".view-2");
            const background = section.querySelector(".mo-background");

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