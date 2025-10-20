// Filter functionality for Gallery and Blog pages
document.addEventListener('DOMContentLoaded', () => {
    // Gallery filter functionality
    const galleryFilterButtons = document.querySelectorAll('.filter-btn');
    const galleryCards = document.querySelectorAll('.gallery-card');

    if (galleryFilterButtons.length > 0 && galleryCards.length > 0) {
        galleryFilterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                
                // Update active button
                galleryFilterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter gallery cards
                galleryCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    
                    if (filter === 'all' || category === filter) {
                        card.classList.remove('hidden');
                        // Add fade-in animation
                        card.style.animation = 'fadeIn 0.5s ease';
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }

    // Blog filter functionality
    const blogFilterButtons = document.querySelectorAll('.blog-filter-btn');
    const blogCards = document.querySelectorAll('.blog-post-card');

    if (blogFilterButtons.length > 0 && blogCards.length > 0) {
        blogFilterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                
                // Update active button
                blogFilterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter blog cards
                blogCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    
                    if (filter === 'all' || category === filter) {
                        card.classList.remove('hidden');
                        // Add fade-in animation
                        card.style.animation = 'fadeIn 0.5s ease';
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }

    // Add CSS for fade-in animation if not exists
    if (!document.getElementById('filter-animations')) {
        const style = document.createElement('style');
        style.id = 'filter-animations';
        style.textContent = `
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
});