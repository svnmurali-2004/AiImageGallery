import React, { useState } from 'react';
import { Folder, Plus, Trash2 } from 'lucide-react';
import type { Folder as FolderType } from '../types';
import css from './FolderList.module.css';
import clsx from 'clsx';

interface FolderListProps {
    folders: FolderType[];
    selectedFolderId: string | null;
    onSelectFolder: (id: string) => void;
    onCreateFolder: (name: string) => void;
    onDeleteFolder: (id: string) => void;
}

export const FolderList: React.FC<FolderListProps> = ({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onDeleteFolder
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim());
            setNewFolderName('');
            setIsCreating(false);
        }
    };

    return (
        <div className={css.container}>
            <div className={css.header}>
                <h2 className={css.title}>AI Image Gallery</h2>
                <button
                    className={css.addButton}
                    onClick={() => setIsCreating(true)}
                    title="New Folder"
                >
                    <Plus size={20} />
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className={css.createForm}>
                    <input
                        autoFocus
                        type="text"
                        className={css.input}
                        placeholder="Folder name..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onBlur={() => {
                            // Determine if we should cancel or submit? 
                            // Better to simple cancel on blur if empty, or keep focus if not.
                            // Let's just have a cancel on escape or something, or simple "close" logic
                            if (!newFolderName.trim()) setIsCreating(false);
                        }}
                    />
                </form>
            )}

            <div className={css.list}>
                {folders.map(folder => (
                    <div
                        key={folder.id}
                        className={clsx(css.item, folder.id === selectedFolderId && css.selected)}
                        onClick={() => onSelectFolder(folder.id)}
                    >
                        <Folder size={18} className={css.icon} />
                        <span className={css.name}>{folder.name}</span>
                        <button
                            className={css.deleteButton}
                            title="Delete Folder"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${folder.name}" and all contents?`)) {
                                    onDeleteFolder(folder.id);
                                }
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}

                {folders.length === 0 && !isCreating && (
                    <div className={css.emptyState}>No folders yet.</div>
                )}
            </div>
        </div>
    );
};
