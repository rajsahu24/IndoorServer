const pool = require('../database');

class Building {
  /**
   * Create a new building
   */
  static async create(data) {
    const { name, address, metadata = {} } = data;

    const query = `
      INSERT INTO buildings (name, address, metadata)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      address,
      metadata
    ]);

    return result.rows[0];
  }

  /**
   * Get all buildings
   */
  static async findAll() {
    const query = `
      SELECT *
      FROM buildings
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get building by ID
   */
  static async findById(id) {
    const query = `
      SELECT *
      FROM buildings
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update building
   */
  static async update(id, data) {
    const { name, address, metadata } = data;

    const query = `
      UPDATE buildings
      SET
        name = COALESCE($2, name),
        address = COALESCE($3, address),
        metadata = COALESCE($4, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      name,
      address,
      metadata
    ]);

    return result.rows[0];
  }

  /**
   * Delete building
   */
  static async delete(id) {
    const query = `
      DELETE FROM buildings
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Building;
