const Booking = require('../models/Booking');

const bookingController = {
  /**
   * Create booking
   */
  async create(req, res) {
    try {
      const booking = await Booking.create(req.body);
      res.status(201).json(booking);
    } catch (error) {
      res.status(400).json({ error: error.message });
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
