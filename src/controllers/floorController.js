const Floor = require('../models/Floor');

const floorController = {
  async create(req, res) {
    try {
      const floor = await Floor.create(req.body);
      res.status(201).json(floor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const floors = await Floor.findAll();
      res.json(floors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const floor = await Floor.findById(req.params.id);

      if (!floor) {
        return res.status(404).json({ error: 'Floor not found' });
      }

      res.json(floor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const updatedFloor = await Floor.update(
        req.params.id,
        req.body
      );

      if (!updatedFloor) {
        return res.status(404).json({ error: 'Floor not found' });
      }

      res.json(updatedFloor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deletedFloor = await Floor.delete(req.params.id);

      if (!deletedFloor) {
        return res.status(404).json({ error: 'Floor not found' });
      }

      res.json({
        status: 'success',
        message: 'Floor deleted successfully',
        floor: deletedFloor
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = floorController;
