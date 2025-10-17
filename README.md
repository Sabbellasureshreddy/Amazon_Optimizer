# Amazon Product Listing Optimizer

A full-stack web application that uses AI to optimize Amazon product listings. Built with Node.js, React, MySQL, and Google's Gemini 2.0 Flash model.

## 🚀 Features

- **Product Data Fetching**: Automatically scrapes Amazon product details using ASIN
- **AI-Powered Optimization**: Uses Gemini 2.0 Flash model to generate:
  - Enhanced product titles
  - Improved bullet points
  - Optimized descriptions
  - Keyword suggestions
- **Side-by-Side Comparison**: Compare original vs optimized listings
- **Optimization History**: Track all optimizations with detailed analytics
- **Performance Dashboard**: Monitor optimization trends and success rates
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** for data persistence
- **Google Gemini 2.0 Flash** for AI optimization
- **Cheerio** for web scraping
- **Axios** for HTTP requests

### Frontend
- **React 19** with JavaScript
- **React Router** for navigation
- **CSS3** with modern styling
- **Responsive design** principles

### Database
- **MySQL** with optimized schema for:
  - Product data storage
  - Optimization history
  - Performance tracking
  - Keyword management

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MySQL** (v8 or higher)
- **Google AI Studio API Key** (Gemini)
- **Git** for cloning the repository

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Sales-Duo
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### Configure Environment Variables

Edit the `.env` file with your configurations:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=amazon_optimizer_db

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

#### Database Setup

```bash
# Create database
node models/create-database.js

# Initialize schema and seed data
node models/database-init.js
```

#### Start Backend Server

```bash
# Development mode
npm run dev

# Or production mode
npm start
```

The backend server will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend application will run on `http://localhost:3000`

## 🎯 Usage Guide

### 1. Product Optimization

1. **Enter ASIN**: Input a valid 10-character Amazon ASIN
2. **Fetch Product**: Click "Fetch Product" to retrieve product details
3. **Optimize**: Click "Optimize with AI" to generate improvements
4. **Review Results**: Compare original vs optimized versions side-by-side

### 2. Optimization History

- View all past optimizations
- Filter by ASIN, date range, or optimization score
- Track performance metrics over time

### 3. Analytics Dashboard

- Monitor optimization trends
- View score distributions
- Analyze top-performing products
- Track AI model performance

## 🔍 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Products

- **GET** `/products/:asin` - Fetch product by ASIN
- **POST** `/products/batch` - Fetch multiple products
- **GET** `/products` - List all products (paginated)

#### Optimization

- **POST** `/optimize/:asin` - Optimize product listing
- **POST** `/optimize/batch` - Batch optimize products
- **GET** `/optimize/stats` - Get optimization statistics

#### History

- **GET** `/history/:asin` - Get optimization history for ASIN
- **GET** `/history` - Get all optimization history
- **POST** `/history/:optimizationId/feedback` - Add user feedback
- **GET** `/history/analytics/trends` - Get optimization trends

### Example API Usage

```javascript
// Fetch product data
const response = await axios.get('/api/products/B08N5WRWNW');

// Optimize product
const optimization = await axios.post('/api/optimize/B08N5WRWNW');

// Get optimization history
const history = await axios.get('/api/history/B08N5WRWNW');
```

## 📊 Database Schema

### Tables

1. **products** - Store Amazon product data
2. **optimizations** - Store AI optimization results  
3. **optimization_history** - Track optimization actions
4. **keyword_tracking** - Monitor keyword performance

### Key Relationships

- Products → Optimizations (1:N)
- Optimizations → History (1:N)
- Products → Keywords (N:N)

## 🤖 AI Integration Details

### Gemini 2.0 Flash Configuration

- **Model**: `gemini-2.0-flash-exp`
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Rate Limiting**: 1-second intervals between requests
- **Token Optimization**: Efficient prompts to minimize quota usage

### Optimization Process

1. **Data Analysis**: Extract product features and context
2. **Prompt Engineering**: Create targeted prompts for each optimization type
3. **AI Generation**: Generate improvements using Gemini
4. **Quality Scoring**: Calculate optimization effectiveness scores
5. **Storage**: Save results with metadata and timestamps

### Prompt Strategy

The application uses carefully crafted prompts to:
- Maximize output quality while minimizing token usage
- Maintain brand consistency and compliance
- Focus on Amazon-specific optimization best practices
- Generate actionable keyword suggestions

## 🚨 Error Handling

### Common Issues & Solutions

#### Database Connection Errors
```bash
# Check MySQL service status
# Verify credentials in .env file
# Ensure database exists
```

#### API Rate Limits
```bash
# Gemini API quotas are managed automatically
# Built-in rate limiting prevents quota exhaustion
# Error messages guide users when limits are reached
```

#### Scraping Issues
```bash
# Amazon may block requests - use responsibly
# Built-in retry logic for temporary failures
# Graceful degradation when products are unavailable
```

## 🔒 Security Considerations

- Environment variables for sensitive data
- Input validation for ASINs and user data
- SQL injection prevention with parameterized queries
- Rate limiting to prevent abuse
- CORS configuration for secure frontend-backend communication

## 📈 Performance Optimization

- Database indexing for fast queries
- Connection pooling for MySQL
- Caching for recently fetched products
- Pagination for large datasets
- Optimized AI prompts to reduce processing time

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### API Health Check
```bash
curl http://localhost:3001/health
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up process manager (PM2 recommended)
4. Configure reverse proxy (Nginx recommended)

### Build Commands
```bash
# Backend - ready for production
npm start

# Frontend - build for production
npm run build
```

## 📝 Development Notes

### Code Structure

```
├── backend/
│   ├── config/          # Database and app configuration
│   ├── models/          # Database models and schema
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (AI, scraping)
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   └── App.js       # Main app component
│   └── public/          # Static assets
└── README.md
```

### Key Design Decisions

1. **Separation of Concerns**: Clear separation between data fetching, AI processing, and UI
2. **Scalable Architecture**: Modular design allows for easy feature additions
3. **User Experience**: Progressive enhancement with loading states and error handling
4. **Data Persistence**: Comprehensive history tracking for analytics and debugging
5. **Rate Limiting**: Respectful API usage to prevent quota exhaustion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes. Please respect Amazon's robots.txt and terms of service when using the scraping functionality.

## 🆘 Support

If you encounter any issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure MySQL server is running and accessible
4. Confirm Gemini API key has sufficient quota
5. Check network connectivity for web scraping

## 📞 Contact

For questions or support, please refer to the project documentation or create an issue in the repository.

---

**Built with ❤️ using Node.js, React, and Google Gemini AI**