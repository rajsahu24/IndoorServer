const pool = require('../database');

class Route {
  static async create(data) {
    const { from_poi_id, to_poi_id, level_id, geometry } = data;
    const query = `
      INSERT INTO routes (from_poi_id, to_poi_id, level_id, geometry)
      VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4))
      RETURNING id, from_poi_id, to_poi_id, level_id, distance,
                ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [from_poi_id, to_poi_id, level_id, JSON.stringify(geometry)]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT id, from_poi_id, to_poi_id, level_id, distance,
             ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
      FROM routes ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, from_poi_id, to_poi_id, level_id, distance,
             ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
      FROM routes WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { from_poi_id, to_poi_id, level_id, geometry } = data;
    const query = `
      UPDATE routes 
      SET from_poi_id = $2, to_poi_id = $3, level_id = $4, geometry = ST_GeomFromGeoJSON($5)
      WHERE id = $1
      RETURNING id, from_poi_id, to_poi_id, level_id, distance,
                ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [id, from_poi_id, to_poi_id, level_id, JSON.stringify(geometry)]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM routes WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Route;