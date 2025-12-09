
import * as faceapi from '@vladmandic/face-api';

console.log('faceapi keys:', Object.keys(faceapi));

if (faceapi.tf) {
    console.log('faceapi.tf keys:', Object.keys(faceapi.tf));
    // Check for setWasmPaths in tf object
    console.log('faceapi.tf.setWasmPaths:', typeof faceapi.tf.setWasmPaths);

    // Check for wasm property in tf object (maybe backend-wasm is attached?)
    // Note: TFJS usually doesn't attach backend methods to tf directly unless augmented.
    console.log('faceapi.tf.wasm:', faceapi.tf.wasm);
} else {
    console.log('faceapi.tf is undefined');
}

if (faceapi.env) {
    console.log('faceapi.env keys:', Object.keys(faceapi.env));
} else {
    // faceapi.env might be defined on the default export if star import behaves differently?
    // Let's check default export too
}
