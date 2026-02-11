const pool = require('../database');

class InvitationData {
  static async create(invitationData) {
    console.log(invitationData);
    const {invitation_id,  template_section_id, data } = invitationData;
    const query = `
      INSERT INTO invitation_data (invitation_id, template_section_id, data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [invitation_id, template_section_id, data]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT * FROM invitation_data
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findByPk(id) {
    const query = `
      SELECT * FROM invitation_data
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(invitationData, options) { 
    const { invitation_id, invitation_section_id, data } = invitationData;
    const { where } = options;
    const query = `
      UPDATE invitation_data
      SET invitation_id = $1, template_section_id = $2, data = $3
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [invitation_id, invitation_section_id, data, where.id]);
    return result.rows[0];
  }

  static async destroy(options) {
    const { where } = options;
    const query = `
      DELETE FROM invitation_data
      WHERE id = $1
    `;
    const result = await pool.query(query, [where.id]);
    return result.rowCount > 0;
  }

    static async patchData(invitation_id, template_section_id, partialData) {
    const query = `
      UPDATE invitation_data
      SET data = data || $3::jsonb, updated_at = CURRENT_TIMESTAMP
      WHERE invitation_id = $1 AND template_section_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [invitation_id, template_section_id, JSON.stringify(partialData)]);
    return result.rows[0];
  }

  static async findByInvitationAndTemplateSection(invitation_id, template_section_id) {

    const query = `
      SELECT * FROM invitation_data
      WHERE invitation_id = $1 AND template_section_id = $2
    `;
    const result = await pool.query(query, [invitation_id, template_section_id]);
    return result.rows[0];
  }


  static async getAllByInvitationId(invitation_id) {
    const query = `
    SELECT 
      t.template_name,
      t.template_type,
      idata.id AS invitation_data_id,
      idata.template_section_id,
      ts.section_type AS section_name,
      idata.data
    FROM invitations inv
    JOIN templates t 
      ON inv.invitation_template_id::uuid = t.id
    LEFT JOIN invitation_data idata 
      ON inv.id = idata.invitation_id
    LEFT JOIN template_sections ts 
      ON idata.template_section_id = ts.id
    WHERE inv.id = $1
    `;
    const result = await pool.query(query, [invitation_id]);
    return result.rows;
  }



    static async upsertImage(invitation_id, template_section_id, imageData) {
    const query = `
      INSERT INTO invitation_data (invitation_id, template_section_id, data)
      VALUES ($1, $2, jsonb_build_object('images', jsonb_build_array($3::jsonb)))
      ON CONFLICT (invitation_id, template_section_id)
      DO UPDATE SET 
        data = jsonb_set(
          COALESCE(invitation_data.data, '{}'::jsonb),
          '{images}',
          COALESCE(invitation_data.data->'images', '[]'::jsonb) || jsonb_build_array($3::jsonb)
        ),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [invitation_id, template_section_id, JSON.stringify(imageData)]);
    return result.rows[0];
  }

  static async deleteImage(invitation_id, template_section_id, public_id) {
    const query = `
      UPDATE invitation_data
      SET data = jsonb_set(
        data,
        '{images}',
        (SELECT jsonb_agg(img) FROM jsonb_array_elements(data->'images') img WHERE img->>'public_id' != $3)
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE invitation_id = $1 AND template_section_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [invitation_id, template_section_id, public_id]);
    return result.rows[0];
  }
  static async findByPublicId(public_id) {
    const query = `
    SELECT 
      t.template_name,
      t.template_type,
      idata.id AS invitation_data_id,
      idata.template_section_id,
      ts.section_type AS section_name,
      idata.data
    FROM invitations inv
    JOIN templates t 
      ON inv.invitation_template_id::uuid = t.id
    LEFT JOIN invitation_data idata 
      ON inv.id = idata.invitation_id
    LEFT JOIN template_sections ts 
      ON idata.template_section_id = ts.id
    WHERE inv.public_id = $1
    `;
    const result = await pool.query(query, [public_id]);
    return result.rows;
  }

  static async findByRsvpToken(rsvp_token) {
    const query = `
    SELECT 
      t.template_name,
      t.template_type,
      idata.id AS invitation_data_id,
      idata.template_section_id,
      ts.section_type as section_name,
      idata.data
    FROM guests g
    JOIN invitations inv
      ON g.invitation_id = inv.id
    JOIN templates t
      ON inv.invitation_template_id::uuid = t.id
    JOIN invitation_data idata
      ON inv.id = idata.invitation_id
    JOIN template_sections ts
      ON idata.template_section_id = ts.id
    WHERE g.rsvp_token = $1
    `;
    const result = await pool.query(query, [rsvp_token]);
    return result.rows;
  }
}

module.exports = InvitationData;