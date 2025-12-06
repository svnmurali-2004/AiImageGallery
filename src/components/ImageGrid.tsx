import { Trash2 } from 'lucide-react';
import type { ImageRecord, SearchResult } from '../types';
import css from './ImageGrid.module.css';

interface ImageGridProps {
    images: (ImageRecord | SearchResult)[];
    onDelete: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, onDelete }) => {
    if (images.length === 0) {
        return null;
    }

    return (
        <div className={css.grid}>
            {images.map(img => (
                <div key={img.id} className={css.card}>
                    <div className={css.imageWrapper}>
                        <img src={img.dataUrl} alt={img.name} className={css.image} loading="lazy" />

                        {(img as SearchResult).score !== undefined && (
                            <div className={css.scoreBadge}>
                                {Math.round((img as SearchResult).score * 100)}%
                            </div>
                        )}

                        <button
                            className={css.deleteButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this image?')) {
                                    onDelete(img.id);
                                }
                            }}
                            title="Delete Image"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className={css.info}>
                        <span className={css.name}>{img.name}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
