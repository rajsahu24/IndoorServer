const Room = require('../models/Room');

const roomController = {
  /**
   * Create room
   */
  async create(req, res) {
    try {
      const room = await Room.create(req.body);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Get rooms by floor
   */
  async getByFloor(req, res) {
    try {
      const { floor_id } = req.params;

      const rooms = await Room.findByFloor(floor_id);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Allocate room to guest
   */
  async allocateToGuest(req, res) {
    try {
      const allocation = await Room.allocateToGuest(req.body);

      res.status(201).json({
        status: 'success',
        allocation
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Get guest allocated room
   */
  async getGuestRoom(req, res) {
    try {
      const { guest_id } = req.params;

      const room = await Room.getGuestRoom(guest_id);

      if (!room) {
        return res.status(404).json({ error: 'No room allocated to this guest' });
      }

      res.json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const rooms = await Room.findAll();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const room = await Room.findById(req.params.id);

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const updatedRoom = await Room.update(
        req.params.id,
        req.body
      );

      if (!updatedRoom) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json(updatedRoom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deletedRoom = await Room.delete(req.params.id);

      if (!deletedRoom) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({
        status: 'success',
        message: 'Room deleted successfully',
        room: deletedRoom
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = roomController;
