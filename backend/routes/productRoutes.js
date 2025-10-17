const express = require('express');
const router = express.Router();
const AmazonScraper = require('../services/amazonScraper');
const { executeQuery } = require('../config/database');

const scraper = new AmazonScraper();

/**
 * GET /api/products/:asin - Fetch product data by ASIN
 */
router.get('/:asin', async (req, res) => {
    try {
        const { asin } = req.params;
        
        // Validate ASIN
        if (!scraper.isValidASIN(asin)) {
            return res.status(400).json({
                error: 'Invalid ASIN format',
                message: 'ASIN must be a 10-character alphanumeric string'
            });
        }

        console.log(`📦 Fetching product data for ASIN: ${asin}`);

        // Check if product exists in database
        let existingProduct = await executeQuery(
            'SELECT * FROM products WHERE asin = ? ORDER BY updated_at DESC LIMIT 1',
            [asin]
        );

        // If product exists and was updated recently (within 24 hours), return cached data
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (existingProduct.length > 0) {
            const product = existingProduct[0];
            const lastUpdated = new Date(product.updated_at);
            
            if (lastUpdated > twentyFourHoursAgo) {
                console.log(`📋 Returning cached product data for ${asin}`);
                return res.json({
                    asin: product.asin,
                    title: product.title,
                    bulletPoints: product.bullet_points,
                    description: product.description,
                    imageUrl: product.image_url,
                    price: product.price,
                    availability: product.availability,
                    rating: product.rating,
                    reviewCount: product.review_count,
                    lastUpdated: product.updated_at,
                    source: 'cached'
                });
            }
        }

        // Fetch fresh data from Amazon
        const productData = await scraper.fetchProductDetails(asin);

        // Store/update product in database
        const upsertQuery = `
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
        `;

        await executeQuery(upsertQuery, [
            productData.asin,
            productData.title,
            productData.bulletPoints,
            productData.description,
            productData.imageUrl,
            productData.price,
            productData.availability,
            productData.rating,
            productData.reviewCount
        ]);

        console.log(`✅ Product data saved to database for ${asin}`);

        res.json({
            ...productData,
            source: 'fresh',
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Product fetch error:', error.message);
        
        if (error.message.includes('Invalid ASIN')) {
            return res.status(400).json({ error: error.message });
        }
        
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({
            error: 'Failed to fetch product data',
            message: error.message
        });
    }
});

/**
 * POST /api/products/batch - Fetch multiple products by ASINs
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

        if (asins.length > 10) {
            return res.status(400).json({
                error: 'Too many ASINs',
                message: 'Maximum 10 ASINs per batch request'
            });
        }

        // Validate all ASINs
        const invalidASINs = asins.filter(asin => !scraper.isValidASIN(asin));
        if (invalidASINs.length > 0) {
            return res.status(400).json({
                error: 'Invalid ASINs',
                message: `Invalid ASINs found: ${invalidASINs.join(', ')}`
            });
        }

        console.log(`📦 Batch fetching ${asins.length} products`);

        const results = await scraper.fetchMultipleProducts(asins);
        
        // Store successful results in database
        for (const result of results) {
            if (result.success) {
                const upsertQuery = `
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
                `;

                await executeQuery(upsertQuery, [
                    result.data.asin,
                    result.data.title,
                    result.data.bulletPoints,
                    result.data.description,
                    result.data.imageUrl,
                    result.data.price,
                    result.data.availability,
                    result.data.rating,
                    result.data.reviewCount
                ]);
            }
        }

        res.json({
            results,
            summary: {
                total: asins.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Batch fetch error:', error.message);
        res.status(500).json({
            error: 'Batch fetch failed',
            message: error.message
        });
    }
});

/**
 * GET /api/products - Get all products with pagination
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await executeQuery('SELECT COUNT(*) as total FROM products');
        const totalProducts = countResult[0].total;

        // Get products with pagination
        const products = await executeQuery(
            'SELECT * FROM products ORDER BY updated_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const totalPages = Math.ceil(totalProducts / limit);

        res.json({
            products: products.map(p => ({
                asin: p.asin,
                title: p.title,
                bulletPoints: p.bullet_points,
                description: p.description,
                imageUrl: p.image_url,
                price: p.price,
                availability: p.availability,
                rating: p.rating,
                reviewCount: p.review_count,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            })),
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                productsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('Products list error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch products',
            message: error.message
        });
    }
});

module.exports = router;