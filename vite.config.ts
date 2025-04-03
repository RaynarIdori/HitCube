import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    'three-examples': ['three/examples/jsm/controls/PointerLockControls.js', 'three/examples/jsm/loaders/RGBELoader.js'],
                    vendor: ['stats.js'],
                }
            }
        }
    }
}); 