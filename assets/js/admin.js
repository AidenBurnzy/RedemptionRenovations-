// Admin Panel JavaScript
// Handles authentication, project CRUD operations, and API communication

// Configuration
const API_BASE = '/.netlify/functions';
const AUTH_TOKEN_KEY = 'rr_admin_token';

// State
let currentProjects = [];
let editingProjectId = null;
let deletingProjectId = null;

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}

function initAdmin() {
    console.log('Admin panel initializing...');
    
    // Check if already authenticated
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        verifyToken(token);
    }
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Add project button
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', openAddProjectModal);
    }
    
    // Project form
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmit);
    }
    
    // Search
    const searchInput = document.getElementById('searchProjects');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Tab buttons
    const projectsTab = document.getElementById('projectsTab');
    const blogTab = document.getElementById('blogTab');
    if (projectsTab) {
        projectsTab.addEventListener('click', () => switchTab('projects'));
    }
    if (blogTab) {
        blogTab.addEventListener('click', () => switchTab('blog'));
    }
    
    // Blog post buttons
    const addBlogPostBtn = document.getElementById('addBlogPostBtn');
    if (addBlogPostBtn) {
        addBlogPostBtn.addEventListener('click', openAddBlogPostModal);
    }
    
    const blogPostForm = document.getElementById('blogPostForm');
    if (blogPostForm) {
        blogPostForm.addEventListener('submit', handleBlogPostSubmit);
    }
    
    const searchBlogInput = document.getElementById('searchBlogPosts');
    if (searchBlogInput) {
        searchBlogInput.addEventListener('input', handleBlogSearch);
    }
    
    // Setup drag and drop for images
    setupImageUpload();

    attachModalOverlayClose('projectModal', closeProjectModal);
    attachModalOverlayClose('deleteModal', closeDeleteModal);
    attachModalOverlayClose('blogPostModal', closeBlogPostModal);
    attachModalOverlayClose('deleteBlogModal', closeDeleteBlogModal);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }

    modal.style.display = 'flex';
    modal.dataset.open = 'true';
    document.body.classList.add('modal-open');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }

    modal.style.display = 'none';
    delete modal.dataset.open;

    if (!document.querySelector('.modal[data-open="true"]')) {
        document.body.classList.remove('modal-open');
    }
}

function attachModalOverlayClose(modalId, closeHandler) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }

    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeHandler);
    }
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    
    errorEl.style.display = 'none';
    
    try {
        // For now, use simple authentication
        // In production, this should call your Netlify function
        const response = await fetch(`${API_BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        
        const data = await response.json();
        
        // Store token
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        
        // Show dashboard
        showDashboard();
        
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = 'Invalid email or password. Please try again.';
        errorEl.style.display = 'block';
        
        // Fallback for development (remove in production)
        if (email === 'admin@example.com' && password === 'admin') {
            const devToken = 'dev_token_' + Date.now();
            localStorage.setItem(AUTH_TOKEN_KEY, devToken);
            showDashboard();
        }
    }
}

async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE}/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showDashboard();
        } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
        }
    } catch (error) {
        console.error('Token verification error:', error);
        // In development, show dashboard anyway
        showDashboard();
    }
}

function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadProjects();
}

// Project CRUD Functions
async function loadProjects() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '<div class="loading-spinner">Loading projects...</div>';
    
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(`${API_BASE}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load projects');
        }
        
        const data = await response.json();
        // API returns array directly
        currentProjects = Array.isArray(data) ? data : [];
        renderProjects(currentProjects);
        
    } catch (error) {
        console.error('Error loading projects:', error);
        
        // Fallback to local sample data for development
        currentProjects = getSampleProjects();
        renderProjects(currentProjects);
    }
}

function renderProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="loading-spinner">
                <p>No projects yet. Click "Add New Project" to get started.</p>
            </div>
        `;
        return;
    }
    
    projectsList.innerHTML = projects.map(project => `
        <div class="project-item" data-id="${project.id}">
            <div class="project-images-section">
                <div class="cover-photo-section">
                    <label class="image-section-label">Cover Photo:</label>
                    ${project.images && project.images.length > 0 ? 
                        `<img src="${project.images[0]}" alt="${project.title}" class="cover-photo-thumb">` :
                        '<div class="no-image">No Cover Photo</div>'
                    }
                </div>
                ${project.images && project.images.length > 1 ? `
                    <div class="gallery-photos-section">
                        <label class="image-section-label">Gallery (${project.images.length - 1} images):</label>
                        <div class="gallery-thumbs">
                            ${project.images.slice(1, 4).map(img => `
                                <img src="${img}" alt="Gallery image" class="gallery-thumb">
                            `).join('')}
                            ${project.images.length > 4 ? `<div class="more-images">+${project.images.length - 4}</div>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="project-info">
                <h3>${project.title}</h3>
                <div class="project-meta">
                    ${project.tags && project.tags.length > 0 ? 
                        project.tags.map(tag => `<span class="project-type-badge">${tag}</span>`).join('') :
                        `<span class="project-type-badge">${project.type}</span>`
                    }
                    <span class="project-meta-item">📍 ${project.location}</span>
                    <span class="project-meta-item">📅 ${project.completedDate}</span>
                    <span class="project-meta-item">🖼️ ${project.images.length} total images</span>
                </div>
                <p class="project-description">${project.description}</p>
            </div>
            <div class="project-actions">
                <button class="btn btn-sm btn-outline" onclick="editProject(${project.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteProject(${project.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        renderProjects(currentProjects);
        return;
    }
    
    const filtered = currentProjects.filter(project => 
        project.title.toLowerCase().includes(searchTerm) ||
        project.type.toLowerCase().includes(searchTerm) ||
        project.location.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm)
    );
    
    renderProjects(filtered);
}

// Modal Functions
function openAddProjectModal() {
    editingProjectId = null;
    document.getElementById('modalTitle').textContent = 'Add New Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    clearImagePreviews();
    clearProjectCoverImage();
    // Clear all checkboxes
    document.querySelectorAll('input[name="projectTypes"]').forEach(cb => cb.checked = false);
    showModal('projectModal');
}

function editProject(id) {
    const project = currentProjects.find(p => p.id === id);
    if (!project) return;
    
    editingProjectId = id;
    clearImagePreviews();
    clearProjectCoverImage();
    
    document.getElementById('modalTitle').textContent = 'Edit Project';
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectTitle').value = project.title;
    document.getElementById('projectLocation').value = project.location;
    document.getElementById('projectDate').value = project.completedDate;
    document.getElementById('projectDescription').value = project.description;
    
    // Set checkbox values
    const projectTypes = project.tags && project.tags.length > 0 ? project.tags : [project.type];
    const checkboxes = document.querySelectorAll('input[name="projectTypes"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = projectTypes.includes(checkbox.value);
    });
    
    // Load cover image (first image)
    if (project.images && project.images.length > 0) {
        projectCoverImage = {
            name: 'existing-cover',
            data: project.images[0]
        };
        showProjectCoverPreview(projectCoverImage);
        
        // Load remaining images as gallery
        const galleryImages = project.images.slice(1);
        document.getElementById('projectImages').value = galleryImages.join('\n');
        
        galleryImages.forEach((url, index) => {
            const imageData = {
                name: `Image ${index + 1}`,
                data: url,
                file: null // Existing image from URL
            };
            uploadedImages.push(imageData);
            addImagePreview(imageData);
        });
    }
    
    showModal('projectModal');
}

function closeProjectModal() {
    hideModal('projectModal');
    document.getElementById('projectForm').reset();
    editingProjectId = null;
    clearImagePreviews();
    clearProjectCoverImage();
}

async function handleProjectSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Get cover image (from file upload or URL input)
    let coverImageUrl = projectCoverImage ? projectCoverImage.data : '';
    if (!coverImageUrl) {
        const coverUrlInput = document.getElementById('projectCoverUrl');
        coverImageUrl = coverUrlInput.value.trim();
    }
    
    // Get gallery images
    const galleryImages = formData.get('images').split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    
    // Combine: cover image first, then gallery images
    const allImages = coverImageUrl ? [coverImageUrl, ...galleryImages] : galleryImages;
    
    if (allImages.length === 0) {
        alert('Please add at least a cover photo for the project.');
        return;
    }
    
    // Get selected types from checkboxes
    const checkedBoxes = document.querySelectorAll('input[name="projectTypes"]:checked');
    const selectedTypes = Array.from(checkedBoxes).map(checkbox => checkbox.value);
    
    if (selectedTypes.length === 0) {
        alert('Please select at least one project category.');
        return;
    }
    
    const projectData = {
        id: formData.get('id') || Date.now(),
        title: formData.get('title'),
        type: selectedTypes[0], // Primary type is the first selected
        location: formData.get('location'),
        completedDate: formData.get('completedDate'),
        description: formData.get('description'),
        images: allImages,
        tags: selectedTypes // All selected types stored as tags
    };
    
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const url = editingProjectId 
            ? `${API_BASE}/projects/${editingProjectId}`
            : `${API_BASE}/projects`;
        
        const method = editingProjectId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save project');
        }
        
        closeProjectModal();
        loadProjects();
        
    } catch (error) {
        console.error('Error saving project:', error);
        
        // Fallback for development
        if (editingProjectId) {
            const index = currentProjects.findIndex(p => p.id == editingProjectId);
            if (index !== -1) {
                currentProjects[index] = projectData;
            }
        } else {
            currentProjects.push(projectData);
        }
        
        closeProjectModal();
        renderProjects(currentProjects);
        
        // Update local storage for development
        localStorage.setItem('rr_projects', JSON.stringify(currentProjects));
    }
}

// Delete Functions
function confirmDeleteProject(id) {
    const project = currentProjects.find(p => p.id === id);
    if (!project) return;
    
    deletingProjectId = id;
    document.getElementById('deleteProjectName').textContent = project.title;
    showModal('deleteModal');
    
    // Setup confirm button
    document.getElementById('confirmDeleteBtn').onclick = () => deleteProject(id);
}

function closeDeleteModal() {
    hideModal('deleteModal');
    deletingProjectId = null;
}

async function deleteProject(id) {
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete project');
        }
        
        closeDeleteModal();
        loadProjects();
        
    } catch (error) {
        console.error('Error deleting project:', error);
        
        // Fallback for development
        currentProjects = currentProjects.filter(p => p.id !== id);
        closeDeleteModal();
        renderProjects(currentProjects);
        
        // Update local storage for development
        localStorage.setItem('rr_projects', JSON.stringify(currentProjects));
    }
}

// Helper Functions
function getSampleProjects() {
    // Try to load from localStorage first
    const stored = localStorage.getItem('rr_projects');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored projects:', e);
        }
    }
    
    // Return sample data
    return [
        {
            id: 1,
            title: "Modern Kitchen Renovation",
            type: "Kitchen",
            location: "Grand Rapids, MI",
            completedDate: "October 2024",
            description: "Complete kitchen transformation featuring custom cabinetry, quartz countertops, and premium stainless steel appliances. We opened up the space by removing a wall, creating an open-concept design that flows seamlessly into the dining area.",
            images: [
                "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&q=80",
                "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=80",
                "https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1200&q=80"
            ]
        }
    ];
}

// Image Upload and Drag-and-Drop Functions
let uploadedImages = [];

// Project Cover Image Management
let projectCoverImage = null;

function setupProjectCoverUpload() {
    const coverDropZone = document.getElementById('coverDropZone');
    const coverFileInput = document.getElementById('coverFileInput');
    const toggleCoverUrl = document.getElementById('toggleCoverUrlInput');
    const coverUrlInput = document.getElementById('projectCoverUrl');
    
    if (coverDropZone && coverFileInput) {
        coverDropZone.addEventListener('click', () => coverFileInput.click());
        coverFileInput.addEventListener('change', (e) => handleProjectCoverFile(e.target.files[0]));
        
        coverDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            coverDropZone.classList.add('drag-over');
        });
        coverDropZone.addEventListener('dragleave', () => {
            coverDropZone.classList.remove('drag-over');
        });
        coverDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            coverDropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleProjectCoverFile(e.dataTransfer.files[0]);
            }
        });
        
        if (toggleCoverUrl) {
            toggleCoverUrl.addEventListener('click', () => {
                const isVisible = coverUrlInput.style.display !== 'none';
                coverUrlInput.style.display = isVisible ? 'none' : 'block';
                toggleCoverUrl.textContent = isVisible ? '+ Or enter URL manually' : '- Hide URL input';
            });
        }
    }
}

function handleProjectCoverFile(file) {
    if (!file) return;
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} is not a supported image format. Please use JPG, PNG, or WEBP.`);
        return;
    }
    
    if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        projectCoverImage = {
            name: file.name,
            data: e.target.result
        };
        showProjectCoverPreview(projectCoverImage);
    };
    reader.readAsDataURL(file);
}

function showProjectCoverPreview(imageData) {
    const previewContainer = document.getElementById('coverPreview');
    previewContainer.className = 'featured-image-preview has-image';
    
    previewContainer.innerHTML = `
        <div class="featured-preview-item">
            <img src="${imageData.data}" alt="${imageData.name}">
            <button type="button" class="remove-image" onclick="removeProjectCoverImage()">&times;</button>
        </div>
    `;
}

function removeProjectCoverImage() {
    projectCoverImage = null;
    const previewContainer = document.getElementById('coverPreview');
    previewContainer.className = 'featured-image-preview';
    previewContainer.innerHTML = '';
}

function clearProjectCoverImage() {
    projectCoverImage = null;
    const previewContainer = document.getElementById('coverPreview');
    if (previewContainer) {
        previewContainer.className = 'featured-image-preview';
        previewContainer.innerHTML = '';
    }
}

function setupImageUpload() {
    // Setup project cover upload first
    setupProjectCoverUpload();
    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('imageFileInput');
    const toggleUrlInput = document.getElementById('toggleUrlInput');
    const projectImagesTextarea = document.getElementById('projectImages');
    const urlInputHint = document.getElementById('urlInputHint');
    
    if (!dropZone || !fileInput) return;
    
    // Click to browse
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });
    
    // Toggle URL input
    if (toggleUrlInput) {
        toggleUrlInput.addEventListener('click', () => {
            const isVisible = projectImagesTextarea.style.display !== 'none';
            projectImagesTextarea.style.display = isVisible ? 'none' : 'block';
            urlInputHint.style.display = isVisible ? 'none' : 'block';
            toggleUrlInput.textContent = isVisible ? '+ Or enter image URLs manually' : '- Hide URL input';
        });
    }
    
    // Setup blog image uploads
    setupBlogImageUpload();
}

// Blog Image Upload Setup
let blogFeaturedImage = null;
let blogGalleryImages = [];

function setupBlogImageUpload() {
    // Featured Image Setup
    const featuredDropZone = document.getElementById('blogFeaturedDropZone');
    const featuredFileInput = document.getElementById('blogFeaturedFileInput');
    const toggleFeaturedUrl = document.getElementById('toggleFeaturedUrlInput');
    const featuredUrlInput = document.getElementById('blogFeaturedImage');
    
    if (featuredDropZone && featuredFileInput) {
        featuredDropZone.addEventListener('click', () => featuredFileInput.click());
        featuredFileInput.addEventListener('change', (e) => handleBlogFeaturedFile(e.target.files[0]));
        
        featuredDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            featuredDropZone.classList.add('drag-over');
        });
        featuredDropZone.addEventListener('dragleave', () => {
            featuredDropZone.classList.remove('drag-over');
        });
        featuredDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            featuredDropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleBlogFeaturedFile(e.dataTransfer.files[0]);
            }
        });
        
        if (toggleFeaturedUrl) {
            toggleFeaturedUrl.addEventListener('click', () => {
                const isVisible = featuredUrlInput.style.display !== 'none';
                featuredUrlInput.style.display = isVisible ? 'none' : 'block';
                toggleFeaturedUrl.textContent = isVisible ? '+ Or enter URL manually' : '- Hide URL input';
            });
        }
    }
    
    // Gallery Images Setup
    const galleryDropZone = document.getElementById('blogGalleryDropZone');
    const galleryFileInput = document.getElementById('blogGalleryFileInput');
    const toggleGalleryUrl = document.getElementById('toggleGalleryUrlInput');
    const galleryUrlInput = document.getElementById('blogImages');
    
    if (galleryDropZone && galleryFileInput) {
        galleryDropZone.addEventListener('click', () => galleryFileInput.click());
        galleryFileInput.addEventListener('change', (e) => handleBlogGalleryFiles(e.target.files));
        
        galleryDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            galleryDropZone.classList.add('drag-over');
        });
        galleryDropZone.addEventListener('dragleave', () => {
            galleryDropZone.classList.remove('drag-over');
        });
        galleryDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            galleryDropZone.classList.remove('drag-over');
            handleBlogGalleryFiles(e.dataTransfer.files);
        });
        
        if (toggleGalleryUrl) {
            toggleGalleryUrl.addEventListener('click', () => {
                const isVisible = galleryUrlInput.style.display !== 'none';
                galleryUrlInput.style.display = isVisible ? 'none' : 'block';
                toggleGalleryUrl.textContent = isVisible ? '+ Or enter URLs manually' : '- Hide URL input';
            });
        }
    }
}

function handleBlogFeaturedFile(file) {
    if (!file) return;
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        alert(`${file.name} is not a supported image format. Please use JPG, PNG, or WEBP.`);
        return;
    }
    
    if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        blogFeaturedImage = {
            name: file.name,
            data: e.target.result
        };
        showBlogFeaturedPreview(blogFeaturedImage);
        updateBlogFeaturedInput();
    };
    reader.readAsDataURL(file);
}

function showBlogFeaturedPreview(imageData) {
    const previewContainer = document.getElementById('blogFeaturedPreview');
    previewContainer.className = 'featured-image-preview has-image';
    
    previewContainer.innerHTML = `
        <div class="featured-preview-item">
            <img src="${imageData.data}" alt="${imageData.name}">
            <button type="button" class="remove-image" onclick="removeBlogFeaturedImage()">&times;</button>
        </div>
    `;
}

function removeBlogFeaturedImage() {
    blogFeaturedImage = null;
    const previewContainer = document.getElementById('blogFeaturedPreview');
    previewContainer.className = 'featured-image-preview';
    previewContainer.innerHTML = '';
    updateBlogFeaturedInput();
}

function updateBlogFeaturedInput() {
    const input = document.getElementById('blogFeaturedImage');
    input.value = blogFeaturedImage ? blogFeaturedImage.data : '';
}

function handleBlogGalleryFiles(files) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    Array.from(files).forEach(file => {
        if (!allowedTypes.includes(file.type)) {
            alert(`${file.name} is not a supported image format. Please use JPG, PNG, or WEBP.`);
            return;
        }
        
        if (file.size > maxSize) {
            alert(`${file.name} is too large. Maximum file size is 5MB.`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                name: file.name,
                data: e.target.result
            };
            blogGalleryImages.push(imageData);
            addBlogGalleryPreview(imageData);
            updateBlogGalleryInput();
        };
        reader.readAsDataURL(file);
    });
}

function addBlogGalleryPreview(imageData) {
    const previewList = document.getElementById('blogGalleryPreviewList');
    
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.dataset.imageName = imageData.name;
    
    const img = document.createElement('img');
    img.src = imageData.data;
    img.alt = imageData.name;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-image';
    removeBtn.type = 'button';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeBlogGalleryImage(imageData.name);
    };
    
    const badge = document.createElement('div');
    badge.className = 'image-url-badge';
    badge.textContent = imageData.name;
    
    previewItem.appendChild(img);
    previewItem.appendChild(removeBtn);
    previewItem.appendChild(badge);
    previewList.appendChild(previewItem);
}

function removeBlogGalleryImage(imageName) {
    blogGalleryImages = blogGalleryImages.filter(img => img.name !== imageName);
    
    const previewItem = document.querySelector('#blogGalleryPreviewList [data-image-name="' + imageName + '"]');
    if (previewItem) {
        previewItem.remove();
    }
    
    updateBlogGalleryInput();
}

function updateBlogGalleryInput() {
    const textarea = document.getElementById('blogImages');
    const imageUrls = blogGalleryImages.map(img => img.data);
    textarea.value = imageUrls.join('\n');
}

function clearBlogImagePreviews() {
    blogFeaturedImage = null;
    blogGalleryImages = [];
    
    const featuredPreview = document.getElementById('blogFeaturedPreview');
    if (featuredPreview) {
        featuredPreview.className = 'featured-image-preview';
        featuredPreview.innerHTML = '';
    }
    
    const galleryPreview = document.getElementById('blogGalleryPreviewList');
    if (galleryPreview) {
        galleryPreview.innerHTML = '';
    }
}

function handleFiles(files) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    Array.from(files).forEach(file => {
        // Validate file
        if (!allowedTypes.includes(file.type)) {
            alert(`${file.name} is not a supported image format. Please use JPG, PNG, or WEBP.`);
            return;
        }
        
        if (file.size > maxSize) {
            alert(`${file.name} is too large. Maximum file size is 5MB.`);
            return;
        }
        
        // Read file and create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                name: file.name,
                data: e.target.result,
                file: file
            };
            uploadedImages.push(imageData);
            addImagePreview(imageData);
            updateProjectImagesInput();
        };
        reader.readAsDataURL(file);
    });
}

function addImagePreview(imageData) {
    const previewList = document.getElementById('imagePreviewList');
    
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.dataset.imageName = imageData.name;
    
    const img = document.createElement('img');
    img.src = imageData.data;
    img.alt = imageData.name;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-image';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeImage(imageData.name);
    };
    
    const badge = document.createElement('div');
    badge.className = 'image-url-badge';
    badge.textContent = imageData.name;
    
    previewItem.appendChild(img);
    previewItem.appendChild(removeBtn);
    previewItem.appendChild(badge);
    previewList.appendChild(previewItem);
}

function removeImage(imageName) {
    uploadedImages = uploadedImages.filter(img => img.name !== imageName);
    
    const previewItem = document.querySelector(`[data-image-name="${imageName}"]`);
    if (previewItem) {
        previewItem.remove();
    }
    
    updateProjectImagesInput();
}

function updateProjectImagesInput() {
    const projectImagesTextarea = document.getElementById('projectImages');
    
    // Convert image data URLs to textarea (for form submission)
    const imageUrls = uploadedImages.map(img => img.data);
    projectImagesTextarea.value = imageUrls.join('\n');
}

function clearImagePreviews() {
    uploadedImages = [];
    const previewList = document.getElementById('imagePreviewList');
    if (previewList) {
        previewList.innerHTML = '';
    }
}

// ============================================
// BLOG POST MANAGEMENT
// ============================================

let currentBlogPosts = [];
let editingBlogPostId = null;
let deletingBlogPostId = null;

function switchTab(tab) {
    const projectsTab = document.getElementById('projectsTab');
    const blogTab = document.getElementById('blogTab');
    const projectsSection = document.getElementById('projectsSection');
    const blogSection = document.getElementById('blogSection');
    const dashboardTitle = document.getElementById('dashboardTitle');
    
    if (tab === 'projects') {
        projectsTab.classList.add('active');
        blogTab.classList.remove('active');
        projectsSection.style.display = 'block';
        blogSection.style.display = 'none';
        dashboardTitle.textContent = 'Project Management';
    } else {
        projectsTab.classList.remove('active');
        blogTab.classList.add('active');
        projectsSection.style.display = 'none';
        blogSection.style.display = 'block';
        dashboardTitle.textContent = 'Blog Management';
        loadBlogPosts();
    }
}

async function loadBlogPosts() {
    const listEl = document.getElementById('blogPostsList');
    listEl.innerHTML = '<div class="loading-spinner">Loading blog posts...</div>';
    
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(`${API_BASE}/blog`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load blog posts');
        
        currentBlogPosts = await response.json();
        renderBlogPosts();
    } catch (error) {
        console.error('Error loading blog posts:', error);
        listEl.innerHTML = '<div class="error-message">Failed to load blog posts. Please try again.</div>';
    }
}

function renderBlogPosts(posts = currentBlogPosts) {
    const listEl = document.getElementById('blogPostsList');
    
    if (posts.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No blog posts yet. Create your first post!</div>';
        return;
    }
    
    const html = posts.map(post => `
        <div class="project-item">
            <div class="project-images-section">
                <div class="cover-photo-section">
                    <label class="image-section-label">Cover Photo:</label>
                    ${post.featured_image ? 
                        `<img src="${post.featured_image}" alt="${post.title}" class="cover-photo-thumb">` :
                        '<div class="no-image">No Cover Photo</div>'
                    }
                </div>
                ${post.images && post.images.length > 0 ? `
                    <div class="gallery-photos-section">
                        <label class="image-section-label">Gallery (${post.images.length} images):</label>
                        <div class="gallery-thumbs">
                            ${post.images.slice(0, 3).map(img => `
                                <img src="${img}" alt="Gallery image" class="gallery-thumb">
                            `).join('')}
                            ${post.images.length > 3 ? `<div class="more-images">+${post.images.length - 3}</div>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="project-info">
                <h3>${post.title}</h3>
                <p class="project-meta">
                    ${post.published ? 
                        `<span class="post-status published">Published</span>` :
                        `<span class="post-status draft">Draft</span>`
                    }
                    <span>By ${post.author}</span>
                    ${post.published_at ? 
                        `<span>Published: ${new Date(post.published_at).toLocaleDateString()}</span>` :
                        `<span>Created: ${new Date(post.created_at).toLocaleDateString()}</span>`
                    }
                </p>
                <p class="project-description">${post.excerpt || post.content.substring(0, 150) + '...'}</p>
                ${post.tags && post.tags.length > 0 ? 
                    `<p class="project-tags">Tags: ${post.tags.join(', ')}</p>` : ''
                }
            </div>
            <div class="project-actions">
                <button class="btn btn-outline" onclick="editBlogPost(${post.id})">Edit</button>
                <button class="btn btn-danger" onclick="confirmDeleteBlogPost(${post.id})">Delete</button>
            </div>
        </div>
    `).join('');
    
    listEl.innerHTML = html;
}

function openAddBlogPostModal() {
    editingBlogPostId = null;
    document.getElementById('blogModalTitle').textContent = 'Add New Blog Post';
    document.getElementById('blogPostForm').reset();
    document.getElementById('blogPostId').value = '';
    clearBlogImagePreviews();
    showModal('blogPostModal');
}

function editBlogPost(id) {
    const post = currentBlogPosts.find(p => p.id === id);
    if (!post) return;
    
    editingBlogPostId = id;
    clearBlogImagePreviews();
    
    document.getElementById('blogModalTitle').textContent = 'Edit Blog Post';
    document.getElementById('blogPostId').value = post.id;
    document.getElementById('blogTitle').value = post.title;
    document.getElementById('blogExcerpt').value = post.excerpt || '';
    document.getElementById('blogContent').value = post.content;
    document.getElementById('blogAuthor').value = post.author;
    document.getElementById('blogFeaturedImage').value = post.featured_image || '';
    document.getElementById('blogImages').value = post.images ? post.images.join('\n') : '';
    document.getElementById('blogTags').value = post.tags ? post.tags.join(', ') : '';
    document.getElementById('blogPublished').checked = post.published;
    
    // Load existing featured image preview
    if (post.featured_image) {
        blogFeaturedImage = {
            name: 'existing-featured',
            data: post.featured_image
        };
        showBlogFeaturedPreview(blogFeaturedImage);
    }
    
    // Load existing gallery images previews
    if (post.images && post.images.length > 0) {
        post.images.forEach((url, index) => {
            const imageData = {
                name: `existing-${index}`,
                data: url
            };
            blogGalleryImages.push(imageData);
            addBlogGalleryPreview(imageData);
        });
    }
    
    showModal('blogPostModal');
}

function closeBlogPostModal() {
    hideModal('blogPostModal');
    editingBlogPostId = null;
    clearBlogImagePreviews();
}

async function handleBlogPostSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const images = formData.get('images') ? formData.get('images').split('\n').map(url => url.trim()).filter(url => url) : [];
    const tags = formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const postData = {
        title: formData.get('title'),
        content: formData.get('content'),
        excerpt: formData.get('excerpt') || null,
        author: formData.get('author') || 'Redemption Renovations',
        featured_image: formData.get('featured_image') || null,
        images: images,
        tags: tags,
        published: document.getElementById('blogPublished').checked
    };
    
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const isEditing = editingBlogPostId !== null;
        const url = isEditing ? `${API_BASE}/blog/${editingBlogPostId}` : `${API_BASE}/blog`;
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });
        
        if (!response.ok) throw new Error('Failed to save blog post');
        
        closeBlogPostModal();
        loadBlogPosts();
    } catch (error) {
        console.error('Error saving blog post:', error);
        alert('Failed to save blog post. Please try again.');
    }
}

function confirmDeleteBlogPost(id) {
    const post = currentBlogPosts.find(p => p.id === id);
    if (!post) return;
    
    deletingBlogPostId = id;
    document.getElementById('deleteBlogPostName').textContent = post.title;
    showModal('deleteBlogModal');
    
    const confirmBtn = document.getElementById('confirmDeleteBlogBtn');
    confirmBtn.onclick = () => deleteBlogPost(id);
}

function closeDeleteBlogModal() {
    hideModal('deleteBlogModal');
    deletingBlogPostId = null;
}

async function deleteBlogPost(id) {
    try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(`${API_BASE}/blog/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete blog post');
        
        closeDeleteBlogModal();
        loadBlogPosts();
    } catch (error) {
        console.error('Error deleting blog post:', error);
        alert('Failed to delete blog post. Please try again.');
    }
}

function handleBlogSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        renderBlogPosts();
        return;
    }
    
    const filtered = currentBlogPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
    
    renderBlogPosts(filtered);
}

// Make functions globally available
window.editProject = editProject;
window.confirmDeleteProject = confirmDeleteProject;
window.closeProjectModal = closeProjectModal;
window.closeDeleteModal = closeDeleteModal;
window.editBlogPost = editBlogPost;
window.confirmDeleteBlogPost = confirmDeleteBlogPost;
window.closeBlogPostModal = closeBlogPostModal;
window.closeDeleteBlogModal = closeDeleteBlogModal;
window.removeBlogFeaturedImage = removeBlogFeaturedImage;
window.removeProjectCoverImage = removeProjectCoverImage;

console.log('Admin panel loaded');
