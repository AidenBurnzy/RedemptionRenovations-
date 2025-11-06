// Blog Page JavaScript
// Fetches and displays published blog posts

const API_BASE = '/.netlify/functions';

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
} else {
    initBlog();
}

async function initBlog() {
    console.log('Blog page initializing...');
    await loadBlogPosts();
}

async function loadBlogPosts() {
    const feedContainer = document.getElementById('blogFeed');
    
    if (!feedContainer) {
        console.error('Blog feed container not found');
        return;
    }
    
    // Show loading state
    feedContainer.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/blog`);
        
        if (!response.ok) {
            throw new Error('Failed to load blog posts');
        }
        
        const posts = await response.json();
        
        // Filter only published posts (API should do this, but double-check)
        const publishedPosts = Array.isArray(posts) 
            ? posts.filter(post => post.published) 
            : [];
        
        if (publishedPosts.length === 0) {
            feedContainer.innerHTML = `
                <div class="empty-state">
                    <h2>No posts yet</h2>
                    <p>Check back soon for project updates, construction tips, and news from Redemption Renovations.</p>
                </div>
            `;
            return;
        }
        
        renderBlogFeed(publishedPosts, feedContainer);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        feedContainer.innerHTML = `
            <div class="empty-state">
                <h2>Unable to load posts</h2>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

function renderBlogFeed(posts, container) {
    container.innerHTML = '';
    
    posts.forEach(post => {
        const card = createFacebookStylePost(post);
        container.appendChild(card);
    });
}

function createFacebookStylePost(post) {
    const card = document.createElement('article');
    card.className = 'blog-post-card';
    
    // Post Header (Avatar + Author + Date)
    const header = document.createElement('div');
    header.className = 'post-header';
    
    const avatar = document.createElement('div');
    avatar.className = 'post-avatar';
    avatar.textContent = 'RR'; // Redemption Renovations initials
    
    const meta = document.createElement('div');
    meta.className = 'post-meta';
    
    const author = document.createElement('span');
    author.className = 'post-author';
    author.textContent = post.author || 'Redemption Renovations';
    
    const date = document.createElement('div');
    date.className = 'post-date';
    if (post.published_at) {
        const publishedDate = new Date(post.published_at);
        date.textContent = formatRelativeDate(publishedDate);
    }
    
    meta.appendChild(author);
    meta.appendChild(date);
    header.appendChild(avatar);
    header.appendChild(meta);
    card.appendChild(header);
    
    // Post Content
    const content = document.createElement('div');
    content.className = 'post-content';
    
    // Title
    const title = document.createElement('h2');
    title.className = 'post-title';
    title.textContent = post.title;
    content.appendChild(title);
    
    // Text Content
    const text = document.createElement('p');
    text.className = 'post-text';
    text.textContent = post.content;
    content.appendChild(text);
    
    card.appendChild(content);
    
    // Featured Image (if exists)
    if (post.featured_image) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'post-featured-image';
        
        const img = document.createElement('img');
        img.src = post.featured_image;
        img.alt = post.title;
        img.loading = 'lazy';
        
        imageContainer.appendChild(img);
        card.appendChild(imageContainer);
    }
    
    // Tags
    if (post.tags && post.tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'post-tags';
        
        post.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'post-tag';
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });
        
        card.appendChild(tagsContainer);
    }
    
    return card;
}

function formatRelativeDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}
