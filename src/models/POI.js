const pool = require('../database');

class POI {
  static async create(data) {
    const { name, category, floor_id,  metadata, geom } = data;
    const query = `
      INSERT INTO pois (name, category, floor_id, metadata, geom)
      VALUES ($1, $2, $3, $4, ST_GeomFromGeoJSON($5))
      RETURNING id, name, category, floor_id, hotel_id, metadata,
                ST_AsGeoJSON(geom) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [name, category, floor_id, metadata, JSON.stringify(geom)]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT id, name, category, floor_id, metadata,
             ST_AsGeoJSON(geom) as geometry, created_at, updated_at
      FROM pois ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, name, category, floor_id, metadata,
             ST_AsGeoJSON(geom) as geometry, created_at, updated_at
      FROM pois WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, category, floor_id, metadata, geom } = data;
    const query = `
      UPDATE pois 
      SET name = $2, category = $3, floor_id = $4, metadata = $5, geom = ST_GeomFromGeoJSON($6)
      WHERE id = $1
      RETURNING id, name, category, floor_id, metadata,
                ST_AsGeoJSON(geom) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [id, name, category, floor_id, metadata, JSON.stringify(geom)]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM pois WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = POI;