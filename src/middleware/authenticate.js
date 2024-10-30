const jwt = require('jsonwebtoken');
const logger = require('pino')();

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

  if (!token) {
    // No token provided, deny access
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decodedToken.userId };
    logger.info('req,user:', req.user);
    next();
  } catch (error) {
    // Token is invalid, deny access
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
