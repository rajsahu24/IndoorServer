const pool = require('../database');

class Blog {
  static async create(data) {
    const { title, slug, meta_title, meta_description, status, content, thumbnail } = data;
    const query = `INSERT INTO blogs (title, slug, meta_title, meta_description, status, content, thumbnail)
                   VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const values = [title, slug, meta_title, meta_description, status, content, thumbnail];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  static async getAll() {
    const query = `SELECT * FROM blogs ORDER BY created_at DESC`;
    const result = await pool.query(query);
    return result.rows;
  }
  static async getById(id) {
    const query = `SELECT * FROM blogs WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  static async update(id, data) {
    const { title, slug, meta_title, meta_description, status, content, thumbnail } = data;
    const query = `UPDATE blogs SET title = $1, slug = $2, meta_title = $3, meta_description = $4, status = $5, content = $6, thumbnail = $7 WHERE id = $8 RETURNING *`;
    const values = [title, slug, meta_title, meta_description, status, content, thumbnail, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  static async delete(id) {
    const query = `DELETE FROM blogs WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  static async getBySlug(slug) {    
    const query = `SELECT * FROM blogs WHERE slug = $1`;
    const result = await pool.query(query, [slug]);
    return result.rows[0];
  }
}

module.exports = Blog;