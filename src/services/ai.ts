import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as faceapi from '@vladmandic/face-api';

// Config
const TF_VERSION = '4.22.0';
setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${TF_VERSION}/dist/`);

// State
let model: mobilenet.MobileNet | null = null;
let faceModelLoaded = false;
let backendInitialized = false;

// Robust Backend Initialization
const initBackend = async () => {
    if (backendInitialized) return;

    try {
        console.log("Configuring TensorFlow.js backend...");

        // 1. Configure Main TFJS
        setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${TF_VERSION}/dist/`);
        await tf.setBackend('wasm');
        await tf.ready();
        console.log(`[initBackend] Main TFJS Backend initialized: ${tf.getBackend()}`);
        backendInitialized = true;
    } catch (e) {
        console.error('WASM backend failed initialization', e);
        throw new Error('Failed to initialize AI backend (WASM only)');
    }
};

export const loadModel = async () => {
    if (model) return model;

    await initBackend();

    console.log(`[loadModel] Current Backend: ${tf.getBackend()}`);
    console.log('Loading MobileNet model...');
    // Load the model.
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log('MobileNet model loaded.');
    return model;
};

export const loadFaceModel = async () => {
    if (faceModelLoaded) return;

    // Ensure backend is ready (WASM/WebGL/CPU)
    await initBackend();

    console.log(`[loadFaceModel] Current Backend: ${tf.getBackend()}`);
    console.log('Loading FaceAPI models...');

    try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        faceModelLoaded = true;
        console.log('FaceAPI models loaded.');
    } catch (error) {
        console.error("Failed to load face models", error);
        throw error;
    }
};

export const extractFeatures = async (imgElement: HTMLImageElement | ImageBitmap | ImageData): Promise<number[]> => {
    const model = await loadModel();
    console.log(`[extractFeatures] Running inference on backend: ${tf.getBackend()}`);

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

export const extractFaceFeatures = async (imgElement: HTMLImageElement | ImageBitmap | ImageData): Promise<number[][]> => {
    await loadFaceModel();
    console.log(`[extractFaceFeatures] Running inference on backend: ${tf.getBackend()}`);

    // face-api.js generally expects HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
    let input: any = imgElement;

    // Detect ALL faces
    const detections = await faceapi.detectAllFaces(input as any).withFaceLandmarks().withFaceDescriptors();

    if (detections && detections.length > 0) {
        return detections.map(d => Array.from(d.descriptor));
    }

    console.warn("No face detected");
    return [];
};

export const calculateSimilarity = (videoVector: number[], searchVector: number[]): number => {
    if (!videoVector || !searchVector || videoVector.length !== searchVector.length) {
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

export const calculateFaceMatch = (descriptor1: number[], descriptor2: number[]): number => {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    // Transform distance to similarity score:
    return Math.max(0, 1 - distance);
};
