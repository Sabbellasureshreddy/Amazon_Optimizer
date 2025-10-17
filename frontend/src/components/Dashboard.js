import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchTrends(selectedPeriod)
    ]);
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/optimize/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    }
  };

  const fetchTrends = async (days) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/history/analytics/trends?days=${days}`);
      setTrends(response.data);
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError('Failed to load trend data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const renderStatCard = (title, value, subtitle, icon, color = '#667eea') => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-value">{value}</div>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  const renderTrendChart = () => {
    if (!trends?.trends?.dailyOptimizations || trends.trends.dailyOptimizations.length === 0) {
      return (
        <div className="empty-chart">
          <p>No optimization data available for the selected period</p>
        </div>
      );
    }

    const maxOptimizations = Math.max(...trends.trends.dailyOptimizations.map(d => d.optimizations));
    const maxScore = Math.max(...trends.trends.dailyOptimizations.map(d => parseFloat(d.avg_score) || 0));

    return (
      <div className="trend-chart">
        <div className="chart-grid">
          {trends.trends.dailyOptimizations.slice(-14).map((day, index) => {
            const optimizationHeight = (day.optimizations / maxOptimizations) * 100;
            const scoreHeight = ((parseFloat(day.avg_score) || 0) / maxScore) * 100;
            
            return (
              <div key={day.date} className="chart-bar">
                <div className="bar-container">
                  <div 
                    className="bar optimization-bar" 
                    style={{ height: `${optimizationHeight}%` }}
                    title={`${day.optimizations} optimizations`}
                  ></div>
                  <div 
                    className="bar score-bar" 
                    style={{ 
                      height: `${scoreHeight}%`,
                      backgroundColor: getScoreColor(parseFloat(day.avg_score) || 0)
                    }}
                    title={`Avg Score: ${(parseFloat(day.avg_score) || 0).toFixed(1)}`}
                  ></div>
                </div>
                <div className="bar-label">{formatDate(day.date).split('/').slice(0, 2).join('/')}</div>
                <div className="bar-values">
                  <span className="optimization-count">{day.optimizations}</span>
                  <span className="score-avg">{(parseFloat(day.avg_score) || 0).toFixed(0)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color optimization-legend"></div>
            <span>Optimizations</span>
          </div>
          <div className="legend-item">
            <div className="legend-color score-legend"></div>
            <span>Avg Score</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h2 className="page-title">Analytics Dashboard</h2>
          <p className="page-description">
            Monitor your optimization performance and trends
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading dashboard data...</span>
          </div>
        ) : (
          <>
            {/* Period Selection */}
            <div className="period-selector">
              <label className="period-label">Time Period:</label>
              <div className="period-buttons">
                {[7, 30, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setSelectedPeriod(days)}
                    className={`period-btn ${selectedPeriod === days ? 'active' : ''}`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>

            {/* Overview Stats */}
            {trends && (
              <div className="stats-grid">
                {renderStatCard(
                  'Total Optimizations',
                  formatNumber(trends.trends.dailyOptimizations.reduce((sum, day) => sum + day.optimizations, 0)),
                  `Last ${selectedPeriod} days`,
                  '🚀',
                  '#667eea'
                )}
                
                {renderStatCard(
                  'Average Score',
                  `${(trends.trends.dailyOptimizations.reduce((sum, day) => sum + (parseFloat(day.avg_score) || 0), 0) / trends.trends.dailyOptimizations.length || 0).toFixed(1)}/100`,
                  'Optimization quality',
                  '⭐',
                  '#10b981'
                )}
                
                {renderStatCard(
                  'Unique Products',
                  formatNumber(trends.trends.topPerformingASINs?.length || 0),
                  'Products optimized',
                  '📦',
                  '#f59e0b'
                )}
                
                {renderStatCard(
                  'Best Score',
                  `${Math.max(...trends.trends.dailyOptimizations.map(d => parseFloat(d.max_score) || 0)).toFixed(0)}/100`,
                  'Highest optimization',
                  '🏆',
                  '#ef4444'
                )}
              </div>
            )}

            {/* Trends Chart */}
            <div className="chart-section">
              <div className="chart-header">
                <h3 className="chart-title">Optimization Trends</h3>
                <p className="chart-subtitle">Daily optimizations and average scores</p>
              </div>
              {renderTrendChart()}
            </div>

            {/* Score Distribution */}
            {trends?.trends?.scoreDistribution && (
              <div className="score-distribution-section">
                <h3 className="section-title">Score Distribution</h3>
                <div className="distribution-grid">
                  {trends.trends.scoreDistribution.map((range, index) => (
                    <div key={index} className="distribution-item">
                      <div className="distribution-header">
                        <span className="range-name">{range.score_range}</span>
                        <span className="range-percentage">{range.percentage}%</span>
                      </div>
                      <div className="distribution-bar">
                        <div 
                          className="distribution-fill"
                          style={{ 
                            width: `${range.percentage}%`,
                            backgroundColor: getScoreColor(
                              range.score_range.includes('Excellent') ? 90 :
                              range.score_range.includes('Good') ? 70 :
                              range.score_range.includes('Average') ? 50 : 30
                            )
                          }}
                        ></div>
                      </div>
                      <div className="distribution-count">{range.count} optimizations</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Performing ASINs */}
            {trends?.trends?.topPerformingASINs && trends.trends.topPerformingASINs.length > 0 && (
              <div className="top-asins-section">
                <h3 className="section-title">Top Performing Products</h3>
                <div className="asins-list">
                  {trends.trends.topPerformingASINs.slice(0, 5).map((asin, index) => (
                    <div key={asin.asin} className="asin-item">
                      <div className="asin-rank">#{index + 1}</div>
                      <div className="asin-info">
                        <div className="asin-code">{asin.asin}</div>
                        <div className="asin-title">{asin.title}</div>
                        <div className="asin-stats">
                          <span className="stat">Score: {(parseFloat(asin.avg_score) || 0).toFixed(1)}/100</span>
                          <span className="stat">Optimizations: {asin.optimization_count}</span>
                        </div>
                      </div>
                      <div className="asin-score">
                        <div 
                          className="score-circle"
                          style={{ borderColor: getScoreColor(parseFloat(asin.avg_score) || 0) }}
                        >
                          {(parseFloat(asin.avg_score) || 0).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Model Performance */}
            {stats?.modelUsage && stats.modelUsage.length > 0 && (
              <div className="model-performance-section">
                <h3 className="section-title">AI Model Performance</h3>
                <div className="model-grid">
                  {stats.modelUsage.map((model, index) => (
                    <div key={index} className="model-card">
                      <div className="model-header">
                        <h4 className="model-name">{model.gemini_model}</h4>
                        <div className="model-score" style={{ color: getScoreColor(parseFloat(model.avg_score) || 0) }}>
                          {(parseFloat(model.avg_score) || 0).toFixed(1)}/100
                        </div>
                      </div>
                      <div className="model-stats">
                        <div className="model-stat">
                          <span className="stat-label">Usage:</span>
                          <span className="stat-value">{model.usage_count} times</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;