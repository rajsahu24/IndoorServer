const pool = require('../database');

class Template {
  static async create(data) {
    const { template_type, template_name, template_key, template_image, is_active } = data;
    const query = `
      INSERT INTO templates (template_type, template_name, template_key,template_image, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [template_type, template_name, template_key, template_image, is_active]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT * FROM templates;
    `;
    const result = await pool.query(query);
    return result.rows;
  }
    static async findByPk(id) {
    const query = `
      SELECT * FROM templates WHERE id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
    static async update(data, options) {
    const { template_type, template_name, template_key, template_image, is_active } = data;
    const { where } = options;
    const query = `
      UPDATE templates
      SET template_type = $1, template_name = $2, template_key = $3, template_image = $4, is_active = $5
      WHERE id = $6
      RETURNING *
    `;
    const result = await pool.query(query, [template_type, template_name, template_key, template_image, is_active, where.id]);
    return result.rows[0];
  }
    static async destroy(options) {
    const { where } = options;
    const query = `
      DELETE FROM templates
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [where.id]);
    return result.rows[0];
  }
}

module.exports = Template;