const pool = require('../database');

class Floor {
  /**
   * Create floor
   */
  static async create(data) {
    const {
      building_id,
      floor_number,
      name,
      metadata = {}
    } = data;

    if (!building_id || !floor_number) {
      throw new Error('building_id and floor_number are required');
    }

    const query = `
      INSERT INTO floors (building_id, floor_number, name, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      building_id,
      floor_number,
      name,
      metadata
    ]);

    return result.rows[0];
  }

  /**
   * Get all floors
   */
  static async findAll() {
    const query = `
      SELECT f.*, b.name AS building_name
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      ORDER BY f.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get floor by ID
   */
  static async findById(id) {
    const query = `
      SELECT f.*, b.name AS building_name
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      WHERE f.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update floor
   */
  static async update(id, data) {
    const { floor_number, name, metadata } = data;

    const query = `
      UPDATE floors
      SET
        floor_number = COALESCE($2, floor_number),
        name = COALESCE($3, name),
        metadata = COALESCE($4, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      floor_number,
      name,
      metadata
    ]);

    return result.rows[0];
  }

  /**
   * Delete floor
   */
  static async delete(id) {
    const query = `
      DELETE FROM floors
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Floor;
