const pool = require('../database');

class Guest {
  /**
   * Create guest
   */
  static async create(data) {
    const {
      booking_id,
      name,
      phone,
      email,
      guest_type = 'guest',
      metadata = {}
    } = data;

    if (!booking_id || !name) {
      throw new Error('booking_id and name are required');
    }

    const query = `
      INSERT INTO guests
        (booking_id, name, phone, email, guest_type, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      booking_id,
      name,
      phone,
      email,
      guest_type,
      metadata
    ]);

    return result.rows[0];
  }

  /**
   * Get guests by booking
   */
  static async findByBooking(booking_id) {
    const query = `
      SELECT *
      FROM guests
      WHERE booking_id = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [booking_id]);
    return result.rows;
  }

  /**
   * Get guest by ID
   */
  static async findById(id) {
    const query = `
      SELECT *
      FROM guests
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update guest
   */
  static async update(id, data) {
    const { name, phone, email, guest_type, metadata } = data;

    const query = `
      UPDATE guests
      SET
        name = COALESCE($2, name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        guest_type = COALESCE($5, guest_type),
        metadata = COALESCE($6, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      name,
      phone,
      email,
      guest_type,
      metadata
    ]);

    return result.rows[0];
  }

  /**
   * Delete guest
   */
  static async delete(id) {
    const query = `
      DELETE FROM guests
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Guest;
