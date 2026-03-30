const jwt = require('jsonwebtoken');


// ── Verify JWT ────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    const User = require('../models/User');
    const user = await User.findById(decoded.id).select('name email role is_active permissions');

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account not found or deactivated' });
    }

    // Auto-migrate legacy 'viewer' role to 'employee'
    if (user.role === 'viewer') {
      user.role = 'employee';
      await User.updateOne({ _id: user._id }, { $set: { role: 'employee' } });
    }

    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
};

// ── Role guard factory ────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  const currentRole = req.user?.role?.toLowerCase() || '';
  if (!roles.includes(currentRole)) {
    return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
  }
  next();
};

const requireSuperAdmin = requireRole('superadmin', 'super_admin');
const requireAdmin = requireRole('superadmin', 'super_admin', 'admin');
const requireManager = requireRole('superadmin', 'super_admin', 'admin', 'manager');
const requireMarketing = requireRole('superadmin', 'super_admin', 'admin', 'manager', 'marketing');
const requireStaff = requireRole('superadmin', 'super_admin', 'admin', 'manager', 'marketing', 'employee');
const requireViewer = requireStaff; // Backward compat — viewer role removed, all staff allowed
const requireSales = requireStaff; // Alias for legacy routes

module.exports = { authenticate, requireSuperAdmin, requireAdmin, requireManager, requireMarketing, requireSales, requireViewer, requireStaff, requireRole };

