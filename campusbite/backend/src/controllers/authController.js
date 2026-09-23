const User = require('../models/User');
const Wallet = require('../models/Wallet');
const generateToken = require('../utils/generateToken');

const PUBLIC_SELF_REGISTER_ROLES = ['student', 'lecturer', 'guest'];

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Never trust the client to assign itself a privileged role
    const safeRole = PUBLIC_SELF_REGISTER_ROLES.includes(role) ? role : 'student';

    const user = await User.create({
      name,
      email,
      passwordHash: password, // hashed by the User pre-save hook
      role: safeRole,
      studentId: studentId || undefined,
      phone,
    });

    await Wallet.create({ userId: user._id, balance: 0 });

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
