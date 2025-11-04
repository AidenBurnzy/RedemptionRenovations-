# Database Setup Guide

## Overview
This guide explains how to set up your Neon PostgreSQL database for Redemption Renovations, including both the Projects Gallery and Blog system.

## Database Schema

The database includes two main tables:
1. **projects** - Stores renovation project information for the gallery
2. **blog_posts** - Stores blog posts for the blog feed

## Step-by-Step Setup

### 1. Create Your Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project or use an existing one
3. Copy your connection string (it looks like: `postgresql://user:password@ep-xxxxx.region.neon.tech/dbname?sslmode=require`)

### 2. Update Your Environment Variables

Add your database connection string to `.env`:

```env
DATABASE_URL=postgresql://your_connection_string_here
ADMIN_EMAILS=Test@gmail.com
ADMIN_PASSWORDS=Test
JWT_SECRET=your_jwt_secret_here
```

### 3. Run the Schema SQL

You have two options to apply the schema:

#### Option A: Using psql Command Line

```bash
psql $DATABASE_URL -f db/schema.sql
```

#### Option B: Using Neon SQL Editor

1. Open your Neon project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `db/schema.sql`
4. Click "Run" to execute

### 4. Verify the Setup

Run this SQL query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- `projects`
- `blog_posts`

## SQL Commands for Manual Setup

If you prefer to run commands manually, here are the essential SQL statements:

### Create Projects Table

```sql
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

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
```

### Create Blog Posts Table

```sql
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

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_created_at ON blog_posts(created_at DESC);
```

### Create Update Triggers

```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for blog_posts
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## How the System Works

### Projects Gallery Flow

1. **Admin Panel** → Add/Edit/Delete projects via `admin.html`
2. **Database** → Data stored in `projects` table
3. **API** → Netlify Function `/.netlify/functions/projects` handles CRUD
4. **Gallery Page** → `projectsGallery.html` fetches and displays projects from database only (no sample data)

### Blog Feed Flow

1. **Admin Panel** → Switch to "Blog Posts" tab in admin
2. **Create/Edit Posts** → Add blog posts with title, content, images, tags
3. **Publish Control** → Toggle published status (only published posts visible to public)
4. **Database** → Data stored in `blog_posts` table
5. **API** → Netlify Function `/.netlify/functions/blog` handles CRUD
6. **Blog Page** → `blog.html` fetches and displays published posts

## Admin Panel Features

### Projects Management
- Add new renovation projects
- Upload project images (drag-and-drop or URLs)
- Categorize by type (Kitchen, Bathroom, Addition, etc.)
- Edit existing projects
- Delete projects
- Search projects

### Blog Management
- Create blog posts with rich content
- Add featured images and additional images
- Set author and tags
- Save as draft or publish immediately
- Edit existing posts
- Delete posts
- Search blog posts
- View published status

## API Endpoints

### Projects API (`/netlify/functions/projects`)
- `GET /` - Fetch all projects (public)
- `POST /` - Create new project (admin only)
- `PUT /:id` - Update project (admin only)
- `DELETE /:id` - Delete project (admin only)

### Blog API (`/netlify/functions/blog`)
- `GET /` - Fetch published posts (public) or all posts (admin)
- `POST /` - Create new blog post (admin only)
- `PUT /:id` - Update blog post (admin only)
- `DELETE /:id` - Delete blog post (admin only)

## Testing the Setup

1. Start the development server:
   ```bash
   npx netlify dev
   ```

2. Login to admin panel:
   - Navigate to `http://localhost:8888/admin.html`
   - Login with your credentials

3. Test Projects:
   - Add a new project with images
   - View it on the gallery page
   - Edit and delete to test full CRUD

4. Test Blog:
   - Click "Blog Posts" tab
   - Add a new blog post
   - Toggle published status
   - View on blog page (only if published)

## Troubleshooting

### Database Connection Errors
- Verify your `DATABASE_URL` is correct
- Check that your Neon project is active
- Ensure SSL is enabled in the connection string

### No Projects/Posts Showing
- Check that you've run the schema SQL
- Verify data exists: `SELECT * FROM projects;`
- Check browser console for API errors

### Authentication Issues
- Verify `ADMIN_EMAILS` and `ADMIN_PASSWORDS` match your login
- Check `JWT_SECRET` is set in environment variables
- Clear browser localStorage and try again

## Production Deployment

When deploying to Netlify:

1. Go to your Netlify site settings
2. Navigate to "Environment variables"
3. Add all variables:
   - `DATABASE_URL`
   - `ADMIN_EMAILS`
   - `ADMIN_PASSWORDS`
   - `JWT_SECRET`
4. Deploy your site
5. Test all functionality in production

## Security Notes

- Never commit `.env` file to git
- Use strong passwords for admin access
- Keep your `JWT_SECRET` secure and unique
- Neon database uses SSL by default
- Admin API endpoints require authentication

## Support

For issues or questions:
- Check Neon Console for database logs
- Review Netlify Functions logs for API errors
- Use browser DevTools Network tab to inspect API calls
