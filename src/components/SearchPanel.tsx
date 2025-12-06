import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { SearchResult } from '../types';
import css from './SearchPanel.module.css';

interface SearchPanelProps {
    onSearch: (file: File) => Promise<void>;
    onClose: () => void;
    results: SearchResult[];
    isSearching: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, onClose, results, isSearching }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPreviewUrl(URL.createObjectURL(file));
            await onSearch(file);
        }
    };

    return (
        <div className={css.overlay}>
            <div className={css.panel}>
                <div className={css.header}>
                    <h2 className={css.title}>Visual Search</h2>
                    <button onClick={onClose} className={css.closeButton}>
                        <X size={24} />
                    </button>
                </div>

                <div className={css.searchArea}>
                    <div
                        className={css.uploadBox}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <img src={previewUrl} className={css.previewImage} alt="Reference" />
                        ) : (
                            <div className={css.placeholder}>
                                <Search size={32} className={css.searchIcon} />
                                <p>Click to upload reference image</p>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <div className={css.resultsArea}>
                    {isSearching ? (
                        <div className={css.loading}>Searching...</div>
                    ) : results.length > 0 ? (
                        <>
                            <h3 className={css.subtitle}>Top Matches</h3>
                            <div className={css.resultsGrid}>
                                {results.map(img => (
                                    <div key={img.id} className={css.resultCard}>
                                        <div className={css.imageWrapper}>
                                            <img src={img.dataUrl} alt={img.name} className={css.image} />
                                            <div className={css.scoreBadge}>
                                                {(img.score * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : previewUrl ? (
                        <div className={css.empty}>No similar images found.</div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
