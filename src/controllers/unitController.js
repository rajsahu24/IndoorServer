const Unit = require('../models/Unit');

const unitController = {
  async create(req, res) {
    try {
      const unit = await Unit.create(req.body);
      res.status(201).json({
        type: 'Feature',
        properties: {
          id: unit.id,
          name: unit.name,
          category: unit.category,
          feature_type: 'unit',
          floor_id: unit.floor_id,
          area: unit.area,
          metadata: unit.metadata,
          show: unit.show,
          display_point: unit.display_point,
          accessibility: unit.accessibility,
          restriction: unit.restriction,
          created_at: unit.created_at,
          updated_at: unit.updated_at
        },
        geometry: JSON.parse(unit.geometry)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const units = await Unit.findAll();
      const geojson = {
        type: 'FeatureCollection',
        features: units.map(unit => ({
          type: 'Feature',
          properties: {
            id: unit.id,
            name: unit.name,
            category: unit.category,
            feature_type: 'unit',
            floor_id: unit.floor_id,
            area: unit.area,
            metadata: unit.metadata,
            show: unit.show,
            display_point: unit.display_point,
            accessibility: unit.accessibility,
            restriction: unit.restriction,
            created_at: unit.created_at,
            updated_at: unit.updated_at
          },
          geometry: JSON.parse(unit.geometry)
        }))
      };
      res.json(geojson);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const unit = await Unit.findById(req.params.id);
      if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      res.json({
        type: 'Feature',
        properties: {
          id: unit.id,
          name: unit.name,
          category: unit.category,
          feature_type: 'unit',
          floor_id: unit.floor_id,
          area: unit.area,
          metadata: unit.metadata,
          show: unit.show,
          display_point: unit.display_point,
          accessibility: unit.accessibility,
          restriction: unit.restriction,
          created_at: unit.created_at,
          updated_at: unit.updated_at
        },
        geometry: JSON.parse(unit.geometry)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const unit = await Unit.update(req.params.id, req.body);
      if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      res.json({
        type: 'Feature',
        properties: {
          id: unit.id,
          name: unit.name,
          category: unit.category,
          feature_type: 'unit',
          floor_id: unit.floor_id,
          area: unit.area,
          metadata: unit.metadata,
          show: unit.show,
          display_point: unit.display_point,
          accessibility: unit.accessibility,
          restriction: unit.restriction,
          created_at: unit.created_at,
          updated_at: unit.updated_at
        },
        geometry: JSON.parse(unit.geometry)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const unit = await Unit.delete(req.params.id);
      if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = unitController;