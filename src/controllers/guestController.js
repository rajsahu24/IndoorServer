const Guest = require('../models/Guest');

const guestController = {
  async create(req, res) {
    try {
      const guest = await Guest.create(req.body);
      res.status(201).json(guest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getByBooking(req, res) {
    try {
      const { booking_id } = req.params;
      const guests = await Guest.findByBooking(booking_id);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const guest = await Guest.findById(req.params.id);

      if (!guest) {
        return res.status(404).json({ error: 'Guest not found' });
      }

      res.json(guest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const updatedGuest = await Guest.update(
        req.params.id,
        req.body
      );

      if (!updatedGuest) {
        return res.status(404).json({ error: 'Guest not found' });
      }

      res.json(updatedGuest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deletedGuest = await Guest.delete(req.params.id);

      if (!deletedGuest) {
        return res.status(404).json({ error: 'Guest not found' });
      }

      res.json({
        status: 'success',
        message: 'Guest deleted successfully',
        guest: deletedGuest
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = guestController;
