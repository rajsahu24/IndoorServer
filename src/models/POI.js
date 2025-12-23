const pool = require('../database');

class POI {
  static async create(data) {
    const { name, type, floor, building_id, metadata, geometry } = data;
    const query = `
      INSERT INTO pois (name, type, floor, building_id, metadata, geometry)
      VALUES ($1, $2, $3, $4, $5, ST_GeomFromGeoJSON($6))
      RETURNING id, name, type, floor, building_id, metadata,
                ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [name, type, floor, building_id, metadata, JSON.stringify(geometry)]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT id, name, type, floor, building_id, metadata,
             ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
      FROM pois ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, name, type, floor, building_id, metadata,
             ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
      FROM pois WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, type, floor, building_id, metadata, geometry } = data;
    const query = `
      UPDATE pois 
      SET name = $2, type = $3, floor = $4, building_id = $5, metadata = $6, geometry = ST_GeomFromGeoJSON($7)
      WHERE id = $1
      RETURNING id, name, type, floor, building_id, metadata,
                ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [id, name, type, floor, building_id, metadata, JSON.stringify(geometry)]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM pois WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = POI;