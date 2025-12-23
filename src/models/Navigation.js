const pool = require('../database');

class Navigation {
  static async getPOIsByFloor(floor, building_id) {
    const query = `
      SELECT id, name, type, ST_AsGeoJSON(geometry) as geometry, metadata
      FROM pois 
      WHERE floor = $1 AND building_id = $2
      ORDER BY type, name`;
    const result = await pool.query(query, [floor, building_id]);
    return result.rows;
  }

  static async getRouteBetweenPOIs(from_poi_id, to_poi_id) {
    const query = `
      SELECT id, distance, ST_AsGeoJSON(geometry) as geometry, level_id
      FROM routes 
      WHERE from_poi_id = $1 AND to_poi_id = $2
      ORDER BY distance ASC
      LIMIT 1`;
    const result = await pool.query(query, [from_poi_id, to_poi_id]);
    return result.rows[0];
  }

  static async getNavigationToRoom(guest_id, target_unit_id) {
    const query = `
      WITH guest_room AS (
        SELECT u.id as unit_id, ST_AsGeoJSON(u.geometry) as geometry
        FROM room_allocations ra
        JOIN rooms r ON ra.room_id = r.id
        JOIN units u ON r.unit_id = u.id
        WHERE ra.guest_id = $1 AND ra.status = 'allocated'
      ),
      target_unit AS (
        SELECT id as unit_id, ST_AsGeoJSON(geometry) as geometry
        FROM units WHERE id = $2
      ),
      nearest_pois AS (
        SELECT 'start' as type, p.id, p.name, ST_AsGeoJSON(p.geometry) as geometry,
               ST_Distance(p.geometry::geography, gr.geometry::geography) as distance
        FROM pois p, guest_room gr
        ORDER BY ST_Distance(p.geometry::geography, gr.geometry::geography)
        LIMIT 1
      ),
      target_pois AS (
        SELECT 'end' as type, p.id, p.name, ST_AsGeoJSON(p.geometry) as geometry,
               ST_Distance(p.geometry::geography, tu.geometry::geography) as distance
        FROM pois p, target_unit tu
        ORDER BY ST_Distance(p.geometry::geography, tu.geometry::geography)
        LIMIT 1
      )
      SELECT * FROM nearest_pois
      UNION ALL
      SELECT * FROM target_pois
    `;
    const result = await pool.query(query, [guest_id, target_unit_id]);
    return result.rows;
  }

  static async getNavigationToVenue(guest_id, venue_id) {
    const query = `
      WITH guest_room AS (
        SELECT u.id as unit_id, ST_AsGeoJSON(u.geometry) as geometry
        FROM room_allocations ra
        JOIN rooms r ON ra.room_id = r.id
        JOIN units u ON r.unit_id = u.id
        WHERE ra.guest_id = $1 AND ra.status = 'allocated'
      ),
      venue_unit AS (
        SELECT u.id as unit_id, ST_AsGeoJSON(u.geometry) as geometry
        FROM venues v
        JOIN units u ON v.unit_id = u.id
        WHERE v.id = $2
      ),
      start_poi AS (
        SELECT 'start' as type, p.id, p.name, ST_AsGeoJSON(p.geometry) as geometry
        FROM pois p, guest_room gr
        ORDER BY ST_Distance(p.geometry::geography, gr.geometry::geography)
        LIMIT 1
      ),
      end_poi AS (
        SELECT 'end' as type, p.id, p.name, ST_AsGeoJSON(p.geometry) as geometry
        FROM pois p, venue_unit vu
        ORDER BY ST_Distance(p.geometry::geography, vu.geometry::geography)
        LIMIT 1
      )
      SELECT * FROM start_poi
      UNION ALL
      SELECT * FROM end_poi
    `;
    const result = await pool.query(query, [guest_id, venue_id]);
    return result.rows;
  }
}

module.exports = Navigation;