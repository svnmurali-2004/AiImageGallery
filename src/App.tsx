import { useRef, useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, FolderPlus, Image as ImageIcon } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { FolderList } from './components/FolderList';
import { UploadZone } from './components/UploadZone';
import { ImageGrid } from './components/ImageGrid';
import type { Folder, ImageRecord, SearchResult } from './types';
import * as db from './db';
import * as ai from './services/ai';
import { fileToDataURL, loadImage } from './utils';
import './index.css';

const PAGE_LIMIT = 20;

function App() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isModelReady, setIsModelReady] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Page stuff
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchReferenceImage, setSearchReferenceImage] = useState<string | null>(null);

  // Load folders when the app starts
  useEffect(() => {
    loadFolders();
    // Load the AI model
    ai.loadModel().then(() => setIsModelReady(true)).catch(err => {
      console.error("Model load failed", err);
      toast.error("Failed to load AI model");
    });
  }, []);

  // Update images when we pick a different folder
  useEffect(() => {
    if (selectedFolderId) {
      setPage(0);
      loadImages(selectedFolderId, 0);
    } else {
      setImages([]);
      setTotalPages(0);
    }
  }, [selectedFolderId]);

  const loadFolders = async () => {
    try {
      const allFolders = await db.getFolders();
      // Show newest folders first
      setFolders(allFolders.sort((a, b) => b.createdAt - a.createdAt));
      // Select the first folder if nothing is selected
      if (!selectedFolderId && allFolders.length > 0) {
        setSelectedFolderId(allFolders[0].id);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
      toast.error('Failed to load folders');
    }
  };

  const loadImages = async (folderId: string, pageNum: number) => {
    try {
      setIsLoading(true);

      // check how many images we have
      const count = await db.getImageCount(folderId);
      setTotalPages(Math.ceil(count / PAGE_LIMIT));

      const offset = pageNum * PAGE_LIMIT;
      const newImages = await db.getImagesPaginated(folderId, PAGE_LIMIT, offset);

      setImages(newImages); // Replace images for the current page
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load images:', err);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (newPage < totalPages || totalPages === 0) && selectedFolderId) {
      loadImages(selectedFolderId, newPage);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = await db.createFolder(name);
      setFolders(prev => [newFolder, ...prev]);
      setSelectedFolderId(newFolder.id);
      toast.success('Folder created');
    } catch (err) {
      console.error('Failed to create folder:', err);
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await db.deleteFolder(id);
      setFolders(prev => prev.filter(f => f.id !== id));
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
      toast.success('Folder deleted');
    } catch (err) {
      console.error('Failed to delete folder:', err);
      toast.error('Failed to delete folder');
    }
  };

  const handleUpload = useCallback(async (files: File[]) => {
    if (!selectedFolderId || !isModelReady) return;

    setIsProcessing(true);
    setProcessingStatus(`Processing 0/${files.length}...`);
    const toastId = toast.loading('Processing images...');

    try {
      const newImages: ImageRecord[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStatus(`Processing ${i + 1}/${files.length}: ${file.name}`);
        try {
          const dataUrl = await fileToDataURL(file);
          const imgEl = await loadImage(dataUrl);

          // get image features using the AI model
          const embedding = await ai.extractFeatures(imgEl);

          const record: ImageRecord = {
            id: crypto.randomUUID(),
            folderId: selectedFolderId,
            name: file.name,
            dataUrl,
            embedding,
            createdAt: Date.now(),
            width: imgEl.width,
            height: imgEl.height
          };

          await db.saveImage(record);
          newImages.push(record);

          // pause a bit to let the screen update
          await new Promise(r => setTimeout(r, 10));
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
          toast.error(`Failed to process ${file.name}`, { id: toastId });
        }
      }

      // Refresh the list
      loadImages(selectedFolderId, 0);
      toast.success('Images processed', { id: toastId });
    } catch {
      toast.error('Upload failed', { id: toastId });
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  }, [selectedFolderId, isModelReady]);

  const handleDeleteImage = async (id: string) => {
    try {
      await db.deleteImage(id);
      // Update the screen
      if (selectedFolderId) {
        loadImages(selectedFolderId, page);
        // if we are searching, remove it from results too
        if (isSearching) {
          setSearchResults(prev => prev.filter(img => img.id !== id));
        }
      }
      toast.success('Image deleted');
    } catch (err) {
      console.error('Failed to delete image:', err);
      toast.error('Failed to delete image');
    }
  };

  const handleSearch = async (file: File) => {
    if (!isModelReady) return;
    setIsSearching(true);
    const toastId = toast.loading('Searching...');

    try {
      const dataUrl = await fileToDataURL(file);
      setSearchReferenceImage(dataUrl); // Set thumbnail

      const imgEl = await loadImage(dataUrl);
      const searchEmbedding = await ai.extractFeatures(imgEl);

      if (!selectedFolderId) return;
      const allImagesInFolder = await db.getImagesInFolder(selectedFolderId);

      // check against all my images
      const results: SearchResult[] = allImagesInFolder.map(img => ({
        ...img,
        score: ai.calculateSimilarity(img.embedding, searchEmbedding)
      }));

      // show the best matches first
      const sorted = results
        .filter(r => r.score > 0.5) // Optional threshold
        .sort((a, b) => b.score - a.score);

      setSearchResults(sorted);
      toast.success(`Found ${sorted.length} matches`, { id: toastId });
    } catch (err) {
      console.error("Search failed", err);
      toast.error('Search failed', { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchReferenceImage(null);
  };

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  // Show search results or just regular images
  const displayImages = searchResults.length > 0 ? searchResults : images;
  const isShowingValues = searchResults.length > 0;

  const renderPagination = () => {
    // Don't show buttons if we don't need them
    if (isShowingValues) return null;
    if (totalPages === 0) return null;

    return (
      <div style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        backgroundColor: 'var(--bg-app)',
        borderTop: '1px solid var(--border-color)',
        padding: '16px 0',
        marginTop: 'auto', // Push to bottom if content is short
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 0}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '8px',
            borderRadius: 8,
            cursor: page === 0 ? 'not-allowed' : 'pointer',
            opacity: page === 0 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <span style={{ color: 'var(--text-secondary)' }}>
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages - 1}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '8px',
            borderRadius: 8,
            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            opacity: page >= totalPages - 1 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  return (
    <Layout
      sidebar={
        <FolderList
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={(id) => {
            setSelectedFolderId(id);
            setSearchResults([]); // Clear search when changing folder
          }}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      }
      content={
        <div ref={contentRef} style={{ height: '100%', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }
            }}
          />
          {selectedFolder ? (
            <>
              {/* Content Wrapper */}
              <div style={{ padding: 24, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h1 style={{ margin: 0 }}>{selectedFolder.name}</h1>
                    {isShowingValues && (
                      <>
                        {searchReferenceImage && (
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            overflow: 'hidden',
                            border: '1px solid var(--accent-primary)'
                          }}>
                            <img src={searchReferenceImage} alt="Reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <button
                          onClick={clearSearch}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            borderRadius: 16,
                            padding: '4px 12px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          Clear Search ✕
                        </button>
                      </>
                    )}
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <Search size={18} />
                    Visual Search
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSearch(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                {!isShowingValues && (
                  <UploadZone
                    onFilesSelected={handleUpload}
                    isProcessing={isProcessing}
                    processingStatus={processingStatus}
                  />
                )}

                <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s', marginTop: 24 }}>
                  <ImageGrid
                    images={displayImages}
                    onDelete={handleDeleteImage}
                  />
                </div>

                {isShowingValues && displayImages.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40 }}>
                    No matches found. Try a different image.
                  </p>
                )}

                {!isModelReady && <p style={{ color: 'orange' }}>Loading AI Model...</p>}
              </div>

              {renderPagination()}
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              flex: 1,
              gap: 16
            }}>
              <div style={{
                background: 'var(--bg-card)',
                padding: 40,
                borderRadius: 16,
                border: '1px solid var(--border-color)',
                textAlign: 'center',
                maxWidth: 400
              }}>
                {folders.length === 0 ? (
                  <>
                    <FolderPlus size={48} style={{ marginBottom: 16, color: 'var(--accent-primary)', opacity: 0.8 }} />
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Welcome to AI Media Finder</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                      To get started, create a new folder in the sidebar to organize your images.
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon size={48} style={{ marginBottom: 16, color: 'var(--text-secondary)', opacity: 0.5 }} />
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Folder Selected</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                      Select a folder from the sidebar to view your collection.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

export default App;
