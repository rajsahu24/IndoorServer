const pool = require('../database');
const ShapefileService = require('../services/shapefileService');

const uploadController = {
  async uploadUnits(req, res) {
    console.log('Received file: aslifjalsjflsajfd');
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const client = await pool.connect();
    let total = 0, inserted = 0, skipped = 0;
    const errors = [];

    try {
      const features = await ShapefileService.extractAndParse(req.file.path);
      total = features.length;

      await client.query('BEGIN');

      for (let i = 0; i < features.length; i++) {
        try {
          const feature = features[i];
          const { geometry, properties } = feature;

          if (!ShapefileService.validateGeometryType(geometry, 'MultiPolygon')) {
            errors.push({ row: i + 1, reason: 'Invalid geometry type' });
            skipped++;
            continue;
          }

          const convertedGeometry = ShapefileService.convertToMultiPolygon(geometry);
          const metadata = { ...properties };
          delete metadata.name;
          delete metadata.category;
          delete metadata.floor_id;

          const query = `
            INSERT INTO units (name, category, floor_id, metadata, geometry)
            VALUES ($1, $2, $3, $4, ST_GeomFromGeoJSON($5))
          `;

          await client.query(query, [
            properties.name || 'Unnamed',
            properties.category || null,
            properties.floor_id || null,
            JSON.stringify(metadata),
            JSON.stringify(convertedGeometry)
          ]);

          inserted++;
        } catch (error) {
          errors.push({ row: i + 1, reason: error.message });
          skipped++;
        }
      }

      await client.query('COMMIT');

      res.json({
        status: 'success',
        total,
        inserted,
        skipped,
        errors
      });

    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async uploadRoutes(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const client = await pool.connect();
    let total = 0, inserted = 0, skipped = 0;
    const errors = [];

    
    try {
      const features = await ShapefileService.extractAndParse(req.file.path);
      console.log('Extracted features:', features);
      total = features.length;
      await client.query('BEGIN');

      for (let i = 0; i < features.length; i++) {
        try {
          const feature = features[i];
          const { geometry, properties } = feature;

          if (!ShapefileService.validateGeometryType(geometry, 'LineString')) {
            errors.push({ row: i + 1, reason: 'Invalid geometry type' });
            skipped++;
            continue;
          }

          const query = `
            INSERT INTO routes (from_poi_id, to_poi_id, floor_id, geometry)
            VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4))
          `;

          await client.query(query, [
            properties.from_poi_id || null,
            properties.to_poi_id || null,
            properties.floor_id || null,
            JSON.stringify(geometry)
          ]);

          inserted++;
        } catch (error) {
          errors.push({ row: i + 1, reason: error.message });
          skipped++;
        }
      }

      await client.query('COMMIT');

      res.json({
        status: 'success',
        total,
        inserted,
        skipped,
        errors
      });

    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  async uploadPois(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const client = await pool.connect();
    let total = 0, inserted = 0, skipped = 0;
    const errors = [];

    try {
      const features = await ShapefileService.extractAndParse(req.file.path);
      total = features.length;

      await client.query('BEGIN');

      for (let i = 0; i < features.length; i++) {
        try {
          const feature = features[i];
          const { geometry, properties } = feature;

          if (!ShapefileService.validateGeometryType(geometry, 'Point')) {
            errors.push({ row: i + 1, reason: 'Invalid geometry type' });
            skipped++;
            continue;
          }

          const metadata = { ...properties };
          delete metadata.name;
          delete metadata.type;
          delete metadata.floor;
          delete metadata.floor_id;

          const query = `
            INSERT INTO pois (name, type, floor, floor_id, metadata, geometry)
            VALUES ($1, $2, $3, $4, $5, ST_GeomFromGeoJSON($6))
          `;

          await client.query(query, [
            properties.name || 'Unnamed',
            properties.type || 'unknown',
            properties.floor || null,
            properties.floor_id || null,
            JSON.stringify(metadata),
            JSON.stringify(geometry)
          ]);

          inserted++;
        } catch (error) {
          errors.push({ row: i + 1, reason: error.message });
          skipped++;
        }
      }

      await client.query('COMMIT');

      res.json({
        status: 'success',
        total,
        inserted,
        skipped,
        errors
      });

    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }
};

module.exports = uploadController;