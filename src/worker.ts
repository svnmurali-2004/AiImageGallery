import * as ai from './services/ai';

self.onmessage = async (e: MessageEvent) => {
    const { id, bitmap, mode } = e.data;

    try {
        let result: any = {};

        // Always do visual embedding as base
        const embedding = await ai.extractFeatures(bitmap);
        result.embedding = embedding;

        // If face mode or auto-processing, try face
        // NOTE: In a real app, we might want to pass a flag. 
        // For now, let's just Try to extract face if requested or if we are just processing.
        // Actually, let's try to extract face embedding ALWAYS if possible, 
        // so we don't have to re-process later.
        if (mode === 'face' || !mode) {
            const faceEmbedding = await ai.extractFaceFeatures(bitmap);
            if (faceEmbedding && faceEmbedding.length > 0) {
                result.faceEmbedding = faceEmbedding;
            }
        }

        self.postMessage({ id, ...result });
    } catch (error) {
        console.error('Worker error:', error);
        self.postMessage({ id, error: 'Failed to process image' });
    }
};
