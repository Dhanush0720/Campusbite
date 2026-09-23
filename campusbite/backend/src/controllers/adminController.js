const User = require('../models/User');
const Wallet = require('../models/Wallet');
const AuditLog = require('../models/AuditLog');

// GET /api/admin/users?role=  (admin: any role; manager: staff only, enforced by route guard below)
const listUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    // Managers may only ever see staff accounts, never admin/manager/student data
    if (req.user.role === 'manager') filter.role = 'staff';

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/users  (admin creates manager/staff; manager creates staff only)
const createStaffUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, and role are required' });
    }

    const allowedRolesByActor = {
      admin: ['manager', 'staff'],
      manager: ['staff'],
    };
    const allowed = allowedRolesByActor[req.user.role] || [];
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: `You are not permitted to create a ${role} account` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, passwordHash: password, role, phone });
    await Wallet.create({ userId: user._id, balance: 0 });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'STAFF_USER_CREATED',
      entityType: 'User',
      entityId: user._id,
      metadata: { role },
    });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id  (admin: any user; manager: staff only) - toggle isActive or change role
const updateUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (req.user.role === 'manager' && target.role !== 'staff') {
      return res.status(403).json({ message: 'Managers may only manage staff accounts' });
    }

    const { isActive, role } = req.body;
    if (isActive !== undefined) target.isActive = isActive;
    if (role !== undefined && req.user.role === 'admin') target.role = role;

    await target.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: target._id,
      metadata: { isActive, role },
    });

    res.json({ user: target });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, createStaffUser, updateUser };
