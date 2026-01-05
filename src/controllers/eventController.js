const Event = require('../models/Event');
const Notification = require('../models/Notification');

const eventController = {
  async create(req, res) {
    try {
      const event = await Event.create(req.body);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getEvents(req, res) {
    try {
      const events = await Event.findAll();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async assignGuests(req, res) {
    try {
      const { event_id } = req.params;
      const { guest_ids } = req.body;
      
      if (!Array.isArray(guest_ids)) {
        return res.status(400).json({ error: 'guest_ids array is required' });
      }
      
      const assignments = await Event.assignGuests(event_id, guest_ids);
      res.status(201).json({
        status: 'success',
        assigned: assignments.length,
        assignments
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },


  async getEventById(req, res) {
    try {
      const event = await Event.getById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }},

  async getEventWithVenue(req, res) {
    try {
      const event = await Event.getEventWithVenue(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


  async update(req, res) {
    try {
      const updatedEvent = await Event.update(
        req.params.id,
        req.body
      ); 
      if (!updatedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deletedEvent = await Event.delete(req.params.id);
      if (!deletedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getGuestEvents(req, res) {
    try {
      const events = await Event.getGuestEvents(req.params.guest_id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async sendEventReminder(req, res) {
    try {
      const notifications = await Notification.sendEventReminder(req.params.id);
      res.json({
        status: 'success',
        notifications_sent: notifications.length,
        notifications
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = eventController;