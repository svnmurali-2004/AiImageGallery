export interface Folder {
    id: string;
    name: string;
    createdAt: number;
}

export interface ImageRecord {
    id: string;
    folderId: string;
    name: string;
    dataUrl: string; // Base64 string
    embedding: number[]; // Feature vector
    createdAt: number;
    width: number;
    height: number;
}

export interface SearchResult extends ImageRecord {
    score: number; // Similarity score (0-1)
}
