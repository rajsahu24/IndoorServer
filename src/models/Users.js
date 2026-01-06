const pool = require('../database');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    const { email, password, phone, role = 'guest', name } = userData;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email,phone, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, phone, role, name, created_at',
      [email, phone, passwordHash, role, name]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, email, phone, role, name,  created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  static async updateRole(id, role) {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, phone, role, name, created_at',
      [role, id]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query('SELECT id, email, phone, role, name,  created_at FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  static async update(id, data) {
    const allowed = ['email', 'phone', 'role', 'name', 'password','building_id', 'unit_id', 'booking_id',   'metadata'];
    const entries = Object.entries(data || {}).filter(([k]) => allowed.includes(k));
    if (entries.length === 0) {
      return null;
    }

    const sets = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of entries) {
      if (key === 'password') {
        const hash = await bcrypt.hash(value, 10);
        sets.push(`password_hash = $${idx++}`);
        values.push(hash);
      } else {
        sets.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }
    values.push(id);

    const query = `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, email, phone, role, name,   created_at`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
}

module.exports = User;