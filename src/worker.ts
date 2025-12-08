import * as ai from './services/ai';

self.onmessage = async (e: MessageEvent) => {
    const { id, bitmap } = e.data;

    try {
        const embedding = await ai.extractFeatures(bitmap);
        self.postMessage({ id, embedding });
    } catch (error) {
        console.error('Worker error:', error);
        self.postMessage({ id, error: 'Failed to process image' });
    }
};
