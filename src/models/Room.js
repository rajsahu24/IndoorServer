const pool = require('../database');

class Room {
  static async create(data) {
    const { room_number, floor_id, unit_id, room_type, capacity, amenities } = data;
    const query = `
      INSERT INTO rooms (room_number, floor_id, unit_id, room_type, capacity, amenities)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [room_number, floor_id, unit_id, room_type, capacity, amenities]);
    return result.rows[0];
  }

  static async findByFloor(floor_id) {
    const query = `
      SELECT r.*, u.name as unit_name, ST_AsGeoJSON(u.geometry) as unit_geometry
      FROM rooms r
      JOIN units u ON r.unit_id = u.id
      WHERE r.floor_id = $1
      ORDER BY r.room_number
    `;
    const result = await pool.query(query, [floor_id]);
    return result.rows;
  }

  static async allocateToGuest(data) {
    const { booking_id, guest_id, room_id, check_in_date, check_out_date } = data;
    const query = `
      INSERT INTO room_allocations (booking_id, guest_id, room_id, check_in_date, check_out_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [booking_id, guest_id, room_id, check_in_date, check_out_date]);
    return result.rows[0];
  }

  static async getGuestRoom(guest_id) {
    const query = `
      SELECT r.*, u.name as unit_name, ST_AsGeoJSON(u.geometry) as unit_geometry,
             ra.check_in_date, ra.check_out_date
      FROM room_allocations ra
      JOIN rooms r ON ra.room_id = r.id
      JOIN units u ON r.unit_id = u.id
      WHERE ra.guest_id = $1 AND ra.status = 'allocated'
    `;
    const result = await pool.query(query, [guest_id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT r.*
      FROM rooms r
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }


  static async findById(id) {
    const query = `
      SELECT r.*
      FROM rooms r
      WHERE r.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }


  static async update(id, data) {
    const {
      room_number,
      room_type,
      capacity,
      amenities,
      status
    } = data;

    const query = `
      UPDATE rooms
      SET
        room_number = COALESCE($2, room_number),
        room_type = COALESCE($3, room_type),
        capacity = COALESCE($4, capacity),
        amenities = COALESCE($5, amenities),
        status = COALESCE($6, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      room_number,
      room_type,
      capacity,
      amenities,
      status
    ]);

    return result.rows[0];
  }


  static async delete(id) {
    const query = `
      DELETE FROM rooms
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Room;