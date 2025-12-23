const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const shapefile = require('shapefile');

class ShapefileService {
  static async extractAndParse(zipPath) {
    const extractDir = path.join(path.dirname(zipPath), `extracted_${Date.now()}`);

    let shpPath = null;

    try {
      // Extract ZIP
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, true);

      // Recursive search for the first .shp file (case-insensitive)
      function findShpFile(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            const found = findShpFile(fullPath);
            if (found) return found;
          } else if (item.toLowerCase().endsWith('.shp')) {
            return fullPath;
          }
        }
        return null;
      }

      shpPath = findShpFile(extractDir);

      if (!shpPath) {
        throw new Error('No .shp file found in ZIP (including subfolders)');
      }

      console.log('Found .shp file:', shpPath);
      console.log('Directory contents:', fs.readdirSync(path.dirname(shpPath)));

      // Read the shapefile — this is the critical async part
      const collection = await shapefile.read(shpPath);

      const features = collection.features || [];
      console.log(`Successfully parsed ${features.length} features`);

      return features;

    } catch (error) {
      console.error('Shapefile parsing error:', error);
      throw new Error(`Failed to parse shapefile: ${error.message}`);
    } finally {
      // Safe cleanup: delay to ensure file handles are closed
      setTimeout(() => {
        this.cleanupDirectory(extractDir);
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
          console.log('Cleaned up uploaded ZIP');
        }
      }, 1000); // 1 second delay is more than enough
    }
  }

  static cleanupDirectory(dir) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // Your existing validation helpers (unchanged)
  static validateGeometryType(geometry, expectedType) {
    if (!geometry || !geometry.type) return false;

    switch (expectedType) {
      case 'MultiPolygon':
        return geometry.type === 'MultiPolygon' || geometry.type === 'Polygon';
      case 'LineString':
        return geometry.type === 'LineString';
      case 'Point':
        return geometry.type === 'Point';
      default:
        return false;
    }
  }

  static convertToMultiPolygon(geometry) {
    if (geometry.type === 'Polygon') {
      return {
        type: 'MultiPolygon',
        coordinates: [geometry.coordinates]
      };
    }
    return geometry;
  }
}

module.exports = ShapefileService;