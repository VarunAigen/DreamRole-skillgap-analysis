const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            tls: true,
            tlsAllowInvalidCertificates: false,
            // Connection pool — handles concurrent requests efficiently
            maxPoolSize: 20,
            minPoolSize: 5,
            // Timeouts
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            // Keep connection alive
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);

        // Graceful shutdown — close connection cleanly on process exit
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🛑 MongoDB connection closed on app termination.');
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await mongoose.connection.close();
            console.log('🛑 MongoDB connection closed on SIGTERM.');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.warn('⚠️ Server will continue running without DB. Check your MONGO_URI and Atlas IP Whitelist.');
    }
};

module.exports = connectDB;
