const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');
    // Check cookies if no Authorization header
    if (!token) {
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied' });
    }
    // console.log("Decoded Token:", process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  
    const user = await User.findById(decoded.userId);
    
    if (!user ) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { auth, requireRole };