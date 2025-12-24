const Route = require('../models/Route');

const routeController = {
  async create(req, res) {
    try {
      const route = await Route.create(req.body);
      res.status(201).json({
        type: 'Feature',
        properties: {
          id: route.id,
          from_poi_id: route.from_poi_id,
          to_poi_id: route.to_poi_id,
          floor_id: route.floor_id,
          distance: route.distance,
          created_at: route.created_at,
          updated_at: route.updated_at
        },
        geometry: JSON.parse(route.geometry)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const routes = await Route.findAll();
      const geojson = {
        type: 'FeatureCollection',
        features: routes.map(route => ({
          type: 'Feature',
          properties: {
            id: route.id,
            from_poi_id: route.from_poi_id,
            to_poi_id: route.to_poi_id,
            floor_id: route.floor_id,
            distance: route.distance,
            created_at: route.created_at,
            updated_at: route.updated_at
          },
          geometry: JSON.parse(route.geometry)
        }))
      };
      res.json(geojson);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const route = await Route.findById(req.params.id);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }
      res.json({
        type: 'Feature',
        properties: {
          id: route.id,
          from_poi_id: route.from_poi_id,
          to_poi_id: route.to_poi_id,
          floor_id: route.floor_id,
          distance: route.distance,
          created_at: route.created_at,
          updated_at: route.updated_at
        },
        geometry: JSON.parse(route.geometry)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const route = await Route.update(req.params.id, req.body);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }
      res.json({
        type: 'Feature',
        properties: {
          id: route.id,
          from_poi_id: route.from_poi_id,
          to_poi_id: route.to_poi_id,
          floor_id: route.floor_id,
          distance: route.distance,
          created_at: route.created_at,
          updated_at: route.updated_at
        },
        geometry: JSON.parse(route.geometry)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const route = await Route.delete(req.params.id);
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = routeController;