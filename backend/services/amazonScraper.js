const axios = require('axios');
const cheerio = require('cheerio');

class AmazonScraper {
    constructor() {
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        };
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Fetch product data from Amazon using ASIN
     * @param {string} asin - Amazon Standard Identification Number
     * @returns {Object} Product details
     */
    async fetchProductDetails(asin) {
        if (!asin || typeof asin !== 'string' || asin.length !== 10) {
            throw new Error('Invalid ASIN format. ASIN must be a 10-character string.');
        }

        try {
            const url = `https://www.amazon.com/dp/${asin}`;
            console.log(`🔍 Scraping product data for ASIN: ${asin}`);
            console.log(`📍 URL: ${url}`);

            const response = await axios.get(url, {
                headers: this.headers,
                timeout: this.timeout,
                validateStatus: (status) => status < 500 // Accept 4xx errors but not 5xx
            });

            if (response.status === 404) {
                throw new Error('Product not found. Please check the ASIN.');
            }

            if (response.status !== 200) {
                throw new Error(`Amazon returned status ${response.status}`);
            }

            const $ = cheerio.load(response.data);
            
            // Extract product details using multiple selectors for robustness
            const productData = {
                asin,
                title: this.extractTitle($),
                bulletPoints: this.extractBulletPoints($),
                description: this.extractDescription($),
                imageUrl: this.extractImageUrl($),
                price: this.extractPrice($),
                availability: this.extractAvailability($),
                rating: this.extractRating($),
                reviewCount: this.extractReviewCount($),
                category: this.extractCategory($),
                brand: this.extractBrand($)
            };

            // Validate that we got essential data
            if (!productData.title || productData.title.length < 10) {
                throw new Error('Could not extract product title. The product page may have an unusual format or be restricted.');
            }

            console.log(`✅ Successfully scraped product: ${productData.title.substring(0, 50)}...`);
            return productData;

        } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw new Error('Network connection failed. Please check your internet connection.');
            }
            
            if (error.code === 'ETIMEDOUT') {
                throw new Error('Request timeout. Amazon may be temporarily unavailable.');
            }

            console.error(`❌ Scraping failed for ASIN ${asin}:`, error.message);
            throw error;
        }
    }

    /**
     * Extract product title from page
     */
    extractTitle($) {
        const selectors = [
            '#productTitle',
            '.product-title',
            '#btAsinTitle',
            '.a-size-large.product-title-word-break'
        ];

        for (const selector of selectors) {
            const title = $(selector).text().trim();
            if (title) return title;
        }
        return null;
    }

    /**
     * Extract bullet points/features from page
     */
    extractBulletPoints($) {
        const bulletPoints = [];
        
        // Main feature bullets
        $('#feature-bullets ul li span').each((i, el) => {
            const text = $(el).text().trim();
            if (text && !text.includes('Make sure') && text.length > 10) {
                bulletPoints.push(text);
            }
        });

        // Alternative selector
        if (bulletPoints.length === 0) {
            $('.a-unordered-list .a-list-item').each((i, el) => {
                const text = $(el).text().trim();
                if (text && !text.includes('Make sure') && text.length > 10) {
                    bulletPoints.push(text);
                }
            });
        }

        return bulletPoints.length > 0 ? bulletPoints.join('\n• ') : null;
    }

    /**
     * Extract product description from page
     */
    extractDescription($) {
        const selectors = [
            '#productDescription p',
            '#feature-bullets .a-list-item',
            '.product-description',
            '#aplus .aplus-p1'
        ];

        for (const selector of selectors) {
            const description = $(selector).text().trim();
            if (description && description.length > 50) {
                return description;
            }
        }
        return null;
    }

    /**
     * Extract main product image URL
     */
    extractImageUrl($) {
        const selectors = [
            '#landingImage',
            '.a-dynamic-image',
            '#imgBlkFront'
        ];

        for (const selector of selectors) {
            const src = $(selector).attr('src') || $(selector).attr('data-src');
            if (src) return src;
        }
        return null;
    }

    /**
     * Extract product price
     */
    extractPrice($) {
        const selectors = [
            '.a-price .a-offscreen',
            '#priceblock_dealprice',
            '#priceblock_ourprice',
            '.a-price-whole',
            '.a-price-symbol + .a-price-whole'
        ];

        for (const selector of selectors) {
            const price = $(selector).first().text().trim();
            if (price) return price;
        }
        return null;
    }

    /**
     * Extract availability status
     */
    extractAvailability($) {
        const selectors = [
            '#availability span',
            '.a-color-success',
            '.a-color-error',
            '#merchant-info'
        ];

        for (const selector of selectors) {
            const availability = $(selector).text().trim();
            if (availability && (availability.includes('stock') || availability.includes('Available'))) {
                return availability;
            }
        }
        return 'Unknown';
    }

    /**
     * Extract product rating
     */
    extractRating($) {
        const ratingText = $('[data-hook="average-star-rating"] .a-icon-alt').text();
        const match = ratingText.match(/(\d+\.?\d*) out of 5/);
        return match ? parseFloat(match[1]) : null;
    }

    /**
     * Extract review count
     */
    extractReviewCount($) {
        const reviewText = $('#acrCustomerReviewText').text();
        const match = reviewText.match(/(\d+(?:,\d+)*)/);
        return match ? parseInt(match[1].replace(/,/g, '')) : null;
    }

    /**
     * Extract product category/department
     */
    extractCategory($) {
        const breadcrumb = $('#wayfinding-breadcrumbs_feature_div a').last().text().trim();
        return breadcrumb || null;
    }

    /**
     * Extract brand name
     */
    extractBrand($) {
        const selectors = [
            '#bylineInfo',
            '.a-color-secondary .author',
            '[data-feature-name="bylineInfo"] .author'
        ];

        for (const selector of selectors) {
            const brand = $(selector).text().trim().replace('by ', '').replace('Brand: ', '');
            if (brand) return brand;
        }
        return null;
    }

    /**
     * Validate ASIN format
     */
    isValidASIN(asin) {
        return typeof asin === 'string' && 
               asin.length === 10 && 
               /^[A-Z0-9]+$/.test(asin);
    }

    /**
     * Get multiple products in parallel (with rate limiting)
     */
    async fetchMultipleProducts(asins, delayMs = 2000) {
        if (!Array.isArray(asins)) {
            throw new Error('ASINs must be provided as an array');
        }

        const results = [];
        
        for (let i = 0; i < asins.length; i++) {
            try {
                const product = await this.fetchProductDetails(asins[i]);
                results.push({ asin: asins[i], data: product, success: true });
                
                // Add delay between requests to be respectful
                if (i < asins.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            } catch (error) {
                results.push({ asin: asins[i], error: error.message, success: false });
            }
        }

        return results;
    }
}

module.exports = AmazonScraper;