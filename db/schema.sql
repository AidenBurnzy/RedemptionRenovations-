-- Neon PostgreSQL Schema for Redemption Renovations
-- Complete database schema for projects gallery and blog posts

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    completed_date VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    images TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ============================================
-- BLOG POSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author VARCHAR(100) DEFAULT 'Redemption Renovations',
    featured_image TEXT,
    images TEXT[],
    tags TEXT[],
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_created_at ON blog_posts(created_at DESC);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO projects (title, type, location, completed_date, description, images) VALUES
('Modern Kitchen Renovation', 'Kitchen', 'Grand Rapids, MI', 'October 2024', 
 'Complete kitchen transformation featuring custom cabinetry, quartz countertops, and premium stainless steel appliances.',
 ARRAY['https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1200&q=80','https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1200&q=80','https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1200&q=80']),
('Luxury Master Bathroom', 'Bathroom', 'East Grand Rapids, MI', 'September 2024',
 'Spa-inspired master bathroom featuring a walk-in shower with frameless glass enclosure.',
 ARRAY['https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80','https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80'])
ON CONFLICT DO NOTHING;

INSERT INTO blog_posts (title, content, excerpt, author, featured_image, tags, published, published_at) VALUES
('Welcome to Our New Blog', 
 'We are excited to launch our new blog where we will share renovation tips, project updates, and industry insights.',
 'Introducing our new blog with renovation tips and project updates.',
 'Redemption Renovations',
 'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=1200&q=80',
 ARRAY['announcement', 'company'], true, CURRENT_TIMESTAMP),
('Top 5 Kitchen Renovation Trends for 2024',
 'This year has brought exciting new trends in kitchen design. 1. Smart Kitchen Technology, 2. Sustainable Materials, 3. Bold Color Choices, 4. Open Shelving, 5. Multi-functional Islands.',
 'Discover the hottest kitchen renovation trends of 2024.',
 'Redemption Renovations',
 'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=1200&q=80',
 ARRAY['kitchen', 'trends', 'design'], true, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
