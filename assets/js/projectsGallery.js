// Projects Gallery JavaScript
// Manages project gallery display, modal interactions, and carousel functionality

// DEPRECATED: Sample data removed - all projects loaded from database
const SAMPLE_PROJECTS_DEPRECATED = [
    {
        id: 1,
        title: "Modern Kitchen Renovation",
        type: "Kitchen",
        location: "Grand Rapids, MI",
        completedDate: "October 2024",
        description: "Complete kitchen transformation featuring custom cabinetry, quartz countertops, and premium stainless steel appliances. We opened up the space by removing a wall, creating an open-concept design that flows seamlessly into the dining area. New hardwood flooring, recessed lighting, and a large island with seating complete this stunning renovation.",
        images: [
            "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&q=80",
            "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=80",
            "https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1200&q=80",
            "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&q=80"
        ]
    },
    {
        id: 2,
        title: "Luxury Master Bathroom",
        type: "Bathroom",
        location: "East Grand Rapids, MI",
        completedDate: "September 2024",
        description: "Spa-inspired master bathroom featuring a walk-in shower with frameless glass enclosure and rainfall showerhead, freestanding soaking tub, and dual vanities with marble countertops. Heated tile flooring, custom lighting, and premium fixtures create a luxurious retreat.",
        images: [
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
            "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80",
            "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=1200&q=80"
        ]
    },
    {
        id: 3,
        title: "Two-Story Home Addition",
        type: "Addition",
        location: "Spring Lake, MI",
        completedDate: "August 2024",
        description: "Expansive two-story addition adding 1,200 square feet of living space. First floor features a spacious family room with vaulted ceilings and floor-to-ceiling windows. Second floor includes a master suite with walk-in closet and luxury bathroom. Exterior seamlessly matches existing home with matching siding and architectural details.",
        images: [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
            "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200&q=80"
        ]
    },
    {
        id: 4,
        title: "Custom Built-In Library",
        type: "Carpentry",
        location: "Ada, MI",
        completedDate: "July 2024",
        description: "Floor-to-ceiling custom built-in shelving and cabinets crafted from premium white oak. Features include integrated LED lighting, a rolling library ladder with rail system, and hidden storage compartments. Crown molding and custom trim work provide elegant finishing touches.",
        images: [
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80",
            "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200&q=80",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80"
        ]
    },
    {
        id: 5,
        title: "Finished Basement Entertainment Space",
        type: "Basement",
        location: "Rockford, MI",
        completedDate: "June 2024",
        description: "Complete basement transformation featuring a home theater with tiered seating, wet bar with custom cabinetry, game area, and full bathroom. Luxury vinyl plank flooring, recessed lighting with dimmer controls, and custom millwork throughout create an inviting entertainment space.",
        images: [
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
            "https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200&q=80",
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80",
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=80"
        ]
    },
    {
        id: 6,
        title: "Outdoor Living Deck & Pergola",
        type: "Deck",
        location: "Hudsonville, MI",
        completedDate: "May 2024",
        description: "Multi-level composite deck featuring a custom pergola with retractable shade, built-in grill station with storage, and landscape lighting throughout. Low-maintenance materials ensure lasting beauty while the spacious design provides perfect outdoor entertainment space with stunning backyard views.",
        images: [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
        ]
    }
];

// State management
let currentProjects = [];
let currentProjectIndex = 0;
let currentSlideIndex = 0;
let activeFilter = 'all';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
} else {
    initGallery();
}

function initGallery() {
    console.log('Initializing gallery...');
    document.addEventListener('keydown', handleKeyboard);
    
    // Check URL parameters for filter
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam) {
        activeFilter = filterParam;
    }
    
    setupFilterButtons();
    loadProjectsFromAPI();
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Update active state based on current filter
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === activeFilter) {
            btn.classList.add('active');
        }
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active filter and re-render
            activeFilter = filter;
            renderProjects();
        });
    });
}

async function loadProjectsFromAPI() {
    const grid = document.getElementById('projectsGrid');
    
    try {
        console.log('Fetching projects from API...');
        const response = await fetch('/.netlify/functions/projects');
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to load projects from database');
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        // API returns array directly, not wrapped in projects property
        currentProjects = Array.isArray(data) ? data : (data.projects || []);
        
        console.log('Current projects loaded:', currentProjects.length);
        
        // Hide loading state by clearing the grid
        grid.innerHTML = '';
        
        if (currentProjects.length === 0) {
            // Show empty state message with helpful instructions
            grid.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 4rem 2rem;">
                    <h2 style="color: #333; margin-bottom: 1rem;">No Projects Yet</h2>
                    <p style="color: #666; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
                        Projects will appear here once they're added through the admin panel. 
                        ${window.location.hostname === 'localhost' ? 'Make sure your database is configured first.' : ''}
                    </p>
                    <a href="https://auctus-app.vercel.app/client-login" target="_blank" rel="noopener" style="display: inline-block; padding: 0.75rem 2rem; background: #1d8a9b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        Go to Admin Panel
                    </a>
                </div>
            `;
        } else {
            renderProjects();
        }
    } catch (error) {
        console.error('Error loading projects from API:', error);
        
        // Show error message with helpful information
        grid.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 4rem 2rem;">
                <h2 style="color: #dc3545; margin-bottom: 1rem;">Unable to Load Projects</h2>
                <p style="color: #666; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
                    There was an error connecting to the database. 
                    ${window.location.hostname === 'localhost' ? 'Please check that your DATABASE_URL is configured in the .env file.' : 'Please try again later or contact support.'}
                </p>
                <button onclick="location.reload()" style="padding: 0.75rem 2rem; background: #1d8a9b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
}

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) {
        console.error('Projects grid not found');
        return;
    }
    
    grid.innerHTML = '';
    
    if (currentProjects.length === 0) {
        grid.innerHTML = '<div class="loading-state"><p>No projects available yet.</p></div>';
        return;
    }
    
    // Filter projects based on active filter
    let filteredProjects = currentProjects;
    if (activeFilter !== 'all') {
        filteredProjects = currentProjects.filter(project => {
            // Check if project.type matches the filter
            // Also check if project has tags array that includes the filter
            return project.type === activeFilter || 
                   (project.tags && Array.isArray(project.tags) && project.tags.includes(activeFilter));
        });
    }
    
    if (filteredProjects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 4rem 2rem; grid-column: 1 / -1;">
                <h2 style="color: #333; margin-bottom: 1rem;">No ${activeFilter} Projects</h2>
                <p style="color: #666;">Try selecting a different category to view more projects.</p>
            </div>
        `;
        return;
    }
    
    filteredProjects.forEach((project, index) => {
        // Find the original index in currentProjects array for modal navigation
        const originalIndex = currentProjects.findIndex(p => p.id === project.id);
        const card = createProjectCard(project, originalIndex);
        grid.appendChild(card);
    });
    
    console.log('Rendered ' + filteredProjects.length + ' of ' + currentProjects.length + ' projects (filter: ' + activeFilter + ')');
}

function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.onclick = function() { openProjectModal(index); };
    
    const mainImage = project.images[0] || 'https://via.placeholder.com/400x300?text=No+Image';
    
    card.innerHTML = '<div class="project-card-image">' +
        '<img src="' + mainImage + '" alt="' + project.title + '" loading="lazy">' +
        '</div>' +
        '<div class="project-card-body">' +
        '<h3 class="project-card-title">' + project.title + '</h3>' +
        '<span class="project-card-type">' + project.type + '</span>' +
        '<div class="project-card-meta">' +
        '<span class="project-card-images-count">' +
        '📸 ' + project.images.length + ' ' + (project.images.length === 1 ? 'image' : 'images') +
        '</span>' +
        '</div>' +
        '</div>';
    
    return card;
}

function openProjectModal(projectIndex) {
    currentProjectIndex = projectIndex;
    currentSlideIndex = 0;
    
    const project = currentProjects[projectIndex];
    const modal = document.getElementById('projectModal');
    
    if (!modal || !project) {
        console.error('Modal or project not found');
        return;
    }
    
    document.getElementById('modalTitle').textContent = project.title;
    
    const metaHTML = '<div class="modal-meta-item">' +
        '<span class="modal-meta-label">Type</span>' +
        '<span class="modal-meta-value">' + project.type + '</span>' +
        '</div>' +
        '<div class="modal-meta-item">' +
        '<span class="modal-meta-label">Location</span>' +
        '<span class="modal-meta-value">' + project.location + '</span>' +
        '</div>' +
        '<div class="modal-meta-item">' +
        '<span class="modal-meta-label">Completed</span>' +
        '<span class="modal-meta-value">' + project.completedDate + '</span>' +
        '</div>';
    document.getElementById('modalMeta').innerHTML = metaHTML;
    
    document.getElementById('modalDescription').innerHTML = '<p>' + project.description + '</p>';
    
    setupCarousel(project.images);
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('Opened project: ' + project.title);
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function setupCarousel(images) {
    const track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots');
    
    if (!track || !dots) return;
    
    track.innerHTML = '';
    dots.innerHTML = '';
    
    images.forEach(function(imageSrc, index) {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = '<img src="' + imageSrc + '" alt="Project image ' + (index + 1) + '">';
        track.appendChild(slide);
        
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        if (index === 0) dot.classList.add('active');
        dot.onclick = function() { goToSlide(index); };
        dot.setAttribute('aria-label', 'Go to image ' + (index + 1));
        dots.appendChild(dot);
    });
    
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!track) return;
    
    track.style.transform = 'translateX(-' + (currentSlideIndex * 100) + '%)';
    
    dots.forEach(function(dot, index) {
        if (index === currentSlideIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function previousSlide() {
    const project = currentProjects[currentProjectIndex];
    if (!project) return;
    
    currentSlideIndex = (currentSlideIndex - 1 + project.images.length) % project.images.length;
    updateCarousel();
}

function nextSlide() {
    const project = currentProjects[currentProjectIndex];
    if (!project) return;
    
    currentSlideIndex = (currentSlideIndex + 1) % project.images.length;
    updateCarousel();
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateCarousel();
}

function handleKeyboard(e) {
    const modal = document.getElementById('projectModal');
    if (!modal || modal.style.display === 'none') return;
    
    if (e.key === 'Escape') {
        closeProjectModal();
    } else if (e.key === 'ArrowLeft') {
        previousSlide();
    } else if (e.key === 'ArrowRight') {
        nextSlide();
    }
}

window.GalleryAPI = {
    getAllProjects: function() { return currentProjects; },
    addProject: function(project) {
        project.id = Date.now();
        currentProjects.push(project);
        renderProjects();
        return project;
    },
    updateProject: function(id, updates) {
        const index = currentProjects.findIndex(function(p) { return p.id === id; });
        if (index !== -1) {
            currentProjects[index] = Object.assign({}, currentProjects[index], updates);
            renderProjects();
            return currentProjects[index];
        }
        return null;
    },
    deleteProject: function(id) {
        const index = currentProjects.findIndex(function(p) { return p.id === id; });
        if (index !== -1) {
            currentProjects.splice(index, 1);
            renderProjects();
            return true;
        }
        return false;
    },
    refreshGallery: function() {
        renderProjects();
    }
};

console.log('Projects Gallery loaded. API available at window.GalleryAPI');
