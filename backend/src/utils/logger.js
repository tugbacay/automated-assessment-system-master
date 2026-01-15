// Simple logger compatible with Vercel serverless environment
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Simple logging functions
const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `${timestamp} [${level}]: ${message}`;
};

export const logger = {
  info: (message) => {
    console.log(formatMessage('INFO', message));
  },

  error: (message) => {
    console.error(formatMessage('ERROR', message));
  },

  warn: (message) => {
    console.warn(formatMessage('WARN', message));
  },

  debug: (message) => {
    if (!isProduction) {
      console.log(formatMessage('DEBUG', message));
    }
  },

  // Stream object for Morgan HTTP logger
  stream: {
    write: (message) => {
      console.log(formatMessage('INFO', message.trim()));
    },
  },
};

export default logger;
