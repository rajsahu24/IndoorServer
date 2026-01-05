const pool = require('../database');

class POI {
  static async create(data) {
    const { name, category, floor_id, building_id, metadata, geom } = data;
    const query = `
      INSERT INTO pois (name, category, floor_id, building_id, metadata, geom)
      VALUES ($1, $2, $3, $4, $5, ST_GeomFromGeoJSON($6))
      RETURNING id, name, category, floor_id, building_id, metadata,
                ST_AsGeoJSON(geom) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [name, category, floor_id, building_id, metadata, JSON.stringify(geom)]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT p.id, p.name, p.category, f.name as floor_name, p.building_id, p.metadata,
             ST_AsGeoJSON(p.geom) as geometry, p.created_at, p.updated_at
      FROM pois as p
      INNER JOIN floors as f on p.floor_id = f.id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT p.id, p.name, p.category, f.name as floor_name, p.building_id, p.metadata,
             ST_AsGeoJSON(p.geom) as geometry, p.created_at, p.updated_at
      FROM pois as p
      INNER JOIN floors as f on p.floor_id = f.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    console.log(data);
    const { name, category, floor_id, building_id, metadata } = data.properties;
    const geom = data.geometry;
    const query = `
      UPDATE pois 
      SET name = $2, category = $3, floor_id = $4, building_id = $5, metadata = $6, geom = ST_GeomFromGeoJSON($7)
      WHERE id = $1
      RETURNING id, name, category, floor_id, building_id, metadata,
                ST_AsGeoJSON(geom) as geometry, created_at, updated_at
    `;
    const result = await pool.query(query, [id, name, category, floor_id, building_id, metadata, JSON.stringify(geom)]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM pois WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = POI;