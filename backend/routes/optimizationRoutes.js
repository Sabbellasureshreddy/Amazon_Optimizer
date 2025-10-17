const express = require('express');
const router = express.Router();
const GeminiOptimizer = require('../services/geminiOptimizer');
const { executeQuery } = require('../config/database');

const optimizer = new GeminiOptimizer();

/**
 * POST /api/optimize/:asin - Optimize product listing by ASIN
 */
router.post('/:asin', async (req, res) => {
    try {
        const { asin } = req.params;
        
        console.log(`🚀 Starting optimization for ASIN: ${asin}`);

        // Get product data from database
        const productResult = await executeQuery(
            'SELECT * FROM products WHERE asin = ? ORDER BY updated_at DESC LIMIT 1',
            [asin]
        );

        if (productResult.length === 0) {
            return res.status(404).json({
                error: 'Product not found',
                message: 'Please fetch the product data first before optimizing'
            });
        }

        const product = productResult[0];
        const productData = {
            asin: product.asin,
            title: product.title,
            bulletPoints: product.bullet_points,
            description: product.description,
            category: product.category,
            brand: product.brand
        };

        // Check for recent optimization (within 1 hour)
        const recentOptimization = await executeQuery(
            'SELECT * FROM optimizations WHERE asin = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) ORDER BY created_at DESC LIMIT 1',
            [asin]
        );

        if (recentOptimization.length > 0) {
            console.log(`📋 Returning recent optimization for ${asin}`);
            const opt = recentOptimization[0];
            
            // Parse suggested keywords safely
            let suggestedKeywords = [];
            try {
                const keywordsString = opt.suggested_keywords ? String(opt.suggested_keywords) : '[]';
                suggestedKeywords = JSON.parse(keywordsString);
            } catch (e) {
                console.warn(`JSON parse error for suggested_keywords: ${opt.suggested_keywords}`);
                // Fallback parsing for malformed JSON
                const keywordsString = opt.suggested_keywords ? String(opt.suggested_keywords) : '';
                if (keywordsString) {
                    if (keywordsString.startsWith('[') && keywordsString.endsWith(']')) {
                        try {
                            suggestedKeywords = JSON.parse(keywordsString);
                        } catch (e2) {
                            suggestedKeywords = keywordsString
                                .slice(1, -1)
                                .split(',')
                                .map(k => k.trim().replace(/['"]/g, ''))
                                .filter(k => k.length > 0);
                        }
                    } else if (keywordsString.includes(',')) {
                        suggestedKeywords = keywordsString.split(',').map(k => k.trim()).filter(k => k.length > 0);
                    } else if (keywordsString.trim()) {
                        suggestedKeywords = [keywordsString.trim()];
                    }
                }
            }

            return res.json({
                asin: opt.asin,
                original: {
                    title: product.title,
                    bulletPoints: product.bullet_points,
                    description: product.description
                },
                optimized: {
                    title: opt.optimized_title,
                    bulletPoints: opt.optimized_bullet_points,
                    description: opt.optimized_description,
                    suggestedKeywords: suggestedKeywords
                },
                optimizationScore: opt.optimization_score,
                createdAt: opt.created_at,
                source: 'cached'
            });
        }

        // Perform AI optimization
        const optimizationResult = await optimizer.optimizeProduct(productData);
        
        // Calculate optimization score
        const scoreResult = optimizer.calculateOptimizationScore(
            optimizationResult.original,
            optimizationResult.optimized
        );

        // Store optimization in database
        const insertOptimization = `
            INSERT INTO optimizations (
                product_id, asin, optimized_title, optimized_bullet_points, 
                optimized_description, suggested_keywords, optimization_score, 
                gemini_model, optimization_metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const optimizationId = await executeQuery(insertOptimization, [
            product.id,
            asin,
            optimizationResult.optimized.title,
            optimizationResult.optimized.bulletPoints,
            optimizationResult.optimized.description,
            JSON.stringify(optimizationResult.optimized.suggestedKeywords),
            scoreResult.score,
            optimizationResult.metadata.modelUsed,
            JSON.stringify(optimizationResult.metadata)
        ]);

        // Log optimization history
        await executeQuery(
            'INSERT INTO optimization_history (asin, optimization_id, action_type) VALUES (?, ?, ?)',
            [asin, optimizationId.insertId, 'created']
        );

        // Store suggested keywords
        for (const keyword of optimizationResult.optimized.suggestedKeywords) {
            await executeQuery(
                'INSERT INTO keyword_tracking (asin, keyword, source) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP',
                [asin, keyword, 'suggested']
            );
        }

        console.log(`✅ Optimization completed and stored for ${asin}`);

        res.json({
            asin,
            original: optimizationResult.original,
            optimized: optimizationResult.optimized,
            optimizationScore: scoreResult.score,
            scoreFactors: scoreResult.factors,
            metadata: optimizationResult.metadata,
            source: 'fresh'
        });

    } catch (error) {
        console.error('Optimization error:', error.message);
        
        if (error.message.includes('API')) {
            return res.status(503).json({
                error: 'AI service unavailable',
                message: 'Gemini AI service is temporarily unavailable. Please try again later.'
            });
        }
        
        res.status(500).json({
            error: 'Optimization failed',
            message: error.message
        });
    }
});

/**
 * POST /api/optimize/batch - Optimize multiple products
 */
router.post('/batch', async (req, res) => {
    try {
        const { asins } = req.body;
        
        if (!Array.isArray(asins) || asins.length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'ASINs must be provided as a non-empty array'
            });
        }

        if (asins.length > 5) {
            return res.status(400).json({
                error: 'Too many ASINs',
                message: 'Maximum 5 ASINs per batch optimization to respect API limits'
            });
        }

        console.log(`🚀 Starting batch optimization for ${asins.length} products`);

        // Get all products from database
        const placeholders = asins.map(() => '?').join(',');
        const products = await executeQuery(
            `SELECT * FROM products WHERE asin IN (${placeholders})`,
            asins
        );

        if (products.length === 0) {
            return res.status(404).json({
                error: 'No products found',
                message: 'Please fetch the product data first before optimizing'
            });
        }

        // Convert to format expected by optimizer
        const productsToOptimize = products.map(p => ({
            asin: p.asin,
            title: p.title,
            bulletPoints: p.bullet_points,
            description: p.description,
            category: p.category,
            brand: p.brand
        }));

        // Perform batch optimization
        const batchResult = await optimizer.optimizeMultipleProducts(productsToOptimize);

        // Store successful optimizations
        for (const result of batchResult.successful) {
            const product = products.find(p => p.asin === result.asin);
            
            const scoreResult = optimizer.calculateOptimizationScore(
                result.original,
                result.optimized
            );

            const optimizationId = await executeQuery(`
                INSERT INTO optimizations (
                    product_id, asin, optimized_title, optimized_bullet_points,
                    optimized_description, suggested_keywords, optimization_score,
                    gemini_model, optimization_metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                product.id,
                result.asin,
                result.optimized.title,
                result.optimized.bulletPoints,
                result.optimized.description,
                JSON.stringify(result.optimized.suggestedKeywords),
                scoreResult.score,
                result.metadata.modelUsed,
                JSON.stringify(result.metadata)
            ]);

            // Log history
            await executeQuery(
                'INSERT INTO optimization_history (asin, optimization_id, action_type) VALUES (?, ?, ?)',
                [result.asin, optimizationId.insertId, 'created']
            );

            // Store keywords
            for (const keyword of result.optimized.suggestedKeywords) {
                await executeQuery(
                    'INSERT INTO keyword_tracking (asin, keyword, source) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP',
                    [result.asin, keyword, 'suggested']
                );
            }
        }

        console.log(`✅ Batch optimization completed: ${batchResult.successful.length} successful, ${batchResult.failed.length} failed`);

        res.json({
            results: batchResult,
            summary: batchResult.summary,
            totalRequests: batchResult.totalRequests,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Batch optimization error:', error.message);
        res.status(500).json({
            error: 'Batch optimization failed',
            message: error.message
        });
    }
});

/**
 * GET /api/optimize/stats - Get optimization statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Get optimization statistics
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total_optimizations,
                COUNT(DISTINCT asin) as unique_products,
                AVG(optimization_score) as average_score,
                MAX(optimization_score) as max_score,
                MIN(optimization_score) as min_score,
                DATE(created_at) as optimization_date,
                COUNT(*) as daily_count
            FROM optimizations 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY optimization_date DESC
        `);

        // Get model usage stats
        const modelStats = await executeQuery(`
            SELECT 
                gemini_model,
                COUNT(*) as usage_count,
                AVG(optimization_score) as avg_score
            FROM optimizations
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY gemini_model
        `);

        // Get top performing keywords
        const keywordStats = await executeQuery(`
            SELECT 
                keyword,
                COUNT(*) as usage_count
            FROM keyword_tracking
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY keyword
            ORDER BY usage_count DESC
            LIMIT 20
        `);

        const aiStats = optimizer.getUsageStats();

        res.json({
            optimizationStats: stats,
            modelUsage: modelStats,
            topKeywords: keywordStats,
            aiServiceStats: aiStats,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Stats error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch statistics',
            message: error.message
        });
    }
});

module.exports = router;