const Booking = require('../models/Booking');
const User = require('../models/Users');
const Event = require('../models/Event');
const pool = require('../database');

const bookingController = {
  /**
   * Create booking
   */
  async create(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        building_id,
        booking_category,
        host_name,
        host_email,
        start_date,
        end_date,
        host_phone,
        events
      } = req.body;
      
      if (!building_id || !booking_category || !host_name || !host_email || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create or find user
      let user = await User.findByEmail(host_email);
      
      if (!user) {
        const randomPassword = host_email.split('@')[0];
        
        user = await User.create({
          email: host_email,
          phone: host_phone || null,
          name: host_name,
          role: 'host',
          password: randomPassword
        });
      }
      
      // Create booking
      const bookingData = { 
        building_id,
        booking_category,
        host_id: user.id,
        host_name,
        host_email,
        host_phone,
        start_date,
        end_date,
        status: req.body.status || 'confirmed',
        guest_count: req.body.guest_count,
        host_metadata: req.body.host_metadata || {},
        metadata: req.body.metadata || {}
      };

      const booking = await Booking.create(bookingData);

      // Create events if provided
      let createdEvents = [];
      if (events && Array.isArray(events) && events.length > 0) {
        for (const eventData of events) {
            const { name, event_type, venue_id, start_time, end_time, description } = eventData;
            
            if (name && start_time && end_time) {
              const event = await Event.create({
                booking_id: booking.id,
                name,
                event_type: event_type || 'general',
              venue_id: venue_id || null,
              start_time,
              end_time,
              description: description || null,
              metadata: eventData.metadata || {}
            });
            createdEvents.push(event);
          }
        }
      }

      
      
      await client.query('COMMIT');
      
      res.status(201).json({
        status: 'success',
        booking,
        events: createdEvents,
        host: { id: user.id, email: user.email }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  /**
   * Get all bookings
   */
  async getAll(req, res) {
    try {
      const bookings = await Booking.findAll();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get booking by ID
   */
  async getById(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Bulk upload guests for a booking
   */
  async bulkUploadGuests(req, res) {
    try {
      const { booking_id } = req.params;
      const { guests } = req.body;

      if (!Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: 'Guests array is required' });
      }

      const insertedGuests = await Booking.bulkCreateGuests(
        booking_id,
        guests
      );

      res.status(201).json({
        status: 'success',
        total: guests.length,
        inserted: insertedGuests.length,
        guests: insertedGuests
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Update booking
   */
  async update(req, res) {
    try {
      const updatedBooking = await Booking.update(
        req.params.id,
        req.body
      );

      if (!updatedBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(updatedBooking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Delete booking
   */
  async delete(req, res) {
    try {
      const deletedBooking = await Booking.delete(req.params.id);

      if (!deletedBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json({
        status: 'success',
        message: 'Booking deleted successfully',
        booking: deletedBooking
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = bookingController;