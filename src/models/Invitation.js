const pool = require('../database');

class Invitation {
  static async create(data, user_id) {
    const { invitation_title, invitation_type, invitation_message, invitation_tag_line, metadata, quick_action, invitation_template_id } = data;
    const query = `
      INSERT INTO invitations (user_id, invitation_title, invitation_type, invitation_message, invitation_tag_line, metadata, quick_action, invitation_template_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [user_id, invitation_title, invitation_type, invitation_message, invitation_tag_line, metadata, quick_action, invitation_template_id]);
    return result.rows[0];
  }
    static async findByUserId(user_id) {
    const query = `
      SELECT * FROM invitations
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [user_id]);
    return result.rows;
  }
  static async findById(id) {
    const query = `
      SELECT * FROM invitations
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } 

  static async findGuestByInvitationId(invitation_id) {
    const query = `
      SELECT * FROM guests
      WHERE invitation_id = $1
    `;
    const result = await pool.query(query, [invitation_id]);
    return result.rows;
  }

    static async delete(id) {
    const query = `
      DELETE FROM invitations
      WHERE id = $1
    `;
    await pool.query(query, [id]);
    return true;
  }

  static async findAll() {
    const query = `
      SELECT * FROM invitations
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } 

  static async update(id, data) {
    const { invitation_title, invitation_type, invitation_message, invitation_tag_line, metadata, quick_action } = data;
    const query = `
      UPDATE invitations 
      SET invitation_title = $2, invitation_type = $3, invitation_message = $4, invitation_tag_line = $5, metadata = $6, quick_action = $7, invitation_template_id = $8
      WHERE id = $1
      RETURNING *`;
    const result = await pool.query(query, [id, invitation_title, invitation_type, invitation_message, invitation_tag_line, metadata, quick_action, invitation_template_id]);
    return result.rows[0];
  }

  static async updates(id, data) {
  const fields = Object.keys(data);

  if (!fields.length) {
    throw new Error('No fields to update');
  }

  const values = fields.map(field => data[field]);

  const setClause = fields
    .map((field, index) => `${field} = $${index + 2}`)
    .join(', ');

  const query = `
    UPDATE invitations
    SET ${setClause}, updated_at = now()
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id, ...values]);
  return result.rows[0];
}

static async getImagesByInvitationId(invitation_id) {
    const query = `
      SELECT * FROM invitation_images
      WHERE invitation_id = $1
    `;
    const result = await pool.query(query, [invitation_id]);
    return result.rows;
}

  static async addImage(invitation_id, image_url, public_id, type) {
    const query = `
      INSERT INTO invitation_images (invitation_id, image_url, public_id, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [invitation_id, image_url, public_id, type]);
    return result.rows[0];
  }

  static async getImageById(image_id) {
    const query = `
      SELECT * FROM invitation_images
      WHERE id = $1
    `;
    const result = await pool.query(query, [image_id]);
    return result.rows[0];
  }

  static async deleteImage(image_id) {
    const query = `
      DELETE FROM invitation_images
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [image_id]);
    return result.rows[0];
  }

static async getInvitationByRsvpToken(rsvp_token) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Find guest by token
    const guestRes = await client.query(
      `SELECT * FROM guests WHERE rsvp_token = $1`,
      [rsvp_token]
    );

    if (guestRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    let guest = guestRes.rows[0];
    const invitationId = guest.invitation_id;

    // 2️⃣ If first time opened (status = 0) → mark as viewed (1)
    if (guest.status === '0' || guest.status === 0) {
      const updateRes = await client.query(
        `UPDATE guests 
         SET status = 1 
         WHERE rsvp_token = $1
         RETURNING *`,
        [rsvp_token]
      );
      guest = updateRes.rows[0];
    }

    // 3️⃣ Get invitation details
    const invitationRes = await client.query(
      `SELECT * FROM invitations WHERE id = $1`,
      [invitationId]
    );

    const invitation = invitationRes.rows[0];

    // 4️⃣ Get events for this invitation
    const eventsRes = await client.query(
      `SELECT * FROM events WHERE invitation_id = $1 ORDER BY start_time`,
      [invitationId]
    );

    // 5️⃣ Get images for this invitation
    const imagesRes = await client.query(
      `SELECT * FROM invitation_images WHERE invitation_id = $1`,
      [invitationId]
    );

    await client.query('COMMIT');

    // 6️⃣ Return complete data
    return {
      guest,
      invitation,
      events: eventsRes.rows,
      images: imagesRes.rows
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

static async updateGuestRsvpStatus(rsvp_token, status) {
  const query = `
    UPDATE guests
    SET status = $1
    WHERE rsvp_token = $2
    RETURNING *
  `;
  const result = await pool.query(query, [status, rsvp_token]);
  return result.rows[0];
}


}

module.exports = Invitation;