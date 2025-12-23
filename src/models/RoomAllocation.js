const pool = require('../database');

class RoomAllocation {
  /**
   * Create room allocation
   */
  static async create(data) {
    const {
      booking_id,
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      status = 'allocated'
    } = data;

    if (!booking_id || !guest_id || !room_id || !check_in_date || !check_out_date) {
      throw new Error('booking_id, guest_id, room_id, check_in_date and check_out_date are required');
    }

    const query = `
      INSERT INTO room_allocations
        (booking_id, guest_id, room_id, check_in_date, check_out_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      booking_id,
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      status
    ]);

    return result.rows[0];
  }

  /**
   * Get all room allocations
   */
  static async findAll() {
    const query = `
      SELECT ra.*,
             r.room_number,
             g.name AS guest_name,
             b.client_name AS booking_client
      FROM room_allocations ra
      JOIN rooms r ON ra.room_id = r.id
      JOIN guests g ON ra.guest_id = g.id
      JOIN bookings b ON ra.booking_id = b.id
      ORDER BY ra.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get allocation by ID
   */
  static async findById(id) {
    const query = `
      SELECT ra.*,
             r.room_number,
             g.name AS guest_name,
             b.client_name AS booking_client
      FROM room_allocations ra
      JOIN rooms r ON ra.room_id = r.id
      JOIN guests g ON ra.guest_id = g.id
      JOIN bookings b ON ra.booking_id = b.id
      WHERE ra.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update allocation
   */
  static async update(id, data) {
    const { check_in_date, check_out_date, status } = data;

    const query = `
      UPDATE room_allocations
      SET
        check_in_date = COALESCE($2, check_in_date),
        check_out_date = COALESCE($3, check_out_date),
        status = COALESCE($4, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      check_in_date,
      check_out_date,
      status
    ]);

    return result.rows[0];
  }

  /**
   * Delete allocation
   */
  static async delete(id) {
    const query = `
      DELETE FROM room_allocations
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = RoomAllocation;
