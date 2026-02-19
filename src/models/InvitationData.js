const pool = require('../database');
const { nanoid } = require('nanoid');
class InvitationData {
  static async create(invitationData) {
    console.log(invitationData);
    const {invitation_id,  template_section_id, data } = invitationData;
    const query = `
      INSERT INTO invitation_data (invitation_id, template_section_id, data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [invitation_id, template_section_id, JSON.stringify(data)]);
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
  // Ensure every event has ID
  if (partialData.is_repeated) {
    partialData.data = partialData.data.map(event => ({
      id: event.id || nanoid(10),
      ...event
    }));
  }

  // Handle image data if present
  if (partialData.image_url) {
    partialData.data = {
      ...partialData.data,
      image_url: partialData.image_url,
      public_id: partialData.public_id,
      type: partialData.type || 'general'
    };
  }

  const query = `
    UPDATE invitation_data
    SET data = $3::jsonb,
        updated_at = CURRENT_TIMESTAMP
    WHERE invitation_id = $1 AND template_section_id = $2
    RETURNING *
  `;

  const result = await pool.query(
    query,
    [invitation_id, template_section_id, JSON.stringify(partialData.data)]
  );

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
     // Debug log to check the invitation_id
    const query = `
    SELECT 
    inv.id AS invitation_id,
      t.template_name,
      t.template_type,
      idata.id AS invitation_data_id,
      idata.template_section_id,
      ts.section_type AS section_name,
      ts.schema AS section_schema,
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
    if (result.rows.length === 0) return null;

  // Base template info (same for all rows)
  const response = {
      invitation_id: result.rows[0].invitation_id,
    template_name: result.rows[0].template_name,
    template_type: result.rows[0].template_type,
  };

  // Loop through sections
  for (const row of result.rows) {
    if (!row.section_name) continue;

    response[row.section_name] = {
      invitation_data_id: row.invitation_data_id,
      template_section_id: row.template_section_id,
      data: row.data,
      schema: row.section_schema || null,
    };
  }

  return response;
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
        inv.id AS invitation_id,
        t.template_name,
        t.template_type,
        idata.id AS invitation_data_id,
        idata.template_section_id,
        ts.section_type AS section_name,
        ts.schema AS section_schema,
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
      if (result.rows.length === 0) return null;

    // Base template info (same for all rows)
    const response = {
      invitation_id: result.rows[0].invitation_id,
      template_name: result.rows[0].template_name,
      template_type: result.rows[0].template_type,
    };

    // Loop through sections
    for (const row of result.rows) {
      if (!row.section_name) continue;

      response[row.section_name] = {
        
        invitation_data_id: row.invitation_data_id,
        template_section_id: row.template_section_id,
        data: row.data,
        schema: row.section_schema || null,
      };
    }

    return response;
    }

  static async findByRsvpToken(rsvp_token) {
    const query = `
    SELECT 
    inv.id AS invitation_id,
      t.template_name,
      t.template_type,
      idata.id AS invitation_data_id,
      idata.template_section_id,
      ts.section_type as section_name,
      ts.schema AS section_schema,
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
    if (result.rows.length === 0) return null;

  // Base template info (same for all rows)
  const response = {
    invitation_id: result.rows[0].invitation_id,
    template_name: result.rows[0].template_name,
    template_type: result.rows[0].template_type,
  };

  // Loop through sections
  for (const row of result.rows) {
    if (!row.section_name) continue;

    response[row.section_name] = {
      invitation_data_id: row.invitation_data_id,
      template_section_id: row.template_section_id,
      data: row.data,
      schema: row.section_schema || null,
    };
  }

  return response;
  }


  static async deleteRepeatedData(invitation_id, template_section_id, nano_id) {
    const query = `
  UPDATE invitation_data
  SET data = COALESCE((
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(data) elem
    WHERE elem->>'id' != $3
  ), '[]'::jsonb),
  updated_at = CURRENT_TIMESTAMP
  WHERE invitation_id = $1 AND template_section_id = $2
  RETURNING *
    `;
    const result = await pool.query(query, [invitation_id, template_section_id, nano_id]);
    return result.rows[0];    
  }

  static async patchRepeatedEntry(invitation_id, template_section_id, nano_id, updatedData) {
    // Handle image upload if present
    if (updatedData.image_url) {
      const imageData = {
        image_url: updatedData.image_url,
        public_id: updatedData.public_id,
        type: updatedData.type || 'general'
      };
      updatedData = { ...updatedData, ...imageData };
    }

    const query = `
UPDATE invitation_data
SET data = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'id' = $3 THEN elem || $4::jsonb
      ELSE elem
    END
  )
  FROM jsonb_array_elements(data) elem
),
updated_at = CURRENT_TIMESTAMP
WHERE invitation_id = $1 AND template_section_id = $2
RETURNING *;
    `;
    const result = await pool.query(query, [invitation_id, template_section_id, nano_id, JSON.stringify(updatedData)]);
    return result.rows[0];    
  }

  
}

module.exports = InvitationData;