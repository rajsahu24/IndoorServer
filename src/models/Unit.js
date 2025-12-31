const pool = require('../database');

class Unit {
  static async create(data) {
    const { name,  floor_id, metadata,  geom, building_id, feature_type } = data;
    const query = `
      INSERT INTO units (name,  floor_id, metadata,  geom, building_id,feature_type)
      VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4), $5,$6)
      RETURNING id, name,  floor_id,  metadata, building_id,
                ST_AsGeoJSON(geometry) as geom, created_at, updated_at
    `;
    const result = await pool.query(query, [name, floor_id, metadata, JSON.stringify(geom), building_id, feature_type]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT id, name,  floor_id, metadata, building_id,
             ST_AsGeoJSON(geometry) as geom, feature_type, created_at, updated_at
      FROM units ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, name,  floor_id,  metadata, building_id,feature_type,
             ST_AsGeoJSON(geometry) as geom, created_at, updated_at
      FROM units WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, floor_id, metadata,  geom, building_id} = data;
    const query = `
      UPDATE units 
      SET name = $2, floor_id = $3, metadata = $4, 
          building_id = $5, feature_type = $6, geometry = ST_GeomFromGeoJSON($7)
      WHERE id = $1
      RETURNING id, name, floor_id, metadata, building_id,
                ST_AsGeoJSON(geometry) as geom, feature_type, created_at, updated_at
    `;
    const result = await pool.query(query, [id, name, floor_id, metadata, building_id, feature_type
      , JSON.stringify(geom)]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM units WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Unit;