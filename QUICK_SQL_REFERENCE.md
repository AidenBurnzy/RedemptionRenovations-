# Quick SQL Reference

## Apply Complete Schema to Your Neon Database

Run this command with your Neon connection string:

```bash
psql "postgresql://your_connection_string" -f db/schema.sql
```

Or copy the entire `db/schema.sql` file contents into the Neon SQL Editor.

## Essential SQL Commands

### View All Projects
```sql
SELECT id, title, type, location, completed_date 
FROM projects 
ORDER BY created_at DESC;
```

### View All Blog Posts
```sql
SELECT id, title, author, published, published_at, created_at 
FROM blog_posts 
ORDER BY created_at DESC;
```

### Count Projects by Type
```sql
SELECT type, COUNT(*) as count 
FROM projects 
GROUP BY type 
ORDER BY count DESC;
```

### Count Published vs Draft Posts
```sql
SELECT 
    SUM(CASE WHEN published THEN 1 ELSE 0 END) as published_posts,
    SUM(CASE WHEN NOT published THEN 1 ELSE 0 END) as draft_posts
FROM blog_posts;
```

### Add a Project Manually (if needed)
```sql
INSERT INTO projects (title, type, location, completed_date, description, images)
VALUES (
    'My First Project',
    'Kitchen',
    'Grand Rapids, MI',
    'November 2024',
    'A beautiful kitchen renovation project.',
    ARRAY['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
);
```

### Add a Blog Post Manually (if needed)
```sql
INSERT INTO blog_posts (title, content, excerpt, author, featured_image, tags, published, published_at)
VALUES (
    'Welcome to Our Blog',
    'This is the full content of the blog post. You can write multiple paragraphs here.',
    'A brief summary for the blog feed.',
    'Redemption Renovations',
    'https://example.com/featured.jpg',
    ARRAY['announcement', 'news'],
    true,
    NOW()
);
```

### Update a Project
```sql
UPDATE projects 
SET title = 'Updated Title', 
    description = 'Updated description'
WHERE id = 1;
```

### Publish a Draft Blog Post
```sql
UPDATE blog_posts 
SET published = true, 
    published_at = NOW()
WHERE id = 1;
```

### Delete a Project
```sql
DELETE FROM projects WHERE id = 1;
```

### Delete a Blog Post
```sql
DELETE FROM blog_posts WHERE id = 1;
```

### Clear All Projects (careful!)
```sql
TRUNCATE TABLE projects RESTART IDENTITY CASCADE;
```

### Clear All Blog Posts (careful!)
```sql
TRUNCATE TABLE blog_posts RESTART IDENTITY CASCADE;
```

## Verify Schema Exists

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'blog_posts');

-- Check projects table structure
\d projects

-- Check blog_posts table structure
\d blog_posts
```

## Sample Data Queries

### Get Recent Projects (last 5)
```sql
SELECT * FROM projects 
ORDER BY created_at DESC 
LIMIT 5;
```

### Get Published Blog Posts (last 10)
```sql
SELECT * FROM blog_posts 
WHERE published = true 
ORDER BY published_at DESC 
LIMIT 10;
```

### Search Projects by Keyword
```sql
SELECT * FROM projects 
WHERE title ILIKE '%kitchen%' 
   OR description ILIKE '%kitchen%';
```

### Search Blog Posts by Tag
```sql
SELECT * FROM blog_posts 
WHERE 'kitchen' = ANY(tags);
```

## Connection Strings

### Local Development (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Neon Production (from Neon Console)
```
DATABASE_URL=postgresql://user:password@ep-xxxxx.region.neon.tech/dbname?sslmode=require
```

## Troubleshooting

### Connection Test
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### List All Tables
```sql
\dt
```

### Check Table Row Counts
```sql
SELECT 
    'projects' as table_name, COUNT(*) as rows FROM projects
UNION ALL
SELECT 
    'blog_posts' as table_name, COUNT(*) as rows FROM blog_posts;
```
