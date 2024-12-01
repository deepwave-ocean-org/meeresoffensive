let currentCtx, currentSprite;

self.onmessage = async function (e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'init': {
            const { canvas } = payload;
            currentCtx = canvas.getContext('2d', { willReadFrequently: true });
            self.postMessage({ type: 'ready' });
            break;
        }

        case 'switchSprite': {
            const { filename } = payload;
            try {
                const response = await fetch(`/images/${filename}_sprite.webp`);
                const blob = await response.blob();
                currentSprite = await createImageBitmap(blob);
                self.postMessage({ type: 'spriteReady' });
            } catch (error) {
                self.postMessage({ type: 'error', error: 'Failed to load sprite' });
            }
            break;
        }

        case 'render': {
            if (!currentCtx || !currentSprite) return;

            const { frame, columns } = payload;
            const col = frame % columns;
            const row = Math.floor(frame / columns);

            currentCtx.clearRect(0, 0, 1000, 1000);
            currentCtx.drawImage(
                currentSprite,
                col * 1000, row * 1000,
                1000, 1000,
                0, 0,
                1000, 1000
            );
            break;
        }
    }
};