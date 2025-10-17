const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiOptimizer {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY is required in environment variables');
        }
        
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });
        
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests
    }

    /**
     * Rate limiting to respect Gemini API quotas
     */
    async rateLimitCheck() {
        const now = Date.now();
        if (now - this.lastRequestTime < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - (now - this.lastRequestTime);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
        this.requestCount++;
    }

    /**
     * Create optimized prompts to minimize token usage while maximizing quality
     */
    createOptimizationPrompts(productData) {
        const { title, bulletPoints, description, category, brand } = productData;
        
        const baseContext = `Product: ${title}${brand ? ` by ${brand}` : ''}${category ? ` (${category})` : ''}`;
        
        return {
            titlePrompt: `${baseContext}\n\nOptimize this Amazon title for SEO and readability. Keep under 200 chars, include key benefits, maintain brand name:\n"${title}"\n\nOptimized title:`,
            
            bulletPrompt: `${baseContext}\n\nRewrite these bullet points - make them concise, benefit-focused, and scannable:\n${bulletPoints}\n\nOptimized bullets (max 5):`,
            
            descriptionPrompt: `${baseContext}\n\nEnhance this description - make it persuasive yet compliant, highlight key features and benefits:\n"${description}"\n\nOptimized description:`,
            
            keywordPrompt: `${baseContext}\n\nSuggest 5 high-impact keywords for Amazon SEO based on this product. Focus on search terms buyers actually use:\nTitle: ${title}\nFeatures: ${bulletPoints?.substring(0, 300) || 'N/A'}\n\nKeywords (comma-separated):`
        };
    }

    /**
     * Optimize product title
     */
    async optimizeTitle(productData) {
        await this.rateLimitCheck();
        
        try {
            const { titlePrompt } = this.createOptimizationPrompts(productData);
            const result = await this.model.generateContent(titlePrompt);
            const response = await result.response;
            
            return response.text().trim().replace(/^"|"$/g, ''); // Remove quotes if present
        } catch (error) {
            console.error('Title optimization error:', error.message);
            throw new Error(`Title optimization failed: ${error.message}`);
        }
    }

    /**
     * Optimize bullet points
     */
    async optimizeBulletPoints(productData) {
        await this.rateLimitCheck();
        
        try {
            const { bulletPrompt } = this.createOptimizationPrompts(productData);
            const result = await this.model.generateContent(bulletPrompt);
            const response = await result.response;
            
            return response.text().trim();
        } catch (error) {
            console.error('Bullet points optimization error:', error.message);
            throw new Error(`Bullet points optimization failed: ${error.message}`);
        }
    }

    /**
     * Optimize product description
     */
    async optimizeDescription(productData) {
        await this.rateLimitCheck();
        
        try {
            const { descriptionPrompt } = this.createOptimizationPrompts(productData);
            const result = await this.model.generateContent(descriptionPrompt);
            const response = await result.response;
            
            return response.text().trim();
        } catch (error) {
            console.error('Description optimization error:', error.message);
            throw new Error(`Description optimization failed: ${error.message}`);
        }
    }

    /**
     * Generate keyword suggestions
     */
    async generateKeywords(productData) {
        await this.rateLimitCheck();
        
        try {
            const { keywordPrompt } = this.createOptimizationPrompts(productData);
            const result = await this.model.generateContent(keywordPrompt);
            const response = await result.response;
            
            const keywordText = response.text().trim();
            const keywords = keywordText.split(',').map(k => k.trim()).filter(k => k.length > 0);
            
            return keywords.slice(0, 5); // Ensure max 5 keywords
        } catch (error) {
            console.error('Keyword generation error:', error.message);
            throw new Error(`Keyword generation failed: ${error.message}`);
        }
    }

    /**
     * Complete optimization - all elements in sequence
     */
    async optimizeProduct(productData) {
        try {
            console.log(`🤖 Starting AI optimization for ASIN: ${productData.asin}`);
            
            const startTime = Date.now();
            
            // Run optimizations sequentially to respect rate limits
            const [optimizedTitle, optimizedBulletPoints, optimizedDescription, suggestedKeywords] = await Promise.all([
                this.optimizeTitle(productData),
                this.optimizeBulletPoints(productData),
                this.optimizeDescription(productData),
                this.generateKeywords(productData)
            ]);

            const optimizationTime = Date.now() - startTime;
            
            const result = {
                asin: productData.asin,
                original: {
                    title: productData.title,
                    bulletPoints: productData.bulletPoints,
                    description: productData.description
                },
                optimized: {
                    title: optimizedTitle,
                    bulletPoints: optimizedBulletPoints,
                    description: optimizedDescription,
                    suggestedKeywords
                },
                metadata: {
                    optimizationTime: optimizationTime,
                    modelUsed: 'gemini-2.0-flash-exp',
                    requestCount: 4, // Title, bullets, description, keywords
                    timestamp: new Date().toISOString()
                }
            };

            console.log(`✅ Optimization completed in ${optimizationTime}ms`);
            return result;

        } catch (error) {
            console.error(`❌ Product optimization failed:`, error.message);
            throw new Error(`AI optimization failed: ${error.message}`);
        }
    }

    /**
     * Batch optimization with intelligent rate limiting
     */
    async optimizeMultipleProducts(products, options = {}) {
        const { 
            maxConcurrent = 1, // Keep sequential for rate limiting
            delayBetweenBatches = 5000 // 5 seconds between products
        } = options;

        const results = [];
        const errors = [];

        for (let i = 0; i < products.length; i++) {
            try {
                console.log(`📊 Processing product ${i + 1}/${products.length}`);
                
                const result = await this.optimizeProduct(products[i]);
                results.push(result);
                
                // Add delay between products
                if (i < products.length - 1) {
                    console.log(`⏱️ Waiting ${delayBetweenBatches}ms before next optimization...`);
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
                
            } catch (error) {
                const errorResult = {
                    asin: products[i].asin,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                errors.push(errorResult);
                console.error(`❌ Failed to optimize ${products[i].asin}:`, error.message);
            }
        }

        return {
            successful: results,
            failed: errors,
            totalRequests: this.requestCount,
            summary: {
                total: products.length,
                successful: results.length,
                failed: errors.length
            }
        };
    }

    /**
     * Calculate optimization score based on improvements
     */
    calculateOptimizationScore(original, optimized) {
        let score = 0;
        const factors = [];

        // Title improvements
        if (optimized.title.length > original.title.length && optimized.title.length <= 200) {
            score += 20;
            factors.push('Enhanced title length');
        }

        // Bullet point improvements
        if (optimized.bulletPoints && optimized.bulletPoints.length > (original.bulletPoints?.length || 0)) {
            score += 25;
            factors.push('Improved bullet points');
        }

        // Description improvements
        if (optimized.description && optimized.description.length > (original.description?.length || 0)) {
            score += 25;
            factors.push('Enhanced description');
        }

        // Keyword additions
        if (optimized.suggestedKeywords && optimized.suggestedKeywords.length >= 3) {
            score += 30;
            factors.push('Added keyword strategy');
        }

        return {
            score: Math.min(score, 100),
            factors,
            maxScore: 100
        };
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            totalRequests: this.requestCount,
            lastRequestTime: new Date(this.lastRequestTime).toISOString(),
            rateLimitInterval: this.minRequestInterval
        };
    }
}

module.exports = GeminiOptimizer;