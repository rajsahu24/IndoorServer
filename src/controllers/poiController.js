const POI = require('../models/POI');
const TriggerService = require('../services/triggerService');

const poiController = {
  // Initialize triggers on first use
  async initializeTriggers() {
    try {
      await TriggerService.initializeTriggers();
    } catch (error) {
      console.error('Failed to initialize triggers:', error);
    }
  },

  async create(req, res) {
    await poiController.initializeTriggers();
    try {
      const poi = await POI.create(req.body);
      res.status(201).json({
        type: 'Feature',
        properties: {
          id: poi.id,
          name: poi.name,
          category: poi.category,
          floor_id: poi.floor_id,
          building_id: poi.building_id,
          metadata: poi.metadata,
          created_at: poi.created_at,
          updated_at: poi.updated_at
        },
        geometry: JSON.parse(poi.geometry)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const pois = await POI.findAll();
      const geojson = {
        type: 'FeatureCollection',
        features: pois.map(poi => ({
          type: 'Feature',
          properties: {
            id: poi.id,
            name: poi.name,
            category: poi.category,
            floor_name: poi.floor_name,
            building_id: poi.building_id,
            metadata: poi.metadata,
            created_at: poi.created_at,
            updated_at: poi.updated_at
          },
          geometry: JSON.parse(poi.geometry)
        }))
      };
      res.json(geojson);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const poi = await POI.findById(req.params.id);
      if (!poi) {
        return res.status(404).json({ error: 'POI not found' });
      }
      res.json({
        type: 'Feature',
        properties: {
          id: poi.id,
          name: poi.name,
          category: poi.category,
          floor_name: poi.floor_name,
          building_id: poi.building_id,
          metadata: poi.metadata,
          created_at: poi.created_at,
          updated_at: poi.updated_at
        },
        geometry: JSON.parse(poi.geometry)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    await poiController.initializeTriggers();
    try {
      
      const poi = await POI.update(req.params.id, req.body);
      if (!poi) {
        return res.status(404).json({ error: 'POI not found' });
      }
      res.json({
        type: 'Feature',
        properties: {
          id: poi.id,
          name: poi.name,
          category: poi.category,
          floor_id: poi.floor_id,
          building_id: poi.building_id,
          metadata: poi.metadata,
          created_at: poi.created_at,
          updated_at: poi.updated_at
        },
        geometry: JSON.parse(poi.geometry)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const poi = await POI.delete(req.params.id);
      if (!poi) {
        return res.status(404).json({ error: 'POI not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = poiController;