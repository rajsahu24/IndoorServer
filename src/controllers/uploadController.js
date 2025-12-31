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

        // Handle metadata - it could be object or string
        let metadata = {};
        
        if (properties.metadata) {
          if (typeof properties.metadata === 'object') {
            // Already an object
            metadata = properties.metadata;
          } else if (typeof properties.metadata === 'string') {
            try {
              // Try to parse as JSON first
              metadata = JSON.parse(properties.metadata);
            } catch (e) {
              // If not JSON, parse as key:value format
              const parsedMeta = {};
              properties.metadata.split(',').forEach(pair => {
                const [key, value] = pair.split(':').map(s => s.trim());
                if (key && value) {
                  parsedMeta[key] = isNaN(value) ? value : Number(value);
                }
              });
              metadata = parsedMeta;
            }
          }
        }

        // Add any other properties that aren't main fields
        const otherProps = { ...properties };
        delete otherProps.name;
        delete otherProps.category;
        delete otherProps.floor_id;
        delete otherProps.building_id;
        delete otherProps.id;
        delete otherProps.metadata;

        // Merge other properties into metadata
        metadata = { ...metadata, ...otherProps };

        const query = `
          INSERT INTO pois (name, category, floor_id, building_id, metadata, geom)
          VALUES ($1, $2, $3, $4, $5::jsonb, ST_GeomFromGeoJSON($6))
        `;

        await client.query(query, [
          properties.name || 'Unnamed',
          properties.category || null,
          properties.floor_id || null,
          properties.building_id || null,
          metadata,
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