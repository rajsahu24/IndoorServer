const Navigation = require('../models/Navigation');

const navigationController = {
  async getPOIsByFloor(req, res) {
    try {
      const { floor, building_id } = req.query;
      const pois = await Navigation.getPOIsByFloor(floor, building_id);
      
      const geojson = {
        type: 'FeatureCollection',
        features: pois.map(poi => ({
          type: 'Feature',
          properties: {
            id: poi.id,
            name: poi.name,
            type: poi.type,
            metadata: poi.metadata
          },
          geometry: JSON.parse(poi.geometry)
        }))
      };
      
      res.json(geojson);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getRoute(req, res) {
    try {
      const { from_poi_id, to_poi_id } = req.query;
      const route = await Navigation.getRouteBetweenPOIs(from_poi_id, to_poi_id);
      
      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }
      
      res.json({
        type: 'Feature',
        properties: {
          id: route.id,
          distance: route.distance,
          floor_id: route.floor_id
        },
        geometry: JSON.parse(route.geometry)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getNavigationToRoom(req, res) {
    try {
      const { guest_id, unit_id } = req.query;
      const navigation = await Navigation.getNavigationToRoom(guest_id, unit_id);
      
      res.json({
        type: 'FeatureCollection',
        features: navigation.map(poi => ({
          type: 'Feature',
          properties: {
            id: poi.id,
            name: poi.name,
            navigation_type: poi.type,
            distance: poi.distance
          },
          geometry: JSON.parse(poi.geometry)
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getNavigationToVenue(req, res) {
    try {
      const { guest_id, venue_id } = req.query;
      const navigation = await Navigation.getNavigationToVenue(guest_id, venue_id);
      
      res.json({
        type: 'FeatureCollection',
        features: navigation.map(poi => ({
          type: 'Feature',
          properties: {
            id: poi.id,
            name: poi.name,
            navigation_type: poi.type
          },
          geometry: JSON.parse(poi.geometry)
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = navigationController;