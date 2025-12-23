const pool = require('../database');

class Notification {
  static async create(data) {
    const { guest_id, event_id, title, message, notification_type, unit_id, metadata } = data;
    const query = `
      INSERT INTO notifications (guest_id, event_id, title, message, notification_type, unit_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [guest_id, event_id, title, message, notification_type, unit_id, metadata]);
    return result.rows[0];
  }

  static async sendEventReminder(event_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const eventQuery = `
        SELECT e.*, v.name as venue_name, v.unit_id,
               u.name as unit_name, ST_AsGeoJSON(u.geometry) as venue_geometry
        FROM events e
        JOIN venues v ON e.venue_id = v.id
        JOIN units u ON v.unit_id = u.id
        WHERE e.id = $1`;
      const eventResult = await client.query(eventQuery, [event_id]);
      const event = eventResult.rows[0];
      
      if (!event) throw new Error('Event not found');
      
      // Get all guests for this event
      const guestsQuery = `
        SELECT g.id, g.name, g.phone, g.email
        FROM guest_events ge
        JOIN guests g ON ge.guest_id = g.id
        WHERE ge.event_id = $1
      `;
      const guestsResult = await client.query(guestsQuery, [event_id]);
      
      const notifications = [];
      for (const guest of guestsResult.rows) {
        const title = `${event.name} Reminder`;
        const message = `${event.name} starts at ${event.start_time} in ${event.venue_name}. Tap for navigation.`;
        
        const notificationQuery = `
          INSERT INTO notifications (guest_id, event_id, title, message, notification_type, unit_id, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        const result = await client.query(notificationQuery, [
          guest.id, event_id, title, message, 'event_reminder', event.unit_id,
          { venue_name: event.venue_name, venue_geometry: event.venue_geometry }
        ]);
        
        notifications.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return notifications;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getGuestNotifications(guest_id) {
    const query = `
      SELECT n.*, u.name as unit_name, ST_AsGeoJSON(u.geometry) as unit_geometry
      FROM notifications n
      LEFT JOIN units u ON n.unit_id = u.id
      WHERE n.guest_id = $1
      ORDER BY n.created_at DESC
    `;
    const result = await pool.query(query, [guest_id]);
    return result.rows;
  }
}

module.exports = Notification;