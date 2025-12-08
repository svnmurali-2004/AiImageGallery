# AI Image Gallery 📸

Hey there! 👋 This is my project, **AI Image Gallery**. Ideally, it's a smart image organizer that runs entirely in your browser. I built this to solve the problem of organizing and finding photos without uploading them to the cloud.

## 🚀 What is this project?

This is a web application that lets you upload images, organize them into folders, and—here's the cool part—**search for images using other images**.

It uses Artificial Intelligence right inside your browser to "see" what's in your photos. So if you upload a picture of a cat, it can find all the other cats in your collection!

## 🛠️ Technical Implementation

I built this using a modern stack. Here's what's under the hood:

*   **React + TypeScript**: Used for building the user interface. I love TypeScript because it helps catch bugs early!
*   **Vite**: For super fast development and building.
*   **TensorFlow.js**: This is the brain of the project. I'm using the **MobileNet** model to analyze images directly in the browser. No Python backend required!
*   **IndexedDB**: Since LocalStorage is too small for images, I used IndexedDB (via the `idb` library) to store all your folders and image data effectively on your device.
*   **Web Workers**: To make sure the UI doesn't freeze when processing hundreds of images, I moved the heavy AI computations to a background thread.

### 🗂️ Project Structure
Here is how I organized my code:
*   `src/components/`: Reusable UI parts like `FolderList`, `ImageGrid`, and the `SearchPanel`.
*   `src/services/ai.ts`: The "Brain". This file handles loading the MobileNet model and calculating Cosine Similarity.
*   `src/worker.ts`: A background worker that runs the heavy calculations so the app stays buttery smooth.
*   `src/db.ts`: Manages the database. It saves images and folders using a schema I designed to handle thousands of records.

### ⚡ Performance Optimizations
I didn't just want it to work; I wanted it to be fast!
*   **Off-Main-Thread AI**: All image processing happens in `worker.ts`. This means you can keep scrolling and clicking while the AI crunches numbers in the background.
*   **Zero-Copy Transfer**: I use `createImageBitmap` and transfer the data to the worker without copying it, which saves memory.
*   **Smart Database Indexing**: In `db.ts`, I created indexes like `by-folder-date` so fetching images is instant, even if you have 10,000 photos.

## ✨ Capabilities

*   **Smart Visual Search**: Upload a reference image, and the app will rank your library based on similarity.
*   **Privacy First**: Since it uses TensorFlow.js and IndexedDB, **zero data leaves your computer**. It's 100% offline-capable.
*   **Folder Organization**: Create folders and manage your collections easily.
*   **Drag & Drop**: Seamless upload experience.

## 🤖 How the AI Logic Works (The "Secret Sauce")

For the curious, here is how I implemented the search feature:

1.  **Feature Extraction**: I use the **MobileNet** model (a pre-trained neural network). Instead of just classifying "cat" or "dog", I chop off the last layer and take the "embedding" (a list of numbers that represents the image's features like shapes, textures, and colors).
2.  **Cosine Similarity**: When you search, I compare the embedding of your search image with the embeddings of all images in the folder using a mathematical formula called *Cosine Similarity*.
3.  **Ranking**: The images with the highest similarity score (closer to 1.0) are shown first.

### ⚠️ A Note on Face Recognition
I noticed something interesting while testing: **This is NOT a Face Recognition app.**

If you search for *Virat Kohli*, you might get results for *Sachin Tendulkar* with a high similarity score (like 67%).
*   **Why?** The MobileNet model looks at the **entire scene**—the green cricket field, the blue jersey, the bat, and the posture. To the AI, they both look like "Cricketer in action".
*   **The Limit**: It doesn't look at fine facial features like nose shape or eye distance. For that, I'd need to implement a specialized library like `face-api.js`.

---

## 🧩 Challenges I Faced

*   **Browser Memory Limits**: At first, the app crashed when uploading large 4K images. I fixed this by using `createImageBitmap` to handle images more efficiently.
*   **UI Freezing**: The AI calculations were too heavy for the main thread, making the buttons unresponsive. Moving logic to a Web Worker was a game-changer!

## 🔮 Future Scope

*   **Face Recognition**: Integration with `face-api.js` to distinguish between specific people.
*   **Cloud Sync**: Option to backup photos to Google Drive (encrypted, of course!).
*   **Object Detection**: Drawing boxes around detected objects (like "Dog", "Car") using COCO-SSD.

---

## 🏃‍♂️ How to Run This

If you want to run this locally, it's pretty standard:

1.  Clone the repo.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Fire it up:
    ```bash
    npm run dev
    ```

Check it out and let me know what you think! 🚀
