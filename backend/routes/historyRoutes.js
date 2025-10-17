const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

/**
 * GET /api/history/:asin - Get optimization history for specific ASIN
 */
router.get('/:asin', async (req, res) => {
    try {
        const { asin } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const offset = (page - 1) * limit;

        console.log(`📚 Fetching optimization history for ASIN: ${asin}`);

        // Get total count
        const countResult = await executeQuery(
            'SELECT COUNT(*) as total FROM optimizations WHERE asin = ?',
            [asin]
        );
        const totalOptimizations = countResult[0].total;

        // Get optimization history with product details
        const history = await executeQuery(`
            SELECT 
                o.id,
                o.asin,
                o.optimized_title,
                o.optimized_bullet_points,
                o.optimized_description,
                o.suggested_keywords,
                o.optimization_score,
                o.gemini_model,
                o.optimization_metadata,
                o.created_at,
                p.title as original_title,
                p.bullet_points as original_bullet_points,
                p.description as original_description,
                p.price,
                p.rating,
                p.review_count
            FROM optimizations o
            JOIN products p ON o.product_id = p.id
            WHERE o.asin = ?
            ORDER BY o.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `, [asin]);

        // Get history actions for each optimization
        const historyWithActions = await Promise.all(
            history.map(async (opt) => {
                const actions = await executeQuery(
                    'SELECT action_type, user_feedback, performance_metrics, created_at FROM optimization_history WHERE optimization_id = ? ORDER BY created_at DESC',
                    [opt.id]
                );

                return {
                    id: opt.id,
                    asin: opt.asin,
                    original: {
                        title: opt.original_title,
                        bulletPoints: opt.original_bullet_points,
                        description: opt.original_description
                    },
                    optimized: {
                        title: opt.optimized_title,
                        bulletPoints: opt.optimized_bullet_points,
                        description: opt.optimized_description,
                        suggestedKeywords: (() => {
                            try {
                                return JSON.parse(opt.suggested_keywords || '[]');
                            } catch (e) {
                                if (opt.suggested_keywords && typeof opt.suggested_keywords === 'string') {
                                    if (opt.suggested_keywords.startsWith('[') && opt.suggested_keywords.endsWith(']')) {
                                        return opt.suggested_keywords
                                            .slice(1, -1)
                                            .split(',')
                                            .map(k => k.trim().replace(/['"]/g, ''));
                                    } else {
                                        return opt.suggested_keywords.split(',').map(k => k.trim());
                                    }
                                }
                                return [];
                            }
                        })()
                    },
                    optimizationScore: opt.optimization_score,
                    modelUsed: opt.gemini_model,
                    metadata: JSON.parse(opt.optimization_metadata || '{}'),
                    productInfo: {
                        price: opt.price,
                        rating: opt.rating,
                        reviewCount: opt.review_count
                    },
                    actions: actions.map(action => ({
                        type: action.action_type,
                        feedback: JSON.parse(action.user_feedback || '{}'),
                        metrics: JSON.parse(action.performance_metrics || '{}'),
                        timestamp: action.created_at
                    })),
                    createdAt: opt.created_at
                };
            })
        );

        const totalPages = Math.ceil(totalOptimizations / limit);

        res.json({
            asin,
            history: historyWithActions,
            pagination: {
                currentPage: page,
                totalPages,
                totalOptimizations,
                optimizationsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('History fetch error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch optimization history',
            message: error.message
        });
    }
});

/**
 * GET /api/history - Get all optimization history with filters
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;
        
        const { 
            startDate, 
            endDate, 
            minScore, 
            maxScore, 
            model 
        } = req.query;

        console.log(`📚 Fetching optimization history with filters`);

        // Build dynamic query
        let whereConditions = [];
        let queryParams = [];

        if (startDate) {
            whereConditions.push('o.created_at >= ?');
            queryParams.push(startDate);
        }

        if (endDate) {
            whereConditions.push('o.created_at <= ?');
            queryParams.push(endDate);
        }

        if (minScore) {
            whereConditions.push('o.optimization_score >= ?');
            queryParams.push(parseFloat(minScore));
        }

        if (maxScore) {
            whereConditions.push('o.optimization_score <= ?');
            queryParams.push(parseFloat(maxScore));
        }

        if (model) {
            whereConditions.push('o.gemini_model = ?');
            queryParams.push(model);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM optimizations o
            JOIN products p ON o.product_id = p.id
            ${whereClause}
        `;
        const countResult = await executeQuery(countQuery, queryParams);
        const totalOptimizations = countResult[0].total;

        // Get optimizations
        const historyQuery = `
            SELECT 
                o.id,
                o.asin,
                o.optimized_title,
                o.optimized_bullet_points,
                o.optimized_description,
                o.suggested_keywords,
                o.optimization_score,
                o.gemini_model,
                o.optimization_metadata,
                o.created_at,
                p.title as original_title,
                p.price,
                p.rating,
                p.review_count
            FROM optimizations o
            JOIN products p ON o.product_id = p.id
            ${whereClause}
            ORDER BY o.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        const history = await executeQuery(historyQuery, queryParams);

        const formattedHistory = history.map(opt => {
            let suggestedKeywords = [];
            try {
                // Try to parse as JSON first
                suggestedKeywords = JSON.parse(opt.suggested_keywords || '[]');
            } catch (e) {
                // If that fails, try to parse as array string or comma-separated
                if (opt.suggested_keywords && typeof opt.suggested_keywords === 'string') {
                    if (opt.suggested_keywords.startsWith('[') && opt.suggested_keywords.endsWith(']')) {
                        // Handle array-like strings
                        suggestedKeywords = opt.suggested_keywords
                            .slice(1, -1)
                            .split(',')
                            .map(k => k.trim().replace(/['"]/g, ''));
                    } else {
                        // Handle comma-separated strings
                        suggestedKeywords = opt.suggested_keywords.split(',').map(k => k.trim());
                    }
                }
            }

            return {
                id: opt.id,
                asin: opt.asin,
                original: {
                    title: opt.original_title
                },
                optimized: {
                    title: opt.optimized_title,
                    suggestedKeywords: suggestedKeywords
                },
                optimizationScore: opt.optimization_score,
                modelUsed: opt.gemini_model,
                productInfo: {
                    price: opt.price,
                    rating: opt.rating,
                    reviewCount: opt.review_count
                },
                createdAt: opt.created_at
            };
        });

        const totalPages = Math.ceil(totalOptimizations / limit);

        res.json({
            history: formattedHistory,
            pagination: {
                currentPage: page,
                totalPages,
                totalOptimizations,
                optimizationsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: {
                startDate,
                endDate,
                minScore,
                maxScore,
                model
            }
        });

    } catch (error) {
        console.error('History list error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch optimization history',
            message: error.message
        });
    }
});

/**
 * POST /api/history/:optimizationId/feedback - Add user feedback to optimization
 */
router.post('/:optimizationId/feedback', async (req, res) => {
    try {
        const { optimizationId } = req.params;
        const { feedback, rating, comments } = req.body;

        if (!feedback || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({
                error: 'Invalid feedback data',
                message: 'Rating must be between 1 and 5, and feedback is required'
            });
        }

        console.log(`💬 Adding feedback for optimization ${optimizationId}`);

        // Verify optimization exists
        const optimizationResult = await executeQuery(
            'SELECT asin FROM optimizations WHERE id = ?',
            [optimizationId]
        );

        if (optimizationResult.length === 0) {
            return res.status(404).json({
                error: 'Optimization not found',
                message: 'The specified optimization does not exist'
            });
        }

        const asin = optimizationResult[0].asin;

        // Add feedback to history
        const feedbackData = {
            rating,
            comments: comments || '',
            helpful: feedback.helpful || false,
            improvements: feedback.improvements || [],
            timestamp: new Date().toISOString()
        };

        await executeQuery(
            'INSERT INTO optimization_history (asin, optimization_id, action_type, user_feedback) VALUES (?, ?, ?, ?)',
            [asin, optimizationId, 'feedback', JSON.stringify(feedbackData)]
        );

        console.log(`✅ Feedback added for optimization ${optimizationId}`);

        res.json({
            success: true,
            message: 'Feedback added successfully',
            feedback: feedbackData
        });

    } catch (error) {
        console.error('Feedback error:', error.message);
        res.status(500).json({
            error: 'Failed to add feedback',
            message: error.message
        });
    }
});

/**
 * GET /api/history/analytics/trends - Get optimization trends and analytics
 */
router.get('/analytics/trends', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        console.log(`📊 Generating optimization trends for last ${days} days`);

        // Daily optimization counts
        const dailyTrends = await executeQuery(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as optimizations,
                AVG(optimization_score) as avg_score,
                MAX(optimization_score) as max_score,
                MIN(optimization_score) as min_score
            FROM optimizations 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [parseInt(days)]);

        // Score distribution
        const scoreDistribution = await executeQuery(`
            SELECT 
                CASE 
                    WHEN optimization_score >= 80 THEN 'Excellent (80-100)'
                    WHEN optimization_score >= 60 THEN 'Good (60-79)'
                    WHEN optimization_score >= 40 THEN 'Average (40-59)'
                    ELSE 'Poor (0-39)'
                END as score_range,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM optimizations WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)), 2) as percentage
            FROM optimizations
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY score_range
            ORDER BY MIN(optimization_score) DESC
        `, [parseInt(days), parseInt(days)]);

        // Top performing ASINs
        const topASINs = await executeQuery(`
            SELECT 
                o.asin,
                p.title,
                COUNT(*) as optimization_count,
                AVG(o.optimization_score) as avg_score,
                MAX(o.optimization_score) as best_score,
                MAX(o.created_at) as last_optimized
            FROM optimizations o
            JOIN products p ON o.product_id = p.id
            WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY o.asin, p.title
            ORDER BY avg_score DESC
            LIMIT 10
        `, [parseInt(days)]);

        // Model performance comparison
        const modelPerformance = await executeQuery(`
            SELECT 
                gemini_model,
                COUNT(*) as usage_count,
                AVG(optimization_score) as avg_score,
                STDDEV(optimization_score) as score_variance
            FROM optimizations
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY gemini_model
            ORDER BY avg_score DESC
        `, [parseInt(days)]);

        res.json({
            period: {
                days: parseInt(days),
                startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString()
            },
            trends: {
                dailyOptimizations: dailyTrends,
                scoreDistribution: scoreDistribution,
                topPerformingASINs: topASINs,
                modelPerformance: modelPerformance
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Analytics error:', error.message);
        res.status(500).json({
            error: 'Failed to generate analytics',
            message: error.message
        });
    }
});

module.exports = router;