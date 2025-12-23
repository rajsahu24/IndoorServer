const pool = require('../database');

class Hotel {
  static async create(data) {
    const { name, building_id, contact_info, metadata } = data;
    const query = `
      INSERT INTO hotels (name, building_id, contact_info, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [name, building_id, contact_info, metadata]);
    return result.rows[0];
  }




  static async findAll() {
    const query = `
      SELECT h.*, b.name as building_name, b.address as building_address
      FROM hotels h
      JOIN buildings b ON h.building_id = b.id
      ORDER BY h.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }




  static async findById(id) {
    const query = `
      SELECT h.*, b.name as building_name, b.address as building_address
      FROM hotels h
      JOIN buildings b ON h.building_id = b.id
      WHERE h.id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, building_id, contact_info, metadata } = data;
    const query = `
      UPDATE hotels 
      SET name = $2, building_id = $3, contact_info = $4, metadata = $5
      WHERE id = $1
      RETURNING *`;
    const result = await pool.query(query, [id, name, building_id, contact_info, metadata]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM hotels WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Hotel;