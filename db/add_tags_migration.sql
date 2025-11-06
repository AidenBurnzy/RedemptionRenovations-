-- Migration: Add tags column to projects table
-- This allows projects to have multiple category tags for better filtering

-- Add tags column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create index on tags for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN (tags);

-- Update existing projects to have tags based on their type
-- This ensures backward compatibility with existing data
UPDATE projects SET tags = ARRAY[type] WHERE tags IS NULL OR tags = '{}';
