import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Folder, ImageRecord } from './types';

interface AppDB extends DBSchema {
    folders: {
        key: string;
        value: Folder;
    };
    images: {
        key: string;
        value: ImageRecord;
        indexes: { 'by-folder': string; 'by-folder-date': [string, number] };
    };
}

const DB_NAME = 'ai-media-finder-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<AppDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, _newVersion, transaction) {
                if (!db.objectStoreNames.contains('folders')) {
                    db.createObjectStore('folders', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('images')) {
                    const imageStore = db.createObjectStore('images', { keyPath: 'id' });
                    imageStore.createIndex('by-folder', 'folderId');
                }

                // updating database structure
                if (oldVersion < 2) {
                    const imageStore = transaction.objectStore('images');
                    // help us sort images by date in the folder
                    if (!imageStore.indexNames.contains('by-folder-date')) {
                        imageStore.createIndex('by-folder-date', ['folderId', 'createdAt']);
                    }
                }
            },
        });
    }
    return dbPromise;
};

export const createFolder = async (name: string): Promise<Folder> => {
    const db = await initDB();
    const folder: Folder = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
    };
    await db.put('folders', folder);
    return folder;
};

export const getFolders = async (): Promise<Folder[]> => {
    const db = await initDB();
    return db.getAll('folders');
};

export const saveImage = async (image: ImageRecord): Promise<void> => {
    const db = await initDB();
    await db.put('images', image);
};

export const getImagesInFolder = async (folderId: string): Promise<ImageRecord[]> => {
    const db = await initDB();
    // help us sort images by date

    // just get all images (not sorted perfectly but okay for small folders)
    return db.getAllFromIndex('images', 'by-folder', folderId);
};

export const getImagesPaginated = async (
    folderId: string,
    limit: number,
    offset: number
): Promise<ImageRecord[]> => {
    const db = await initDB();
    const tx = db.transaction('images', 'readonly');
    const index = tx.store.index('by-folder-date');
    const range = IDBKeyRange.bound([folderId, -Infinity], [folderId, Infinity]);

    let cursor = await index.openCursor(range, 'prev'); // newest first

    const results: ImageRecord[] = [];

    if (offset > 0 && cursor) {
        await cursor.advance(offset);
    }

    while (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor = await cursor.continue();
    }

    return results;
};

export const getAllImages = async (): Promise<ImageRecord[]> => { // For search across all (if needed) or debugging
    const db = await initDB();
    return db.getAll('images');
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(['folders', 'images'], 'readwrite');
    await tx.objectStore('folders').delete(folderId);

    // Also delete images in folder
    const index = tx.objectStore('images').index('by-folder');
    let cursor = await index.openCursor(IDBKeyRange.only(folderId));

    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }

    await tx.done;
}

export const deleteImage = async (id: string): Promise<void> => {
    const db = await initDB();
    await db.delete('images', id);
};

export const getImageCount = async (folderId: string): Promise<number> => {
    const db = await initDB();
    const index = db.transaction('images').store.index('by-folder-date');
    return index.count(IDBKeyRange.bound([folderId, -Infinity], [folderId, Infinity]));
};
