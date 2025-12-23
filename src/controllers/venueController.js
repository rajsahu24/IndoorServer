const Venue = require('../models/Venue');

const venueController = {
  async create(req, res) {
    try {
      const venue = await Venue.create(req.body);
      res.status(201).json(venue);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const venues = await Venue.findAll();
      res.json(venues);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const venue = await Venue.findById(req.params.id);

      if (!venue) {
        return res.status(404).json({ error: 'Venue not found' });
      }

      res.json(venue);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const updatedVenue = await Venue.update(
        req.params.id,
        req.body
      );

      if (!updatedVenue) {
        return res.status(404).json({ error: 'Venue not found' });
      }

      res.json(updatedVenue);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deletedVenue = await Venue.delete(req.params.id);

      if (!deletedVenue) {
        return res.status(404).json({ error: 'Venue not found' });
      }

      res.json({
        status: 'success',
        message: 'Venue deleted successfully',
        venue: deletedVenue
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = venueController;
