import app from './app.js';
import connectDatabase from './config/database.js';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set port
const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Documentation: http://localhost:${PORT}/api`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (error) => {
      logger.error(`Unhandled Rejection: ${error.message}`);
      logger.error(error.stack);

      // Close server & exit process
      server.close(() => {
        logger.info('Server closed due to unhandled rejection');
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Closing server gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Closing server gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Start the server
startServer();
