const Building = require('../models/Building');

const buildingController = {
  /**
   * Create a building
   */
  async create(req, res) {
    try {
      const building = await Building.create(req.body);
      res.status(201).json(building);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Get all buildings
   */
  async getAll(req, res) {
    try {
      const buildings = await Building.findAll();
      res.json(buildings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get building by ID
   */
  async getById(req, res) {
    try {
      const building = await Building.findById(req.params.id);

      if (!building) {
        return res.status(404).json({ error: 'Building not found' });
      }

      res.json(building);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update building
   */
  async update(req, res) {
    try {
      const updatedBuilding = await Building.update(
        req.params.id,
        req.body
      );

      if (!updatedBuilding) {
        return res.status(404).json({ error: 'Building not found' });
      }

      res.json(updatedBuilding);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Delete building
   */
  async delete(req, res) {
    try {
      const deletedBuilding = await Building.delete(req.params.id);

      if (!deletedBuilding) {
        return res.status(404).json({ error: 'Building not found' });
      }

      res.json({
        status: 'success',
        message: 'Building deleted successfully',
        building: deletedBuilding
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = buildingController;
