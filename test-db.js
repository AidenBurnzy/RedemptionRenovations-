// Test database connection and query
import { neon } from '@neondatabase/serverless';

async function testDatabase() {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
        console.error('DATABASE_URL not set');
        return;
    }
    
    console.log('Connecting to database...');
    const sql = neon(DATABASE_URL);
    
    try {
        // Check project_gallery table structure
        const schema = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'project_gallery'
            ORDER BY ordinal_position
        `;
        
        console.log('\nproject_gallery table columns:');
        schema.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // Get all project_gallery entries for client_id = 1
        const result = await sql`
            SELECT * 
            FROM project_gallery 
            WHERE client_id = 1 
            ORDER BY created_at DESC
        `;
        
        console.log(`\nFound ${result.length} gallery projects for client_id = 1:\n`);
        result.forEach(row => {
            console.log('Gallery Project:', JSON.stringify(row, null, 2));
            console.log('');
        });
    } catch (error) {
        console.error('Database error:', error);
    }
}

testDatabase();
