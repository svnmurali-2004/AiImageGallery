
import fs from 'fs';
import https from 'https';
import path from 'path';

const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const TARGET_DIR = './public/models';

const models = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

async function downloadFile(filename: string) {
    return new Promise<void>((resolve, reject) => {
        const file = fs.createWriteStream(path.join(TARGET_DIR, filename));
        https.get(`${MODELS_URL}/${filename}`, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(path.join(TARGET_DIR, filename), () => { });
            reject(err);
        });
    });
}

async function main() {
    try {
        if (!fs.existsSync(TARGET_DIR)) {
            fs.mkdirSync(TARGET_DIR, { recursive: true });
        }
        console.log('Starting model downloads...');
        await Promise.all(models.map(downloadFile));
        console.log('All models downloaded successfully!');
    } catch (error) {
        console.error('Error downloading models:', error);
    }
}

main();
