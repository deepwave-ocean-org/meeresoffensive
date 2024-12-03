// let ctx;
// let masterCanvas, masterCtx;
// let sprites = [
//     "mo11",
//     "mo14",
//     "mo21",
//     "mo22",
//     "mo23",
//     "mo24",
//     "mo31",
//     "mo32",
//     "mo34",
//     "mo35",
//     "mo36",
//     "mo37",
//     "mo39",
//     "mo391",
//     "mo41",
//     "mo42",
//     "mo44",
//     "mo45",
//     "mo51",
//     "mo52",
//     "mo53",
//     "mo54",
//     "mo55",
//     "mo56",
// ]
// self.onmessage = async function (e) {
//     const { type, payload } = e.data;
//     switch (type) {
//         case 'init': {

//             const { canvas, load_first } = payload;
//             console.log("init", load_first)
//             masterCanvas = new OffscreenCanvas(1000, 1000 * sprites.length);
//             masterCtx = masterCanvas.getContext('2d', { willReadFrequently: true });


//             ctx = canvas.getContext('2d', { willReadFrequently: true });
//             try {
//                 for (let i = 0; i < sprites.length; i++) {
//                     const filename = sprites[i];
//                     console.log("loadin", filename)
//                     const response = await fetch(`/images/${filename}_sprite.webp`);
//                     const blob = await response.blob();
//                     const sprite = await createImageBitmap(blob);
//                     sprites.push(sprite);

//                     // Draw sprite to master canvas
//                     masterCtx.drawImage(sprite, i * 16000, 0);
//                 }
//                 self.postMessage({ type: 'ready' });
//             } catch (error) {
//                 self.postMessage({ type: 'error', error: 'Failed to load sprites' });
//             }
//             break;
//         }

//         case 'render': {
//             if (!ctx) return;

//             const { index, frame, columns } = payload;
//             console.log(index)
//             const col = frame % columns;
//             const row = Math.floor(frame / columns);

//             ctx.clearRect(0, 0, 1000, 1000);
//             ctx.drawImage(
//                 masterCanvas,
//                 col * 1000 + (index * 16000),
//                 (row * 1000),
//                 1000,
//                 1000,
//                 0,
//                 0,
//                 1000,
//                 1000
//             );
//             break;
//         }
//     }
// };