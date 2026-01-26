const pool = require('../database');
const { nanoid } = require('nanoid');

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
      invitation_id,
      rsvp_token = nanoid(10),
      status,
      metadata = {}
    } = data;

    const query = `
      INSERT INTO guests
        (name, phone, email, guest_type, booking_id, invitation_id, rsvp_token, status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      phone,
      email,
      guest_type,
      booking_id,
      invitation_id,
      rsvp_token,
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
   * Get guests by invitation
   */
  static async findByInvitation(invitation_id) {
    const query = `
      SELECT *
      FROM guests
      WHERE invitation_id = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [invitation_id]);
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
        invitation_id = COALESCE($7, invitation_id),
        rsvp_token = COALESCE($8, rsvp_token),
        status = COALESCE($9, status),
        metadata = COALESCE($10, metadata),
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
      invitation_id,
      rsvp_token,
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
  static async bulkCreate(guestsData, booking_id, invitation_id ) {
    const client = await pool.connect();
    
    const results = { successful: [], failed: [] };
 
   
    try {
      await client.query('BEGIN');

      for (const guestData of guestsData) {
        try {
          const { name, phone, email, guest_type, invitation_id, booking_id, metadata = {} } = guestData;
          
          if (!name) {
            throw new Error('Name is required');
          }

          const query = `
            INSERT INTO guests (name, phone, email, guest_type, booking_id, invitation_id, rsvp_token, status, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `;

        const result = await client.query(query, [name, phone, email, guest_type, booking_id, invitation_id, nanoid(10), 0, metadata]);
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
