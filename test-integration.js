const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_ASIN = 'B08N5WRWNW'; // Echo Dot ASIN for testing

async function testCompleteFlow() {
    console.log('🧪 Starting Complete Integration Test\n');
    
    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing API Health Check...');
        const healthResponse = await axios.get('http://localhost:3001/health');
        console.log('✅ Health Check:', healthResponse.data.status);
        console.log('');

        // Test 2: Fetch Product Data
        console.log('2️⃣ Testing Product Data Fetching...');
        const productResponse = await axios.get(`${API_BASE_URL}/products/${TEST_ASIN}`);
        console.log('✅ Product fetched successfully');
        console.log('📦 Title:', productResponse.data.title?.substring(0, 60) + '...');
        console.log('💰 Price:', productResponse.data.price || 'N/A');
        console.log('⭐ Rating:', productResponse.data.rating || 'N/A');
        console.log('');

        // Test 3: AI Optimization
        console.log('3️⃣ Testing AI Optimization...');
        const optimizationResponse = await axios.post(`${API_BASE_URL}/optimize/${TEST_ASIN}`, {}, {
            timeout: 60000 // 60 seconds for AI processing
        });
        console.log('✅ AI Optimization completed');
        console.log('📊 Optimization Score:', optimizationResponse.data.optimizationScore + '/100');
        console.log('🎯 Enhanced Title:', optimizationResponse.data.optimized?.title?.substring(0, 60) + '...');
        console.log('🔑 Keywords:', optimizationResponse.data.optimized?.suggestedKeywords?.join(', '));
        console.log('');

        // Test 4: History Retrieval
        console.log('4️⃣ Testing Optimization History...');
        const historyResponse = await axios.get(`${API_BASE_URL}/history/${TEST_ASIN}`);
        console.log('✅ History retrieved successfully');
        console.log('📈 History Count:', historyResponse.data.history?.length || 0);
        console.log('');

        // Test 5: Analytics Dashboard Data
        console.log('5️⃣ Testing Analytics Data...');
        const statsResponse = await axios.get(`${API_BASE_URL}/optimize/stats`);
        console.log('✅ Analytics data retrieved');
        console.log('📊 Total Optimizations:', statsResponse.data.optimizationStats?.length || 0);
        console.log('');

        // Test 6: Trends Analytics
        console.log('6️⃣ Testing Trends Analytics...');
        const trendsResponse = await axios.get(`${API_BASE_URL}/history/analytics/trends?days=30`);
        console.log('✅ Trends data retrieved');
        console.log('📈 Daily Trends Count:', trendsResponse.data.trends?.dailyOptimizations?.length || 0);
        console.log('');

        console.log('🎉 ALL TESTS PASSED! Integration is working correctly.');
        console.log('');
        console.log('🌐 Frontend URL: http://localhost:3000');
        console.log('🔧 Backend URL: http://localhost:3001');
        console.log('📊 Health Check: http://localhost:3001/health');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('🔧 Make sure the backend server is running on http://localhost:3001');
        } else if (error.code === 'ECONNABORTED') {
            console.log('⏱️ Request timeout - AI optimization may take longer than expected');
        } else if (error.response) {
            console.log('📊 Response Status:', error.response.status);
            console.log('📝 Response Data:', error.response.data);
        }
        
        process.exit(1);
    }
}

// Helper function to test individual endpoints
async function testEndpoint(method, url, data = null, timeout = 10000) {
    try {
        const config = { timeout };
        let response;
        
        switch (method.toUpperCase()) {
            case 'GET':
                response = await axios.get(url, config);
                break;
            case 'POST':
                response = await axios.post(url, data, config);
                break;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
        
        return response;
    } catch (error) {
        throw error;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testCompleteFlow();
}

module.exports = {
    testCompleteFlow,
    testEndpoint
};