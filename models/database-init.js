const { createDatabase, seedTestData } = require('./database-schema');

const initializeDatabase = async () => {
    try {
        console.log('🚀 Initializing database...');
        
        await createDatabase();
        await seedTestData();
        
        console.log('🎉 Database initialization completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    }
};

// Run if this file is executed directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };