const pool = require('../database');

class Guest {
  /**
   * Create guest
   */
  static async create(data) {
    const {
      name,
      phone,
      email,
      guest_type,
      booking_id,
      status,
      metadata = {}
    } = data;

    const query = `
      INSERT INTO guests
        (name, phone, email, guest_type, booking_id, status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      phone,
      email,
      guest_type,
      booking_id,
      status,
      metadata
    ]);

    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT *
      FROM guests
      ORDER BY created_at ASC
    `;  
    const result = await pool.query(query);
    return result.rows;
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
    const { name, phone, email, guest_type, booking_id, status, metadata } = data;

    const query = `
      UPDATE guests
      SET
        name = COALESCE($2, name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        guest_type = COALESCE($5, guest_type),
        booking_id = COALESCE($6, booking_id),
        status = COALESCE($7, status),
        metadata = COALESCE($8, metadata),
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
      booking_id,
      status,
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

  /**
   * Bulk create guests from file data
   */
  static async bulkCreate(guestsData, booking_id) {
    const client = await pool.connect();
    const results = { successful: [], failed: [] };

    try {
      await client.query('BEGIN');

      for (const guestData of guestsData) {
        try {
          const { name, phone, email, guest_type,  metadata = {} } = guestData;
          
          if (!name) {
            throw new Error('Name is required');
          }

          const query = `
            INSERT INTO guests (name, phone, email, guest_type, booking_id, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;

          const result = await client.query(query, [name, phone, email, guest_type, booking_id, metadata]);
          results.successful.push(result.rows[0]);
        } catch (error) {
          results.failed.push({ data: guestData, error: error.message });
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return results;
  }
}

module.exports = Guest;
