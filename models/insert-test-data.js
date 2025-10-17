const { executeQuery } = require('../config/database');

const insertTestData = async () => {
    try {
        console.log('🌱 Inserting test optimization data...');

        // Sample ASINs with realistic product data
        const testProducts = [
            {
                asin: 'B08N5WRWNW',
                title: 'Echo Dot (4th Gen) | Smart speaker with Alexa | Charcoal',
                bulletPoints: '• Meet the all-new Echo Dot - Our most popular smart speaker with Alexa\n• Voice control your entertainment - Stream songs from Amazon Music\n• Make life easier - Set timers, ask questions, play music',
                description: 'Introducing Echo Dot - Our most compact smart speaker that fits perfectly into small spaces.',
                imageUrl: 'https://m.media-amazon.com/images/I/614YRaKSixL._AC_SX425_.jpg',
                price: '$49.99',
                availability: 'In Stock',
                rating: 4.7,
                reviewCount: 89543
            },
            {
                asin: 'B0BSFQVDWZ',
                title: 'Apple AirPods Pro (2nd Generation) Wireless Ear Buds with USB-C Charging',
                bulletPoints: '• Richer audio experience with Personalized Spatial Audio\n• Next-level Active Noise Cancellation\n• Adaptive Transparency lets you hear the world around you',
                description: 'AirPods Pro (2nd generation) with USB-C deliver up to 2x more Active Noise Cancellation.',
                imageUrl: 'https://m.media-amazon.com/images/I/61f1YfTkTDL._AC_SX425_.jpg',
                price: '$249.00',
                availability: 'In Stock',
                rating: 4.4,
                reviewCount: 12876
            },
            {
                asin: 'B09G9FPHY6',
                title: 'Amazon Fire TV Stick 4K Max streaming device, Wi-Fi 6E',
                bulletPoints: '• 40% more powerful than Fire TV Stick 4K\n• Supports Wi-Fi 6E for smoother streaming\n• Watch in vibrant 4K Ultra HD with Dolby Vision',
                description: 'Fire TV Stick 4K Max delivers a fast, fluid streaming experience with Wi-Fi 6E support.',
                imageUrl: 'https://m.media-amazon.com/images/I/51TjJOTfslL._AC_SX425_.jpg',
                price: '$54.99',
                availability: 'In Stock',
                rating: 4.5,
                reviewCount: 45231
            }
        ];

        // Insert products first
        for (const product of testProducts) {
            await executeQuery(`
                INSERT INTO products (asin, title, bullet_points, description, image_url, price, availability, rating, review_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                bullet_points = VALUES(bullet_points),
                description = VALUES(description),
                image_url = VALUES(image_url),
                price = VALUES(price),
                availability = VALUES(availability),
                rating = VALUES(rating),
                review_count = VALUES(review_count),
                updated_at = CURRENT_TIMESTAMP
            `, [
                product.asin,
                product.title,
                product.bulletPoints,
                product.description,
                product.imageUrl,
                product.price,
                product.availability,
                product.rating,
                product.reviewCount
            ]);
            
            console.log(`✅ Inserted/Updated product: ${product.asin}`);
        }

        // Get product IDs for optimizations
        const productIds = {};
        for (const product of testProducts) {
            const result = await executeQuery('SELECT id FROM products WHERE asin = ?', [product.asin]);
            productIds[product.asin] = result[0].id;
        }

        // Sample optimizations with realistic AI improvements
        const testOptimizations = [
            {
                asin: 'B08N5WRWNW',
                optimizedTitle: 'Echo Dot 4th Gen Smart Speaker with Alexa - Voice Control Music & Smart Home - Charcoal',
                optimizedBulletPoints: '• NEW Echo Dot 4th Generation - Amazon\'s #1 smart speaker with improved sound quality and Alexa voice assistant\n• VOICE CONTROL ENTERTAINMENT - Stream music from Amazon Music, Apple Music, Spotify, Pandora and more with just your voice\n• SMART HOME HUB - Control compatible lights, plugs, thermostats and more with simple voice commands\n• IMPROVED SOUND - Enhanced speakers deliver crisp vocals and deeper bass for room-filling audio\n• PRIVACY FEATURES - Built-in privacy controls and microphone off button for peace of mind',
                optimizedDescription: 'Transform your home with the all-new Echo Dot (4th Gen) - Amazon\'s most popular smart speaker featuring enhanced audio, powerful Alexa voice assistant, and seamless smart home integration. This compact powerhouse delivers crisp vocals and rich bass while connecting you to your favorite music, news, weather, and more. Set timers, ask questions, control smart devices, and enjoy hands-free convenience in any room. With improved sound quality and sleek design, Echo Dot fits perfectly anywhere in your home.',
                suggestedKeywords: ['smart speaker', 'alexa device', 'voice control', 'smart home', 'amazon echo'],
                score: 85
            },
            {
                asin: 'B0BSFQVDWZ',
                optimizedTitle: 'Apple AirPods Pro 2nd Gen with USB-C - Active Noise Cancelling Wireless Earbuds + Spatial Audio',
                optimizedBulletPoints: '• NEXT-LEVEL NOISE CANCELLATION - Up to 2X more Active Noise Cancellation blocks external sounds for immersive listening\n• PERSONALIZED SPATIAL AUDIO - Experience theater-like sound with dynamic head tracking for music, movies, and calls\n• ALL-DAY BATTERY LIFE - Up to 6 hours listening time, up to 30 hours with MagSafe charging case\n• ADAPTIVE TRANSPARENCY - Stay aware of surroundings while enjoying your music with intelligent sound filtering\n• PREMIUM COMFORT - Multiple ear tip sizes ensure secure, comfortable fit for all-day wear\n• USB-C CHARGING - Fast charging with modern USB-C connector and wireless MagSafe compatibility',
                optimizedDescription: 'Experience audio like never before with Apple AirPods Pro (2nd Generation). Featuring groundbreaking Active Noise Cancellation that\'s up to 2x more powerful, these premium wireless earbuds deliver unmatched sound quality and comfort. Personalized Spatial Audio with dynamic head tracking creates an immersive, theater-like experience for music and movies. The Adaptive Transparency mode lets you stay connected to your environment while enjoying crystal-clear audio. With all-day battery life and convenient USB-C charging, AirPods Pro redefine wireless audio excellence.',
                suggestedKeywords: ['wireless earbuds', 'noise cancelling', 'spatial audio', 'apple airpods', 'bluetooth headphones'],
                score: 92
            },
            {
                asin: 'B09G9FPHY6',
                optimizedTitle: 'Fire TV Stick 4K Max - Fastest Streaming Device with Wi-Fi 6E, Dolby Vision & Alexa Voice Remote',
                optimizedBulletPoints: '• FASTEST FIRE TV STICK - 40% more powerful processor delivers lightning-fast app loading and smooth navigation\n• Wi-Fi 6E TECHNOLOGY - Next-gen wireless standard ensures buffer-free streaming even with multiple devices connected\n• 4K ULTRA HD + DOLBY VISION - Stunning picture quality with vibrant colors and enhanced contrast on compatible TVs\n• ALEXA VOICE REMOTE - Find content across apps, control smart home devices, and navigate hands-free with voice commands\n• ENDLESS ENTERTAINMENT - Access Netflix, Prime Video, Disney+, HBO Max, and 1.5 million movies and TV episodes\n• GAMING READY - Cloud gaming support for Xbox Game Pass and Luna with responsive controls',
                optimizedDescription: 'Upgrade your TV experience with the Fire TV Stick 4K Max - Amazon\'s most powerful streaming device. With 40% more processing power and cutting-edge Wi-Fi 6E support, enjoy seamless 4K streaming with zero buffering. Watch your favorite content in stunning 4K Ultra HD with Dolby Vision HDR for cinema-quality picture. The included Alexa Voice Remote lets you search across apps, control smart home devices, and navigate effortlessly with voice commands. Access over 1.5 million movies and TV episodes from popular streaming services, plus enjoy cloud gaming capabilities.',
                suggestedKeywords: ['4k streaming device', 'fire tv stick', 'wi-fi 6e', 'dolby vision', 'alexa remote'],
                score: 88
            }
        ];

        // Insert optimizations
        for (const opt of testOptimizations) {
            const productId = productIds[opt.asin];
            
            const result = await executeQuery(`
                INSERT INTO optimizations (
                    product_id, asin, optimized_title, optimized_bullet_points, 
                    optimized_description, suggested_keywords, optimization_score, 
                    gemini_model, optimization_metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                productId,
                opt.asin,
                opt.optimizedTitle,
                opt.optimizedBulletPoints,
                opt.optimizedDescription,
                JSON.stringify(opt.suggestedKeywords),
                opt.score,
                'gemini-2.0-flash-exp',
                JSON.stringify({
                    optimizationTime: Math.floor(Math.random() * 5000) + 3000, // 3-8 seconds
                    modelUsed: 'gemini-2.0-flash-exp',
                    requestCount: 4,
                    timestamp: new Date().toISOString()
                })
            ]);

            console.log(`✅ Inserted optimization for ${opt.asin} with score ${opt.score}`);

            // Add history entry
            await executeQuery(`
                INSERT INTO optimization_history (asin, optimization_id, action_type)
                VALUES (?, ?, 'created')
            `, [opt.asin, result.insertId]);

            // Add keywords to tracking
            for (const keyword of opt.suggestedKeywords) {
                await executeQuery(`
                    INSERT INTO keyword_tracking (asin, keyword, source, relevance_score)
                    VALUES (?, ?, 'suggested', ?)
                    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
                `, [opt.asin, keyword, Math.floor(Math.random() * 30) + 70]); // Score 70-100
            }
        }

        // Add some historical optimizations with different dates
        const historicalDates = [
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
            new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
        ];

        for (let i = 0; i < historicalDates.length; i++) {
            const date = historicalDates[i];
            const asin = testProducts[i % testProducts.length].asin;
            const score = Math.floor(Math.random() * 40) + 60; // Score 60-100
            
            const result = await executeQuery(`
                INSERT INTO optimizations (
                    product_id, asin, optimized_title, optimized_bullet_points, 
                    optimized_description, suggested_keywords, optimization_score, 
                    gemini_model, optimization_metadata, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                productIds[asin],
                asin,
                `Historical optimization ${i + 1} for ${asin}`,
                '• Historical bullet point 1\n• Historical bullet point 2',
                `Historical description for optimization ${i + 1}`,
                JSON.stringify(['historical', 'keyword', 'test']),
                score,
                'gemini-2.0-flash-exp',
                JSON.stringify({
                    optimizationTime: Math.floor(Math.random() * 3000) + 2000,
                    modelUsed: 'gemini-2.0-flash-exp',
                    requestCount: 4,
                    timestamp: date.toISOString()
                }),
                date
            ]);

            await executeQuery(`
                INSERT INTO optimization_history (asin, optimization_id, action_type, created_at)
                VALUES (?, ?, 'created', ?)
            `, [asin, result.insertId, date]);
        }

        console.log('🎉 Test data insertion completed successfully!');
        console.log('📊 Data Summary:');
        console.log(`   • ${testProducts.length} products added`);
        console.log(`   • ${testOptimizations.length + historicalDates.length} optimizations added`);
        console.log(`   • ${testOptimizations.reduce((sum, opt) => sum + opt.suggestedKeywords.length, 0)} keywords added`);
        console.log('');
        console.log('🌐 You can now test the application with real data!');
        console.log('   • Frontend: http://localhost:3000');
        console.log('   • Backend: http://localhost:3001');
        console.log('   • Health: http://localhost:3001/health');
        
    } catch (error) {
        console.error('❌ Error inserting test data:', error.message);
        throw error;
    }
};

// Run if this file is executed directly
if (require.main === module) {
    insertTestData()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Failed to insert test data:', error);
            process.exit(1);
        });
}

module.exports = { insertTestData };