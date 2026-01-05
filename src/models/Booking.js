const pool = require('../database');

class Booking {
  static async create(data) {
    const {
      building_id,
      booking_category,
      host_id,
      host_name,
      host_email,
      host_phone,
      host_metadata = {},
      start_date,
      end_date,
      guest_count,
      status = 'confirmed',
      metadata = {}
    } = data;

    const query = `
      INSERT INTO bookings (
        building_id, booking_category, host_id, host_name, host_email, host_phone,
        host_metadata, start_date, end_date, guest_count, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await pool.query(query, [
      building_id, booking_category, host_id, host_name, host_email, host_phone,
      JSON.stringify(host_metadata), start_date, end_date, guest_count, status,
      JSON.stringify(metadata)
    ]);
    return result.rows[0];
  }



  static async findAll() {
    const query = `
      SELECT b.*, bd.name as building_name
      FROM bookings b
      LEFT JOIN buildings bd ON b.building_id = bd.id
      ORDER BY b.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }



  
  static async findById(id) {
    const query = `
      SELECT b.*, bd.name as building_name
      FROM bookings b
      LEFT JOIN buildings bd ON b.building_id = bd.id
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
      building_id,
      booking_category,
      host_id,
      host_name,
      host_email,
      host_phone,
      host_metadata,
      start_date,
      end_date,
      guest_count,
      status,
      metadata
    } = data;

    const query = `
      UPDATE bookings
      SET
        building_id = COALESCE($2, building_id),
        booking_category = COALESCE($3, booking_category),
        host_id = COALESCE($4, host_id),
        host_name = COALESCE($5, host_name),
        host_email = COALESCE($6, host_email),
        host_phone = COALESCE($7, host_phone),
        host_metadata = COALESCE($8, host_metadata),
        start_date = COALESCE($9, start_date),
        end_date = COALESCE($10, end_date),
        guest_count = COALESCE($11, guest_count),
        status = COALESCE($12, status),
        metadata = COALESCE($13, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      building_id,
      booking_category,
      host_id,
      host_name,
      host_email,
      host_phone,
      host_metadata ? JSON.stringify(host_metadata) : null,
      start_date,
      end_date,
      guest_count,
      status,
      metadata ? JSON.stringify(metadata) : null
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