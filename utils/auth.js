const jwt = require('jsonwebtoken');
const { supabase } = require('./supabase');

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
    
    // Verify user exists in database
    const { data: user, error } = await supabase
      .from('clients')
      .select('id, email, role')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
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