const RoomAllocation = require('../models/RoomAllocation');

const roomAllocationController = {
  async create(req, res) {
    try {
      const allocation = await RoomAllocation.create(req.body);
      res.status(201).json(allocation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const allocations = await RoomAllocation.findAll();
      res.json(allocations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const allocation = await RoomAllocation.findById(req.params.id);

      if (!allocation) {
        return res.status(404).json({ error: 'Room allocation not found' });
      }

      res.json(allocation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const updatedAllocation = await RoomAllocation.update(
        req.params.id,
        req.body
      );

      if (!updatedAllocation) {
        return res.status(404).json({ error: 'Room allocation not found' });
      }

      res.json(updatedAllocation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deletedAllocation = await RoomAllocation.delete(req.params.id);

      if (!deletedAllocation) {
        return res.status(404).json({ error: 'Room allocation not found' });
      }

      res.json({
        status: 'success',
        message: 'Room allocation deleted successfully',
        allocation: deletedAllocation
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = roomAllocationController;
