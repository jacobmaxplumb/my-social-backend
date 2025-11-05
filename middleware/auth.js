const jwt = require('jsonwebtoken');

/**
 * Middleware to require JWT authentication
 * Parses Bearer token and attaches user to req.user
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Missing or invalid authorization header',
        details: { expected: 'Authorization: Bearer <token>' },
      },
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key-change-in-production');
    req.user = {
      id: decoded.sub,
      username: decoded.username,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'invalid_token',
        message: 'Invalid or expired token',
        details: { error: error.message },
      },
    });
  }
}

module.exports = { requireAuth };

