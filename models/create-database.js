const mysql = require('mysql2/promise');
require('dotenv').config();

const createDatabaseIfNotExists = async () => {
    let connection;
    try {
        console.log('🔧 Creating database if it doesn\'t exist...');
        
        // Connect without specifying database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD
        });
        
        // Create database
        const dbName = process.env.DB_NAME || 'amazon_optimizer_db';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' created/verified successfully`);
        
        return true;
    } catch (error) {
        console.error('❌ Error creating database:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Run if this file is executed directly
if (require.main === module) {
    createDatabaseIfNotExists()
        .then(() => {
            console.log('🎉 Database setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Database setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = { createDatabaseIfNotExists };