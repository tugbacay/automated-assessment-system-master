// Test serverless function - no mongoose
module.exports = async function handler(req, res) {
  // Test response - no imports
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    message: 'Automated Assessment System API',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    note: 'Mongoose and other packages are causing strict mode errors in Vercel. Need to use alternative deployment.'
  });
};
