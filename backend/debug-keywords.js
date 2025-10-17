const { executeQuery } = require('./config/database');

const debugKeywords = async () => {
    try {
        console.log('🔍 Debugging suggested_keywords data...');
        
        const results = await executeQuery(`
            SELECT asin, suggested_keywords 
            FROM optimizations 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.log('📊 Raw database data:');
        results.forEach((row, index) => {
            console.log(`\n--- Row ${index + 1} ---`);
            console.log(`ASIN: ${row.asin}`);
            console.log(`Raw data: ${row.suggested_keywords}`);
            console.log(`Type: ${typeof row.suggested_keywords}`);
            
            // Convert to string if needed
            const keywordsString = row.suggested_keywords ? String(row.suggested_keywords) : '';
            console.log(`String data: "${keywordsString}"`);
            
            // Try to parse
            try {
                const parsed = JSON.parse(keywordsString || '[]');
                console.log(`✅ Parsed successfully:`, parsed);
            } catch (e) {
                console.log(`❌ JSON parse error: ${e.message}`);
                console.log(`First 50 chars: "${keywordsString.substring(0, 50)}..."`);
            }
        });
        
        // Fix malformed data
        console.log('\n🔧 Fixing malformed data...');
        const updateResults = await executeQuery(`
            SELECT id, asin, suggested_keywords 
            FROM optimizations 
            WHERE suggested_keywords IS NOT NULL
        `);
        
        for (const row of updateResults) {
            console.log(`Fixing ASIN ${row.asin}...`);
            
            // Convert to string first
            const keywordsString = String(row.suggested_keywords || '');
            
            // Convert to proper JSON array
            let fixedKeywords;
            if (keywordsString.includes(',')) {
                // Comma-separated values
                const keywords = keywordsString
                    .split(',')
                    .map(k => k.trim().replace(/['"]/g, ''))
                    .filter(k => k.length > 0);
                fixedKeywords = JSON.stringify(keywords);
            } else if (keywordsString.trim().length > 0) {
                // Single value
                fixedKeywords = JSON.stringify([keywordsString.trim()]);
            } else {
                // Empty value
                fixedKeywords = JSON.stringify([]);
            }
            
            await executeQuery(
                'UPDATE optimizations SET suggested_keywords = ? WHERE id = ?',
                [fixedKeywords, row.id]
            );
            
            console.log(`✅ Fixed: "${keywordsString}" → ${fixedKeywords}`);
        }
        
        console.log('🎉 Debugging complete!');
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
    } finally {
        process.exit(0);
    }
};

debugKeywords();