const pool = require('../database');

class Event {
  static async create(data) {
    const { booking_id, name, event_type, venue_id, start_time, end_time, description, metadata } = data;
    const query = `
      INSERT INTO events (booking_id, name, event_type, venue_id, start_time, end_time, description, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [booking_id, name, event_type, venue_id, start_time, end_time, description, metadata]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT *
      FROM events
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async delete(event_id) {
    const query = `
      DELETE FROM events
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [event_id]);
    return result.rows[0];
  }

  static async update(event_id, data) {
    const { name, event_type, venue_id, start_time, end_time, description, metadata } = data;
    const query = `
      UPDATE events
      SET name = $1, event_type = $2, venue_id = $3, start_time = $4, end_time = $5, description = $6, metadata = $7
      WHERE id = $8
      RETURNING *
    `;
    const result = await pool.query(query, [name, event_type, venue_id, start_time, end_time, description, metadata, event_id]);
    return result.rows[0];
  }

  static async assignGuests(event_id, guest_ids) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const assignments = [];
      for (const guest_id of guest_ids) {
        const query = `
          INSERT INTO guest_events (guest_id, event_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          RETURNING *
        `;
        const result = await client.query(query, [guest_id, event_id]);
        if (result.rows[0]) assignments.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return assignments;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getById(event_id) {
    const query = `
      SELECT *  FROM events
      WHERE id = $1
    `;
    const result = await pool.query(query, [event_id]);
    return result.rows[0];
  }

  static async getEventWithVenue(event_id) {
    const query = `
      SELECT e.*, v.name as venue_name, u.name as unit_name, 
             ST_AsGeoJSON(u.geometry) as venue_geometry
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      JOIN units u ON v.unit_id = u.id
      WHERE e.id = $1
    `;
    const result = await pool.query(query, [event_id]);
    return result.rows[0];
  }



  
  static async getGuestEvents(guest_id) {
    const query = `
      SELECT e.*, v.name as venue_name, u.name as unit_name, u.id as unit_id,
             ST_AsGeoJSON(u.geometry) as venue_geometry, ge.attendance_status
      FROM guest_events ge
      JOIN events e ON ge.event_id = e.id
      JOIN venues v ON e.venue_id = v.id
      JOIN units u ON v.unit_id = u.id
      WHERE ge.guest_id = $1
      ORDER BY e.start_time
    `;
    const result = await pool.query(query, [guest_id]);
    return result.rows;
  }
}

module.exports = Event;