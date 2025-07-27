const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:jlRAynWKXmxOgJrobzLFrUuznwADCDWa@centerbeam.proxy.rlwy.net:20575/railway'
});

async function exportData() {
  try {
    console.log('🔍 Fetching table structure and data from Railway...');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    let exportSQL = '-- Railway Database Export\n-- Generated: ' + new Date().toISOString() + '\n\n';
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`📄 Exporting table: ${tableName}`);
      
      // Get table schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      // Create table statement
      exportSQL += `-- Table: ${tableName}\n`;
      exportSQL += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
      exportSQL += `CREATE TABLE ${tableName} (\n`;
      
      const columns = schemaResult.rows.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        return def;
      });
      
      exportSQL += columns.join(',\n') + '\n);\n\n';
      
      // Get data
      const dataResult = await pool.query(`SELECT * FROM ${tableName}`);
      
      if (dataResult.rows.length > 0) {
        const columnNames = schemaResult.rows.map(col => col.column_name);
        exportSQL += `-- Data for table: ${tableName}\n`;
        
        for (const row of dataResult.rows) {
          const values = columnNames.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          });
          
          exportSQL += `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        exportSQL += '\n';
      }
    }
    
    // Write to file
    fs.writeFileSync('railway_export.sql', exportSQL);
    console.log('✅ Export completed! Saved to railway_export.sql');
    
    // Show summary
    console.log('\n📊 Export Summary:');
    for (const table of tablesResult.rows) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`  - ${table.table_name}: ${count.rows[0].count} rows`);
    }
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
  } finally {
    await pool.end();
  }
}

exportData();