import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// use CDN for the AI stuff
setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/');

// keep one loaded model so we don't reload it
let model: mobilenet.MobileNet | null = null;

export const loadModel = async () => {
    if (model) return model;
    console.log('Loading MobileNet model...');

    // try using WASM because it's faster usually
    try {
        await tf.setBackend('wasm');
        console.log('Backend set to: WASM');
    } catch (e) {
        console.error('Failed to set backend', e);
    }

    // Load the model.
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log('MobileNet model loaded.');
    return model;
};

export const extractFeatures = async (imgElement: HTMLImageElement | ImageBitmap | ImageData): Promise<number[]> => {
    const model = await loadModel();

    const embedding = tf.tidy(() => {
        return model.infer(imgElement as any, true);
    });

    if (embedding instanceof tf.Tensor) {
        const data = await embedding.data();
        embedding.dispose(); // free up memory
        return Array.from(data);
    }

    return []; // Should not happen with embedding=true
};

// Cosine Similarity
export const calculateSimilarity = (videoVector: number[], searchVector: number[]): number => {
    if (videoVector.length !== searchVector.length) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < videoVector.length; i++) {
        dotProduct += videoVector[i] * searchVector[i];
        normA += videoVector[i] * videoVector[i];
        normB += searchVector[i] * searchVector[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
