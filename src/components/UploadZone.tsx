import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import css from './UploadZone.module.css';
import clsx from 'clsx';

interface UploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    isProcessing: boolean;
    processingStatus?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, isProcessing, processingStatus }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (isProcessing) return;

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, [onFilesSelected, isProcessing]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && !isProcessing) {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            onFilesSelected(files);
        }
    };

    return (
        <div
            className={clsx(css.container, isDragOver && css.dragOver, isProcessing && css.processing)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className={css.input}
                id="file-upload"
                disabled={isProcessing}
            />
            <label htmlFor="file-upload" className={css.label}>
                <UploadCloud size={48} className={css.icon} />
                <p className={css.text}>
                    {isProcessing ? (processingStatus || 'Processing Images...') : 'Drag images here or click to upload'}
                </p>
                <span className={css.subtext}>JPG, PNG, WEBP</span>
            </label>
        </div>
    );
};
