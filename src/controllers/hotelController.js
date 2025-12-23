const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');

const hotelController = {
  async create(req, res) {
    try {
      const hotel = await Hotel.create(req.body);
      res.status(201).json(hotel);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const hotels = await Hotel.findAll();
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const hotel = await Hotel.findById(req.params.id);
      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }
      res.json(hotel);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createBooking(req, res) {
    try {
      const booking = await Booking.create({
        hotel_id: req.params.id,
        ...req.body
      });
      res.status(201).json(booking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async bulkUploadGuests(req, res) {
    try {
      const { booking_id } = req.params;
      const { guests } = req.body;
      
      if (!Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: 'Guests array is required' });
      }
      
      const insertedGuests = await Booking.bulkCreateGuests(booking_id, guests);
      
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
      const updatedHotel = await Hotel.update(
        req.params.id,
        req.body
      );

      if (!updatedHotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      res.json(updatedHotel);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deletedHotel = await Hotel.delete(req.params.id);

      if (!deletedHotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      res.json({
        status: 'success',
        message: 'Hotel deleted successfully',
        hotel: deletedHotel
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

};

module.exports = hotelController;