# AI Media Finder

This is my project for organizing images and finding similar ones using AI in the browser.

## What it does

*   **Folders**: You can make folders to put your images in.
*   **Drag & Drop**: Just drag images to upload them.
*   **Visual Search**: If you upload an image, it can find other images that look like it!
*   **Everything is Local**: It doesn't send your photos to any server. Everything stays on your computer (using IndexedDB).

## How to run it

1.  Make sure you have Node.js installed.
2.  Install the packages:
    ```bash
    npm install
    ```
3.  Start the app:
    ```bash
    npm run dev
    ```

## What I used

*   **React & TypeScript**: For building the UI.
*   **TensorFlow.js**: This is the cool part! It runs the AI model right in the browser. I used the MobileNet model because it's fast.
*   **IndexedDB**: I used this to store the images and the AI data because LocalStorage was too small.

## How the AI works

I use a pre-trained model called **MobileNet** to look at the images. It turns each image into a list of numbers (embeddings). When you search, I compare the numbers of your search image with the numbers of the images in the folder to see which ones are similar.

## Future Plans

*   Maybe make it faster when uploading lots of images.
*   Try to handle really big collections better.
