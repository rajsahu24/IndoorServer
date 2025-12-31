const User = require('../models/Users');
const jwt = require('jsonwebtoken');

const authController = {
  async register(req, res) {
    try {
      const { email,phone, password, role, name } = req.body;
      
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const user = await User.create({ email, password, phone, role, name });
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });
      
      res.status(201).json({ user, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const user = await User.findByEmail(email);
      if (!user ) {
        return res.status(401).json({ error: 'Invalid email' });
      }
      console.log(user);
      const isValid = await User.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUsers(req, res) {
    try {
      const users = await User.getAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      const user = await User.updateRole(id, role);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUserPut(req, res) {
    try {
      const { id } = req.params;
      const allowed = ['email', 'phone', 'role', 'name', 'is_active', 'password'];
      const hasValid = Object.keys(req.body || {}).some(k => allowed.includes(k));
      if (!hasValid) {
        return res.status(400).json({ error: 'No valid fields provided' });
      }

      const updated = await User.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUserPatch(req, res) {
    try {
      const { id } = req.params;
      const allowed = ['email', 'phone', 'role', 'name', 'is_active', 'password'];
      const hasValid = Object.keys(req.body || {}).some(k => allowed.includes(k));
      if (!hasValid) {
        return res.status(400).json({ error: 'No valid fields provided' });
      }

      const updated = await User.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async logout(req, res) {
    try {
      res.clearCookie('token');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController;