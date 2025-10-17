const { executeQuery } = require('../config/database');

const createDatabase = async () => {
    try {
        console.log('🔧 Setting up database schema...');
        
        // Create products table for storing original Amazon product data
        const createProductsTable = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asin VARCHAR(20) UNIQUE NOT NULL,
                title TEXT NOT NULL,
                bullet_points TEXT,
                description TEXT,
                image_url VARCHAR(500),
                price VARCHAR(50),
                availability VARCHAR(100),
                rating DECIMAL(3,2),
                review_count INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_asin (asin),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        // Create optimizations table for storing AI-generated improvements
        const createOptimizationsTable = `
            CREATE TABLE IF NOT EXISTS optimizations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                asin VARCHAR(20) NOT NULL,
                optimized_title TEXT NOT NULL,
                optimized_bullet_points TEXT,
                optimized_description TEXT,
                suggested_keywords JSON,
                optimization_score DECIMAL(5,2),
                gemini_model VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp',
                optimization_metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                INDEX idx_asin (asin),
                INDEX idx_product_id (product_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        // Create optimization_history table for tracking changes over time
        const createHistoryTable = `
            CREATE TABLE IF NOT EXISTS optimization_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asin VARCHAR(20) NOT NULL,
                optimization_id INT NOT NULL,
                action_type ENUM('created', 'updated', 'viewed') DEFAULT 'created',
                user_feedback JSON,
                performance_metrics JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (optimization_id) REFERENCES optimizations(id) ON DELETE CASCADE,
                INDEX idx_asin (asin),
                INDEX idx_optimization_id (optimization_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        // Create keyword_tracking table for monitoring keyword performance
        const createKeywordTable = `
            CREATE TABLE IF NOT EXISTS keyword_tracking (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asin VARCHAR(20) NOT NULL,
                keyword VARCHAR(255) NOT NULL,
                source ENUM('original', 'suggested', 'manual') DEFAULT 'suggested',
                search_volume INT,
                competition_level ENUM('low', 'medium', 'high'),
                relevance_score DECIMAL(5,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_asin (asin),
                INDEX idx_keyword (keyword),
                INDEX idx_source (source),
                UNIQUE KEY unique_asin_keyword (asin, keyword)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        // Execute table creation
        await executeQuery(createProductsTable);
        console.log('✅ Products table created/verified');
        
        await executeQuery(createOptimizationsTable);
        console.log('✅ Optimizations table created/verified');
        
        await executeQuery(createHistoryTable);
        console.log('✅ Optimization history table created/verified');
        
        await executeQuery(createKeywordTable);
        console.log('✅ Keyword tracking table created/verified');
        
        console.log('🎉 Database schema setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error setting up database schema:', error.message);
        throw error;
    }
};

const dropTables = async () => {
    try {
        console.log('🗑️ Dropping all tables...');
        
        await executeQuery('SET FOREIGN_KEY_CHECKS = 0');
        await executeQuery('DROP TABLE IF EXISTS keyword_tracking');
        await executeQuery('DROP TABLE IF EXISTS optimization_history');
        await executeQuery('DROP TABLE IF EXISTS optimizations');
        await executeQuery('DROP TABLE IF EXISTS products');
        await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('✅ All tables dropped successfully');
    } catch (error) {
        console.error('❌ Error dropping tables:', error.message);
        throw error;
    }
};

const seedTestData = async () => {
    try {
        console.log('🌱 Seeding test data...');
        
        // Insert sample product
        const sampleProduct = `
            INSERT IGNORE INTO products (asin, title, bullet_points, description, price, availability, rating, review_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const productData = [
            'B08N5WRWNW',
            'Echo Dot (4th Gen) | Smart speaker with Alexa | Charcoal',
            '• Meet the all-new Echo Dot - Our most popular smart speaker with Alexa. The sleek, compact design delivers crisp vocals and balanced bass for full sound.\n• Voice control your entertainment - Stream songs from Amazon Music, Apple Music, Spotify, SiriusXM, and others.\n• Make life easier - Set timers, ask questions, play music, and control compatible smart home devices with your voice.',
            'Introducing Echo Dot - Our most compact smart speaker that fits perfectly into small spaces. Powered by Alexa, Echo Dot delivers crisp vocals and balanced bass for full sound that fills the room.',
            '$49.99',
            'In Stock',
            4.7,
            89543
        ];
        
        await executeQuery(sampleProduct, productData);
        console.log('✅ Sample product data inserted');
        
        console.log('🎉 Test data seeded successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding test data:', error.message);
        throw error;
    }
};

module.exports = {
    createDatabase,
    dropTables,
    seedTestData
};