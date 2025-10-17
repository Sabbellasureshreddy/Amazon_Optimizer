import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OptimizationHistory.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const OptimizationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedASIN, setSelectedASIN] = useState('');
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minScore: '',
    maxScore: ''
  });

  useEffect(() => {
    fetchHistory();
  }, [selectedASIN]);

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      let url = `${API_BASE_URL}/history`;
      const params = new URLSearchParams();
      
      if (selectedASIN) {
        url = `${API_BASE_URL}/history/${selectedASIN}`;
      }
      
      params.append('page', page.toString());
      params.append('limit', '10');
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setHistory(response.data.history || []);
      setPagination(response.data.pagination || {});
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to fetch optimization history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    fetchHistory(1);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minScore: '',
      maxScore: ''
    });
    setSelectedASIN('');
    setTimeout(() => fetchHistory(1), 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const renderHistoryItem = (item) => (
    <div key={item.id} className="history-item">
      <div className="history-header">
        <div className="history-meta">
          <span className="asin-tag">{item.asin}</span>
          <span className="date-info">{formatDate(item.createdAt)}</span>
          {item.optimizationScore && (
            <div className="score-badge" style={{ backgroundColor: getScoreColor(item.optimizationScore) }}>
              {item.optimizationScore}/100
            </div>
          )}
        </div>
      </div>
      
      <div className="history-content">
        <div className="content-section">
          <h4 className="content-title">Original Title</h4>
          <p className="content-text original">{item.original?.title}</p>
        </div>
        
        <div className="content-section">
          <h4 className="content-title">Optimized Title</h4>
          <p className="content-text optimized">{item.optimized?.title}</p>
        </div>
        
        {item.optimized?.suggestedKeywords && item.optimized.suggestedKeywords.length > 0 && (
          <div className="content-section">
            <h4 className="content-title">Suggested Keywords</h4>
            <div className="keywords-container">
              {item.optimized.suggestedKeywords.map((keyword, index) => (
                <span key={index} className="keyword-tag">{keyword}</span>
              ))}
            </div>
          </div>
        )}
        
        {item.productInfo && (
          <div className="product-info-section">
            <div className="info-grid">
              {item.productInfo.price && (
                <div className="info-item">
                  <span className="info-label">Price:</span>
                  <span className="info-value">{item.productInfo.price}</span>
                </div>
              )}
              {item.productInfo.rating && (
                <div className="info-item">
                  <span className="info-label">Rating:</span>
                  <span className="info-value">{item.productInfo.rating}⭐</span>
                </div>
              )}
              {item.productInfo.reviewCount && (
                <div className="info-item">
                  <span className="info-label">Reviews:</span>
                  <span className="info-value">{item.productInfo.reviewCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="optimization-history">
      <div className="container">
        <div className="history-header-section">
          <h2 className="page-title">Optimization History</h2>
          <p className="page-description">
            Track and review all your product optimization history
          </p>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Specific ASIN:</label>
              <input
                type="text"
                value={selectedASIN}
                onChange={(e) => setSelectedASIN(e.target.value.toUpperCase())}
                placeholder="Enter ASIN (optional)"
                className="filter-input"
                maxLength="10"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Start Date:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">End Date:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Min Score:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', e.target.value)}
                placeholder="0-100"
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Max Score:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.maxScore}
                onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                placeholder="0-100"
                className="filter-input"
              />
            </div>
          </div>
          
          <div className="filter-actions">
            <button onClick={applyFilters} className="btn btn-primary">
              Apply Filters
            </button>
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear All
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Results Section */}
        <div className="results-section">
          {loading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading optimization history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3 className="empty-title">No Optimization History</h3>
              <p className="empty-description">
                {selectedASIN 
                  ? `No optimization history found for ASIN: ${selectedASIN}`
                  : 'Start optimizing some products to see your history here.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h3 className="results-title">
                  {selectedASIN ? `History for ${selectedASIN}` : 'All Optimizations'}
                </h3>
                <span className="results-count">
                  {pagination.totalOptimizations || history.length} total
                </span>
              </div>
              
              <div className="history-list">
                {history.map(renderHistoryItem)}
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchHistory(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="btn btn-secondary pagination-btn"
                  >
                    ← Previous
                  </button>
                  
                  <span className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => fetchHistory(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="btn btn-secondary pagination-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizationHistory;