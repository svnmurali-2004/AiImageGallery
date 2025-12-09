# AI Image Gallery

Hey everyone, this is my final year project. It is an intelligent image gallery that runs completely offline in the browser. I built this to solve the privacy issues with cloud photos - I wanted a way to search and organize photos using AI without ever sending my personal data to a server.

## What it does

This application allows you to upload photos and then search through them using AI. It is not just about filenames - the system actually "sees" the content of the image.

The two main capabilities are:

1. **Scene Search**: You can find photos that look similar. For example, if you upload a photo of a beach, it will find all other beach photos in your gallery.
2. **Face Search**: You can find specific people. If you upload a photo of your friend, it finds all other photos of them.

## Key Features

**Privacy First**
The most important feature is that it is 100% local. I used TensorFlow.js to run the AI models directly on your computer's CPU. No images are ever uploaded to any server.

**Multi-Face Recognition (New)**
I recently upgraded the system to handle group photos. 
- When you upload a group photo, the system detects and remembers every single face in that image.
- If you search using a group photo, the system is smart enough to find photos of *any* of the people in that group. It uses a "best match" logic to rank the results.

**WebAssembly (WASM) Acceleration**
To make the AI fast without needing a graphics card, I configured it to use WebAssembly. This allows the heavy math calculations to run efficiently on the CPU.

## Technology Stack

I used a modern web stack to build this:
- **React & TypeScript**: For the user interface. TypeScript saved me so much time by catching errors early.
- **TensorFlow.js**: The core AI library.
- **MobileNet**: The model I used for understanding general scenes and objects.
- **Face-API.js**: The library I integrated for detecting faces and extracting facial features.
- **IndexedDB**: LocalStorage was too small, so I used IndexedDB to store the images and their AI embeddings directly in the browser database.
- **Vite**: The build tool I used for fast development.

## Challenges I Faced

**Browser Backend Issues**
Initially, I had a lot of warnings about "multiple backends registered" because Face-API and TensorFlow were trying to load different things. I had to manually configure the build system (Vite) to alias the library and force everything to use a single WebAssembly backend.

**Performance vs. Complexity**
I first tried using Web Workers to keep the UI smooth, but passing large image data back and forth was complicated and buggy. I refactored it to run on the main thread with optimized "WASM" settings, which turned out to be stable and fast enough.

## How to Run

1. Clone this repository
2. Run `npm install` to download the dependencies
3. Run `npm run dev` to start the server

That is it. Open localhost and you can start uploading images.

---

