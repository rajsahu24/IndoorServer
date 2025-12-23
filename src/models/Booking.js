const pool = require('../database');

class Booking {
  static async create(data) {
    const { hotel_id, booking_type, client_name, client_contact, start_date, end_date, guest_count, metadata } = data;
    const query = `
      INSERT INTO bookings (hotel_id, booking_type, client_name, client_contact, start_date, end_date, guest_count, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [hotel_id, booking_type, client_name, client_contact, start_date, end_date, guest_count, metadata]);
    return result.rows[0];
  }



  static async findAll() {
    const query = `
      SELECT b.*, h.name as hotel_name
      FROM bookings b
      JOIN hotels h ON b.hotel_id = h.id
      ORDER BY b.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }



  
  static async findById(id) {
    const query = `
      SELECT b.*, h.name as hotel_name
      FROM bookings b
      JOIN hotels h ON b.hotel_id = h.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async bulkCreateGuests(booking_id, guests) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertedGuests = [];
      for (const guest of guests) {
        const query = `
          INSERT INTO guests (booking_id, name, phone, email, guest_type, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const result = await client.query(query, [
          booking_id, guest.name, guest.phone, guest.email, guest.guest_type || 'guest', guest.metadata || {}
        ]);
        insertedGuests.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return insertedGuests;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id, data) {
    const {
      booking_type,
      client_name,
      client_contact,
      start_date,
      end_date,
      guest_count,
      status,
      metadata
    } = data;

    const query = `
      UPDATE bookings
      SET
        booking_type = COALESCE($2, booking_type),
        client_name = COALESCE($3, client_name),
        client_contact = COALESCE($4, client_contact),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        guest_count = COALESCE($7, guest_count),
        status = COALESCE($8, status),
        metadata = COALESCE($9, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      booking_type,
      client_name,
      client_contact,
      start_date,
      end_date,
      guest_count,
      status,
      metadata
    ]);

    return result.rows[0];
  }

  /**
   * Delete booking
   */
  static async delete(id) {
    const query = `
      DELETE FROM bookings
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Booking;