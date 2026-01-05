const pool = require('../database');

class Venue {
  /**
   * Create venue
   */
  static async create(data) {
    const {
      name,
      unit_id,
      metadata = {},
      status
    } = data;

    if (!name || !unit_id) {
      throw new Error('name and unit_id are required');
    }

    const query = `
      INSERT INTO venues (
        name,
        unit_id,
        metadata,
        status
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      unit_id,
      metadata,
      status
    ]);

    return result.rows[0];
  }

  /**
   * Get all venues
   */
  static async findAll() {
    const query = `
      SELECT 
        v.*,
        f.floor_number,
        f.name AS floor_name
      FROM venues v
      JOIN floors f ON v.floor_id = f.id
      ORDER BY v.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get venue by ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        v.*,
        f.floor_number,
        f.name AS floor_name
      FROM venues v
      JOIN floors f ON v.floor_id = f.id
      WHERE v.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update venue
   */
  static async update(id, data) {
    const {
      name,
      venue_type,
      capacity,
      amenities
    } = data;

    const query = `
      UPDATE venues
      SET
        name = COALESCE($2, name),
        venue_type = COALESCE($3, venue_type),
        capacity = COALESCE($4, capacity),
        amenities = COALESCE($5, amenities),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      name,
      venue_type,
      capacity,
      amenities
    ]);

    return result.rows[0];
  }

  /**
   * Delete venue
   */
  static async delete(id) {
    const query = `
      DELETE FROM venues
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Venue;
