import React from 'react';
import css from './Layout.module.css';

interface LayoutProps {
    sidebar: React.ReactNode;
    content: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, content }) => {
    return (
        <div className={css.container}>
            <aside className={css.sidebar}>
                {sidebar}
            </aside>
            <main className={css.main}>
                {content}
            </main>
        </div>
    );
};
