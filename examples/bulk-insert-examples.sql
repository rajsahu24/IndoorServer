-- Bulk INSERT examples for shapefile data

-- Units bulk insert with Polygon to MultiPolygon conversion
INSERT INTO units (name, category, level_id, metadata, geometry)
VALUES 
  ('Shop A', 'retail', 'L1', '{"description": "Electronics store"}', ST_Multi(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-74.006,40.7128],[-74.005,40.7128],[-74.005,40.7138],[-74.006,40.7138],[-74.006,40.7128]]]}'))),
  ('Shop B', 'food', 'L1', '{"opening_hours": "9-21"}', ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[[[-74.007,40.7129],[-74.006,40.7129],[-74.006,40.7139],[-74.007,40.7139],[-74.007,40.7129]]]]}'));

-- Routes bulk insert with auto-calculated distance
INSERT INTO routes (from_poi_id, to_poi_id, level_id, geometry)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'L1', ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[-74.006,40.7128],[-74.0055,40.7133],[-74.005,40.7138]]}')),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'L1', ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[-74.005,40.7138],[-74.004,40.7148]]}'));

-- POIs bulk insert
INSERT INTO pois (name, type, floor, building_id, metadata, geometry)
VALUES 
  ('Entrance A', 'entrance', '1', 'building_001', '{"accessibility": true}', ST_GeomFromGeoJSON('{"type":"Point","coordinates":[-74.006,40.7128]}')),
  ('Elevator 1', 'lift', '1', 'building_001', '{"capacity": 8}', ST_GeomFromGeoJSON('{"type":"Point","coordinates":[-74.0055,40.7133]}')),
  ('Stairs A', 'stairs', '1', 'building_001', '{"emergency_exit": true}', ST_GeomFromGeoJSON('{"type":"Point","coordinates":[-74.005,40.7138]}'));

-- Prepared statement examples for bulk operations
PREPARE insert_unit (text, text, text, jsonb, geometry) AS
  INSERT INTO units (name, category, level_id, metadata, geometry)
  VALUES ($1, $2, $3, $4, $5);

PREPARE insert_route (uuid, uuid, text, geometry) AS
  INSERT INTO routes (from_poi_id, to_poi_id, level_id, geometry)
  VALUES ($1, $2, $3, $4);

PREPARE insert_poi (text, text, text, text, jsonb, geometry) AS
  INSERT INTO pois (name, type, floor, building_id, metadata, geometry)
  VALUES ($1, $2, $3, $4, $5, $6);

-- Usage examples:
-- EXECUTE insert_unit('Shop Name', 'retail', 'L1', '{}', ST_GeomFromGeoJSON('...'));
-- EXECUTE insert_route('uuid1', 'uuid2', 'L1', ST_GeomFromGeoJSON('...'));
-- EXECUTE insert_poi('POI Name', 'entrance', '1', 'building_001', '{}', ST_GeomFromGeoJSON('...'));