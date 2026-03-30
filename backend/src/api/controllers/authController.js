const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { log } = require('../../services/activityService');
const logger = require('../../config/logger');

const signToken = (user) => jwt.sign(
  { id: user._id || user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
);

// POST /auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Try finding in DB
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nexlead.io';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    let isEnvAdminMatch = false;

    // Super Admin login check (via .env)
    if (email.toLowerCase().trim() === adminEmail.toLowerCase() && password === adminPass) {
      isEnvAdminMatch = true;
      if (!user) {
        // Create super admin in DB if missing (or return a token for it)
        try {
          const hash = await bcrypt.hash(adminPass, 12);
          user = await User.create({
            name: 'Super Admin',
            email: adminEmail.toLowerCase(),
            password_hash: hash,
            role: 'super_admin',
            is_active: true
          });
        } catch (e) {
          // If creation fails (e.g. race condition), try finding it again
          user = await User.findOne({ email: adminEmail.toLowerCase() });
          if (!user) {
            // DB is having issues or creation failed
            return res.status(500).json({ error: 'Database error preventing super admin initial creation' });
          }
        }
      } else {
        // Force the .env admin to always be a super_admin and sync password hash if changed in .env
        const hash = await bcrypt.hash(adminPass, 12);
        user = await User.findOneAndUpdate(
          { email: adminEmail.toLowerCase() },
          { $set: { role: 'super_admin', password_hash: hash } },
          { new: true }
        );
      }
    }

    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials' });

    if (!isEnvAdminMatch) {
      try {
        if (!await bcrypt.compare(password, user.password_hash)) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (err) {
        logger.warn('Bcrypt compare failed:', err.message);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    user.last_login = new Date();
    await user.save().catch(() => { });

    // Best effort logging
    log({ userId: user._id, action: 'login', entityType: 'user', entityId: user._id, req }).catch(() => { });

    res.json({
      token: signToken(user),
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /auth/logout
const logout = async (req, res) => {
  try {
    await log({ userId: req.user.id, action: 'logout', entityType: 'user', entityId: req.user.id, req }).catch(() => { });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('[Auth] Logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /auth/me
const me = (req, res) => res.json({ user: req.user });

// POST /auth/users  (Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, role = 'employee' } = req.body;
    let { password } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

    // Auto-generate password if not provided
    const isAutoPass = !password;
    if (isAutoPass) {
        const crypto = require('crypto');
        password = crypto.randomBytes(8).toString('hex') + '!Ab1';
    } else {
        if (password.length < 8 || !/\d/.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and contain a number' });
        }
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hash,
      role
    });

    // Mock sending email
    logger.info(`[Auth] User created: ${email} | Role: ${role} | Password: [REDACTED/SENT_VIA_EMAIL]`);
    // In production, trigger NodeMailer here

    await log({
      userId: req.user.id, action: 'create', entityType: 'user', entityId: user._id,
      metadata: { name, email, role, auto_password: isAutoPass }, req
    });

    res.status(201).json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, is_active: user.is_active, created_at: user.created_at } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /auth/users  (Admin)
const listUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'leads',
          localField: '_id',
          foreignField: 'added_by',
          as: 'leads'
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          name: 1,
          email: 1,
          role: 1,
          is_active: 1,
          created_at: 1,
          last_login: 1,
          leads_count: { $size: '$leads' }
        }
      },
      { $sort: { created_at: -1 } }
    ]);
    res.json({ users });
  } catch { res.status(500).json({ error: 'Server error' }); }
};

// PATCH /auth/users/:id  (Admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, role } = req.body;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot modify own account' });

    const updateData = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'Nothing to update' });

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('name email role is_active');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, is_active: user.is_active } });
  } catch { res.status(500).json({ error: 'Server error' }); }
};

// DELETE /auth/users/:id  (Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete own account' });
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
};

module.exports = { login, logout, me, createUser, listUsers, updateUser, deleteUser };
