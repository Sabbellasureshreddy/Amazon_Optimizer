# Amazon Product Listing Optimizer

An AI-powered web application that optimizes Amazon product listings using Google's Gemini 2.0 Flash model. This tool helps Amazon sellers improve their product titles, bullet points, descriptions, and keyword strategies.

## 🚀 Features

- **AI-Powered Optimization**: Uses Google Gemini 2.0 Flash to enhance product listings
- **ASIN-Based Product Fetching**: Automatically scrapes Amazon product data
- **Side-by-Side Comparison**: Compare original vs optimized content
- **Analytics Dashboard**: Track optimization performance and trends
- **History Tracking**: Complete audit trail of all optimizations
- **Keyword Suggestions**: AI-generated keywords for better SEO
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Custom responsive styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Database for data persistence
- **Google Gemini AI** - AI optimization engine
- **Cheerio** - Web scraping for Amazon data

## 📊 Database Schema

```sql
- products: Store Amazon product data
- optimizations: AI-generated improvements
- optimization_history: Complete audit trail
- keyword_tracking: SEO keyword performance
```

## 🎯 How It Works

1. **Enter ASIN**: Input any Amazon product ASIN
2. **Fetch Product**: System retrieves product details from Amazon
3. **AI Optimization**: Gemini AI analyzes and optimizes the content
4. **Compare Results**: View original vs optimized content side-by-side
5. **Track Performance**: Monitor optimization history and analytics

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Sabbellasureshreddy/Amazon_Optimizer.git
cd Amazon_Optimizer
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env file with:
REACT_APP_API_URL=http://localhost:3001/api
```

4. **Start the development server**
```bash
npm start
```

The application will open at `http://localhost:3000`

## 📈 Analytics & Reporting

The application provides comprehensive analytics:

- **Daily Trends**: Track optimizations over time
- **Score Distribution**: Analyze optimization quality
- **Product Performance**: Monitor top-performing ASINs
- **Model Comparison**: Compare AI model effectiveness
- **Historical Analysis**: Long-term performance insights

## 🎯 Use Cases

- **Amazon Sellers**: Improve product listing performance
- **E-commerce Agencies**: Optimize client product pages
- **Marketing Teams**: Enhance product descriptions and keywords
- **Content Writers**: Generate compelling product copy
- **SEO Specialists**: Research and implement keyword strategies

## 👨‍💻 Author

**Sabbella Suresh Reddy**
- GitHub: [@Sabbellasureshreddy](https://github.com/Sabbellasureshreddy)

## 🙏 Acknowledgments

- Google Gemini AI for powerful optimization capabilities
- React team for the excellent frontend framework
- Express.js for the robust backend framework
- MySQL for reliable data persistence

---

⭐ **Star this repository if you found it helpful!**
