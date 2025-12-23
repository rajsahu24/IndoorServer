const pool = require('../database');

class Unit {
  static async create(data) {
    const { name, category, level_id, metadata, show, display_point, accessibility, restriction, geometry } = data;
    const query = `
      INSERT INTO units (name, category, level_id, metadata, show, display_point, accessibility, restriction, geometry)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_GeomFromGeoJSON($9))
      RETURNING id, name, category, level_id, area, metadata, show, display_point, accessibility, restriction,
                ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [name, category, level_id, metadata, show, display_point, accessibility, restriction, JSON.stringify(geometry)]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT id, name, category, level_id, area, metadata, show, display_point, accessibility, restriction,
             ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
      FROM units ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, name, category, level_id, area, metadata, show, display_point, accessibility, restriction,
             ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
      FROM units WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, category, level_id, metadata, show, display_point, accessibility, restriction, geometry } = data;
    const query = `
      UPDATE units 
      SET name = $2, category = $3, level_id = $4, metadata = $5, show = $6, 
          display_point = $7, accessibility = $8, restriction = $9, geometry = ST_GeomFromGeoJSON($10)
      WHERE id = $1
      RETURNING id, name, category, level_id, area, metadata, show, display_point, accessibility, restriction,
                ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [id, name, category, level_id, metadata, show, display_point, accessibility, restriction, JSON.stringify(geometry)]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM units WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Unit;