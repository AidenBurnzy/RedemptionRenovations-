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
    const gridSection = document.querySelector('.blog-grid-section .section-inner');
    
    if (!gridSection) {
        console.error('Blog grid section not found');
        return;
    }
    
    // Show loading state
    gridSection.innerHTML = '<div class="loading-spinner">Loading blog posts...</div>';
    
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
            gridSection.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem 1rem;">
                    <p style="color: #4c5c62; max-width: 600px; margin: 0 auto;">
                        No blog posts available yet. Check back soon for project updates, 
                        construction tips, and news from Redemption Renovations.
                    </p>
                </div>
            `;
            return;
        }
        
        renderBlogPosts(publishedPosts, gridSection);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        gridSection.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 3rem 1rem;">
                <p style="color: #d32f2f; max-width: 600px; margin: 0 auto;">
                    Unable to load blog posts. Please try again later.
                </p>
            </div>
        `;
    }
}

function renderBlogPosts(posts, container) {
    // Create blog grid
    const grid = document.createElement('div');
    grid.className = 'blog-grid';
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
        padding: 2rem 0;
    `;
    
    posts.forEach(post => {
        const card = createBlogCard(post);
        grid.appendChild(card);
    });
    
    container.innerHTML = '';
    container.appendChild(grid);
}

function createBlogCard(post) {
    const card = document.createElement('article');
    card.className = 'blog-card';
    card.style.cssText = `
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
        display: flex;
        flex-direction: column;
    `;
    
    // Featured image
    if (post.featured_image) {
        const img = document.createElement('img');
        img.src = post.featured_image;
        img.alt = post.title;
        img.style.cssText = `
            width: 100%;
            height: 200px;
            object-fit: cover;
            object-position: center;
        `;
        card.appendChild(img);
    }
    
    // Content container
    const content = document.createElement('div');
    content.style.cssText = 'padding: 1.5rem; flex-grow: 1; display: flex; flex-direction: column;';
    
    // Tags
    if (post.tags && post.tags.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;';
        
        post.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.textContent = tag;
            tagSpan.style.cssText = `
                font-size: 0.75rem;
                padding: 0.25rem 0.75rem;
                background: #e0f2f4;
                color: #1d8a9b;
                border-radius: 12px;
                font-weight: 500;
            `;
            tagsDiv.appendChild(tagSpan);
        });
        
        content.appendChild(tagsDiv);
    }
    
    // Title
    const title = document.createElement('h3');
    title.textContent = post.title;
    title.style.cssText = `
        font-size: 1.5rem;
        margin: 0 0 0.75rem 0;
        color: #1d1d1d;
        font-weight: 600;
    `;
    content.appendChild(title);
    
    // Excerpt
    const excerpt = document.createElement('p');
    excerpt.textContent = post.excerpt || post.content.substring(0, 150) + '...';
    excerpt.style.cssText = `
        color: #4c5c62;
        line-height: 1.6;
        margin: 0 0 1rem 0;
        flex-grow: 1;
    `;
    content.appendChild(excerpt);
    
    // Meta info
    const meta = document.createElement('div');
    meta.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid #e5e5e5;
        font-size: 0.875rem;
        color: #6b7280;
    `;
    
    const author = document.createElement('span');
    author.textContent = post.author || 'Redemption Renovations';
    meta.appendChild(author);
    
    const date = document.createElement('span');
    if (post.published_at) {
        const publishedDate = new Date(post.published_at);
        date.textContent = publishedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    meta.appendChild(date);
    
    content.appendChild(meta);
    card.appendChild(content);
    
    // Hover effects
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
    
    // Click to expand (future feature - for now just log)
    card.addEventListener('click', () => {
        console.log('Blog post clicked:', post.id);
        // TODO: Open modal or navigate to full post
    });
    
    return card;
}
