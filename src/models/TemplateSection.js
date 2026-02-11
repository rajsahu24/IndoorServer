const pool = require("../database");

class TemplateSection {
  static async create(data) {
    const {
      template_id,
      section_key,
      section_type,
      schema,
      display_order,
      is_active,
      is_repeated,
    } = data;
    const query = `
      INSERT INTO template_sections (template_id,  section_key, section_type, schema, display_order, is_active, is_repeated)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const result = await pool.query(query, [
      template_id,
      section_key,
      section_type,
      schema,
      display_order,
      is_active,
      is_repeated,
    ]);
    return result.rows[0];
  }

  static async findAll() {
    const query = "SELECT * FROM template_sections";
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = "SELECT * FROM template_sections WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      template_id,
      section_key,
      section_type,
      schema,
      display_order,
      is_active,
      is_repeated,
    } = data;
    const query = `
      UPDATE template_sections
      SET template_id = $1,  section_key = $2, section_type = $3, schema = $4, display_order = $5, is_active = $6, is_repeated = $7
      WHERE id = $8
        RETURNING *
    `;
    const result = await pool.query(query, [
      template_id,
      section_key,
      section_type,
      schema,
      display_order,
      is_active,
      is_repeated,
      id,
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = "DELETE FROM template_sections WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  static async findByInvitationId(invitationId) {
    const query = `
            SELECT 
    i.id AS invitation_id,
    ts.id AS section_id,
    ts.section_type,
    ts.schema,
    ts.display_order,
    ts.is_active,
    ts.is_repeated
FROM invitations i
JOIN template_sections ts
    ON ts.template_id = i.invitation_template_id::uuid
WHERE i.id = $1;
        `;
    const result = await pool.query(query, [invitationId]);
    return result.rows;
  }
}

module.exports = TemplateSection;
