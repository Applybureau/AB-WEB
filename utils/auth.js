const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./supabase');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    console.log('Token decoded:', decoded);
    
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }
    
    // Set user data from token (don't rely on database check here)
    req.user = {
      id: userId,
      userId: userId,
      email: decoded.email,
      role: decoded.role || 'client',
      full_name: decoded.full_name
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin
};