import React, { useState } from 'react';
import axios from 'axios';
import './ProductOptimizer.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ProductOptimizer = () => {
  const [asin, setAsin] = useState('');
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Input, 2: Product Fetched, 3: Optimized

  const validateASIN = (asin) => {
    const asinRegex = /^[A-Z0-9]{10}$/;
    return asinRegex.test(asin.toUpperCase());
  };

  const handleASINSubmit = async (e) => {
    e.preventDefault();
    
    if (!asin.trim()) {
      setError('Please enter an ASIN');
      return;
    }

    if (!validateASIN(asin)) {
      setError('Invalid ASIN format. ASIN must be 10 characters (letters and numbers only)');
      return;
    }

    setLoading(true);
    setError('');
    setProductData(null);
    setOptimization(null);

    try {
      console.log('Fetching product data for ASIN:', asin.toUpperCase());
      
      const response = await axios.get(`${API_BASE_URL}/products/${asin.toUpperCase()}`, {
        timeout: 30000 // 30 seconds timeout
      });

      setProductData(response.data);
      setStep(2);
      console.log('Product data fetched successfully');
    } catch (err) {
      console.error('Error fetching product:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (err.response?.status === 404) {
        setError('Product not found. Please check the ASIN and try again.');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.error || 'Invalid ASIN format');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch product data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!productData) return;

    setLoading(true);
    setError('');

    try {
      console.log('Starting AI optimization for ASIN:', productData.asin);
      
      const response = await axios.post(`${API_BASE_URL}/optimize/${productData.asin}`, {}, {
        timeout: 60000 // 60 seconds for AI processing
      });

      setOptimization(response.data);
      setStep(3);
      console.log('Optimization completed successfully');
    } catch (err) {
      console.error('Error optimizing product:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Optimization timeout. The AI service may be busy. Please try again.');
      } else if (err.response?.status === 503) {
        setError('AI service is temporarily unavailable. Please try again in a few minutes.');
      } else {
        setError(err.response?.data?.message || 'Failed to optimize product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAsin('');
    setProductData(null);
    setOptimization(null);
    setError('');
    setStep(1);
  };

  const renderProductSection = (title, content, type = 'text') => {
    if (!content) return null;

    return (
      <div className="product-section">
        <h4 className="section-title">{title}</h4>
        {type === 'bullets' ? (
          <ul className="bullet-list">
            {content.split('\n').filter(bullet => bullet.trim()).map((bullet, index) => (
              <li key={index} className="bullet-item">
                {bullet.replace(/^•\s*/, '')}
              </li>
            ))}
          </ul>
        ) : type === 'keywords' ? (
          <div className="keywords-container">
            {Array.isArray(content) ? content.map((keyword, index) => (
              <span key={index} className="keyword-tag">{keyword}</span>
            )) : (
              <span className="keyword-tag">{content}</span>
            )}
          </div>
        ) : (
          <p className="section-content">{content}</p>
        )}
      </div>
    );
  };

  return (
    <div className="product-optimizer">
      <div className="container">
        <div className="optimizer-header">
          <h2 className="page-title">Amazon Product Listing Optimizer</h2>
          <p className="page-description">
            Enter an Amazon ASIN to fetch product details and generate AI-powered optimizations
          </p>
        </div>

        {/* Step 1: ASIN Input */}
        <div className="asin-input-section">
          <form onSubmit={handleASINSubmit} className="asin-form">
            <div className="form-group">
              <label htmlFor="asin" className="form-label">
                Amazon ASIN (10 characters)
              </label>
              <div className="input-group">
                <input
                  type="text"
                  id="asin"
                  value={asin}
                  onChange={(e) => setAsin(e.target.value.toUpperCase())}
                  placeholder="e.g., B08N5WRWNW"
                  className="form-input"
                  maxLength="10"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading || !asin.trim()}
                >
                  {loading && step === 1 ? (
                    <>
                      <span className="loading-spinner"></span>
                      Fetching...
                    </>
                  ) : (
                    'Fetch Product'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Step 2: Product Data Display */}
        {productData && step >= 2 && (
          <div className="product-data-section">
            <div className="section-header">
              <h3 className="section-title">Product Information</h3>
              <div className="product-meta">
                <span className="asin-display">ASIN: {productData.asin}</span>
                {productData.source && (
                  <span className={`source-badge ${productData.source}`}>
                    {productData.source === 'cached' ? '💾 Cached' : '🔄 Fresh'}
                  </span>
                )}
              </div>
            </div>

            <div className="product-card">
              {productData.imageUrl && (
                <div className="product-image">
                  <img 
                    src={productData.imageUrl} 
                    alt={productData.title}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              
              <div className="product-info">
                {renderProductSection('Title', productData.title)}
                {renderProductSection('Bullet Points', productData.bulletPoints, 'bullets')}
                {renderProductSection('Description', productData.description)}
                
                <div className="product-stats">
                  {productData.price && (
                    <div className="stat-item">
                      <span className="stat-label">Price:</span>
                      <span className="stat-value">{productData.price}</span>
                    </div>
                  )}
                  {productData.rating && (
                    <div className="stat-item">
                      <span className="stat-label">Rating:</span>
                      <span className="stat-value">{productData.rating}⭐</span>
                    </div>
                  )}
                  {productData.reviewCount && (
                    <div className="stat-item">
                      <span className="stat-label">Reviews:</span>
                      <span className="stat-value">{productData.reviewCount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {step === 2 && (
              <div className="action-buttons">
                <button 
                  onClick={handleOptimize}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      AI Optimizing...
                    </>
                  ) : (
                    <>
                      🤖 Optimize with AI
                    </>
                  )}
                </button>
                <button 
                  onClick={handleReset}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Try Another ASIN
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Optimization Results */}
        {optimization && step === 3 && (
          <div className="optimization-results">
            <div className="results-header">
              <h3 className="section-title">AI Optimization Results</h3>
              {optimization.optimizationScore && (
                <div className="score-display">
                  <span className="score-label">Optimization Score:</span>
                  <span className="score-number">{optimization.optimizationScore}/100</span>
                  <div className="score-bar">
                    <div 
                      className="score-progress" 
                      style={{ width: `${optimization.optimizationScore}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="comparison-container">
              {/* Original Version */}
              <div className="comparison-side original">
                <div className="comparison-header">
                  <span className="comparison-badge original">Original</span>
                  <h4>Current Listing</h4>
                </div>
                {renderProductSection('Title', optimization.original?.title)}
                {renderProductSection('Bullet Points', optimization.original?.bulletPoints, 'bullets')}
                {renderProductSection('Description', optimization.original?.description)}
              </div>

              {/* Optimized Version */}
              <div className="comparison-side optimized">
                <div className="comparison-header">
                  <span className="comparison-badge optimized">AI Optimized</span>
                  <h4>Recommended Changes</h4>
                </div>
                {renderProductSection('Enhanced Title', optimization.optimized?.title)}
                {renderProductSection('Improved Bullet Points', optimization.optimized?.bulletPoints, 'bullets')}
                {renderProductSection('Enhanced Description', optimization.optimized?.description)}
                {renderProductSection('Suggested Keywords', optimization.optimized?.suggestedKeywords, 'keywords')}
              </div>
            </div>

            {optimization.scoreFactors && optimization.scoreFactors.length > 0 && (
              <div className="optimization-factors">
                <h4>Improvement Factors:</h4>
                <ul className="factors-list">
                  {optimization.scoreFactors.map((factor, index) => (
                    <li key={index} className="factor-item">
                      ✅ {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="action-buttons">
              <button 
                onClick={handleReset}
                className="btn btn-primary"
              >
                Optimize Another Product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOptimizer;