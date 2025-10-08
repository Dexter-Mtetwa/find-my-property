// Migration script to add listing_type column
import { supabase } from './lib/supabase';

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Add listing_type column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE properties 
        ADD COLUMN IF NOT EXISTS listing_type VARCHAR(10) DEFAULT 'rent' CHECK (listing_type IN ('rent', 'buy'));
      `
    });
    
    if (alterError) {
      console.log('Column might already exist, continuing...');
    }
    
    // Update existing properties
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE properties 
        SET listing_type = CASE 
          WHEN price < 5000 THEN 'rent'
          ELSE 'buy'
        END
        WHERE listing_type IS NULL;
      `
    });
    
    if (updateError) {
      console.error('Update error:', updateError);
      return;
    }
    
    // Make column NOT NULL
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE properties 
        ALTER COLUMN listing_type SET NOT NULL;
      `
    });
    
    if (notNullError) {
      console.error('NOT NULL error:', notNullError);
      return;
    }
    
    // Add index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
      `
    });
    
    if (indexError) {
      console.error('Index error:', indexError);
      return;
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration();
