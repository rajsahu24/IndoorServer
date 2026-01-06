const pool = require('../database');

class Venue {
  /**
   * Create venue
   */
  static async create(data) {
    const {
      name,
      poi_id,
      metadata = {},
      status
    } = data;

    if (!name || !poi_id) {
      throw new Error('name and poi_id are required');
    }

    const query = `
      INSERT INTO venues (
        name,
        poi_id,
        metadata,
        status
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      poi_id,
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
        v.*
      FROM venues v
      
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
        v.*
      FROM venues v
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
      metadata,
    } = data;

    const query = `
      UPDATE venues
      SET
        name = COALESCE($2, name),
        poi_id = COALESCE($3, poi_id),
        venue_type = COALESCE($4, venue_type),
        capacity = COALESCE($5, capacity),
        metadata = COALESCE($6  , metadata),
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
