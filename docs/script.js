/**
 * Discord File Host - Frontend Script
 * Fetches files.json and renders the file list
 */

(function () {
    'use strict';

    // DOM Elements
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const errorMessageEl = document.getElementById('error-message');
    const emptyEl = document.getElementById('empty');
    const filesGridEl = document.getElementById('files-grid');
    const statsEl = document.getElementById('stats');
    const fileCountEl = document.getElementById('file-count');

    // File type icons
    const FILE_ICONS = {
        pdf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
        audio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
        archive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>`,
        code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
        default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
    };

    // File type categories
    const FILE_CATEGORIES = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'],
        video: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
        audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
        pdf: ['pdf'],
        archive: ['zip', 'rar', '7z', 'tar', 'gz'],
        code: ['js', 'py', 'html', 'css', 'json', 'xml', 'md', 'txt']
    };

    /**
     * Get file extension from filename
     */
    function getExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    }

    /**
     * Get file category for icon selection
     */
    function getFileCategory(filename) {
        const ext = getExtension(filename);
        for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
            if (extensions.includes(ext)) return category;
        }
        return 'default';
    }

    /**
     * Format file size
     */
    function formatSize(bytes) {
        if (!bytes || bytes === 0) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        let unitIndex = 0;
        let size = bytes;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Format date
     */
    function formatDate(isoString) {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    }

    /**
     * Create file card HTML
     */
    function createFileCard(file) {
        const category = getFileCategory(file.name);
        const icon = FILE_ICONS[category];
        const extension = getExtension(file.name).toUpperCase() || 'FILE';
        const size = formatSize(file.size);
        const date = formatDate(file.uploaded_at);
        const author = file.author || 'Unknown';

        const card = document.createElement('a');
        card.className = 'file-card';
        card.href = file.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        card.innerHTML = `
            <div class="file-header">
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-type">${extension}</div>
                </div>
            </div>
            <div class="file-meta">
                <div class="file-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>${escapeHtml(author)}</span>
                </div>
                ${date ? `
                <div class="file-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>${date}</span>
                </div>` : ''}
                ${size ? `
                <div class="file-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>${size}</span>
                </div>` : ''}
            </div>
        `;

        return card;
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show specific state, hide others
     */
    function showState(state) {
        loadingEl.classList.add('hidden');
        errorEl.classList.add('hidden');
        emptyEl.classList.add('hidden');
        filesGridEl.classList.add('hidden');
        statsEl.classList.add('hidden');

        switch (state) {
            case 'loading':
                loadingEl.classList.remove('hidden');
                break;
            case 'error':
                errorEl.classList.remove('hidden');
                break;
            case 'empty':
                emptyEl.classList.remove('hidden');
                break;
            case 'files':
                filesGridEl.classList.remove('hidden');
                statsEl.classList.remove('hidden');
                break;
        }
    }

    /**
     * Render files
     */
    function renderFiles(files) {
        if (!files || files.length === 0) {
            showState('empty');
            return;
        }

        filesGridEl.innerHTML = '';
        files.forEach(file => {
            const card = createFileCard(file);
            filesGridEl.appendChild(card);
        });

        fileCountEl.textContent = `${files.length} file${files.length !== 1 ? 's' : ''} available`;
        showState('files');
    }

    /**
     * Fetch and render files
     */
    async function loadFiles() {
        showState('loading');

        try {
            // Add cache-busting query param
            const response = await fetch(`files.json?_=${Date.now()}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const files = await response.json();
            renderFiles(files);
        } catch (err) {
            console.error('Failed to load files:', err);
            errorMessageEl.textContent = `Failed to load files: ${err.message}`;
            showState('error');
        }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', loadFiles);
})();
