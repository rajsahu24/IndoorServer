-- Navigation Query Examples for Hotel Event Management

-- 1. Guest to Room Navigation
-- Find nearest POIs from guest's current room to target room
WITH guest_room AS (
  SELECT u.id as unit_id, ST_AsGeoJSON(u.geometry) as geometry
  FROM room_allocations ra
  JOIN rooms r ON ra.room_id = r.id
  JOIN units u ON r.unit_id = u.id
  WHERE ra.guest_id = '550e8400-e29b-41d4-a716-446655440003' 
    AND ra.status = 'allocated'
),
target_unit AS (
  SELECT id as unit_id, ST_AsGeoJSON(geometry) as geometry
  FROM units 
  WHERE id = '550e8400-e29b-41d4-a716-446655440008'
),
start_poi AS (
  SELECT 'start' as type, p.id, p.name, ST_AsGeoJSON(p.geometry) as geometry
  FROM pois p, guest_room gr
  ORDER BY ST_Distance(p.geometry::geography, gr.geometry::geography)
  LIMIT 1
),
end_poi AS (
  SELECT 'end' as type, p.id, p.name, ST_AsGeoJSON(p.geometry) as geometry
  FROM pois p, target_unit tu
  ORDER BY ST_Distance(p.geometry::geography, tu.geometry::geography)
  LIMIT 1
)
SELECT * FROM start_poi
UNION ALL
SELECT * FROM end_poi;

-- 2. Guest to Event Venue Navigation
-- Find route from guest room to event venue
WITH guest_location AS (
  SELECT u.geometry
  FROM room_allocations ra
  JOIN rooms r ON ra.room_id = r.id
  JOIN units u ON r.unit_id = u.id
  WHERE ra.guest_id = '550e8400-e29b-41d4-a716-446655440003'
),
venue_location AS (
  SELECT u.geometry
  FROM venues v
  JOIN units u ON v.unit_id = u.id
  WHERE v.id = '550e8400-e29b-41d4-a716-446655440002'
)
SELECT 
  r.id,
  r.distance,
  ST_AsGeoJSON(r.geometry) as route_geometry,
  p1.name as from_poi_name,
  p2.name as to_poi_name
FROM routes r
JOIN pois p1 ON r.from_poi_id = p1.id
JOIN pois p2 ON r.to_poi_id = p2.id,
guest_location gl,
venue_location vl
WHERE ST_DWithin(p1.geometry::geography, gl.geometry::geography, 100)
  AND ST_DWithin(p2.geometry::geography, vl.geometry::geography, 100)
ORDER BY r.distance
LIMIT 1;

-- 3. Get All POIs on Guest's Floor
SELECT 
  p.id,
  p.name,
  p.type,
  ST_AsGeoJSON(p.geometry) as geometry,
  p.metadata
FROM pois p
JOIN room_allocations ra ON p.floor = (
  SELECT f.floor_number
  FROM room_allocations ra2
  JOIN rooms r ON ra2.room_id = r.id
  JOIN floors f ON r.floor_id = f.id
  WHERE ra2.guest_id = '550e8400-e29b-41d4-a716-446655440003'
)
WHERE ra.guest_id = '550e8400-e29b-41d4-a716-446655440003'
ORDER BY p.type, p.name;

-- 4. Find Shortest Path Between Two Units
-- Using PostGIS to calculate direct distance between units
SELECT 
  u1.name as from_unit,
  u2.name as to_unit,
  ST_Distance(u1.geometry::geography, u2.geometry::geography) as direct_distance,
  ST_AsGeoJSON(ST_MakeLine(
    ST_Centroid(u1.geometry),
    ST_Centroid(u2.geometry)
  )) as direct_line
FROM units u1, units u2
WHERE u1.id = '550e8400-e29b-41d4-a716-446655440007'  -- source unit
  AND u2.id = '550e8400-e29b-41d4-a716-446655440008'; -- target unit

-- 5. Get Event Schedule with Navigation Info for Guest
SELECT 
  e.id,
  e.name,
  e.event_type,
  e.start_time,
  e.end_time,
  v.name as venue_name,
  u.id as venue_unit_id,
  u.name as venue_unit_name,
  ST_AsGeoJSON(u.geometry) as venue_geometry,
  ge.attendance_status
FROM guest_events ge
JOIN events e ON ge.event_id = e.id
JOIN venues v ON e.venue_id = v.id
JOIN units u ON v.unit_id = u.id
WHERE ge.guest_id = '550e8400-e29b-41d4-a716-446655440003'
  AND e.start_time >= CURRENT_TIMESTAMP
ORDER BY e.start_time;

-- 6. Bulk Navigation Data for Mobile App
-- Get guest's room, upcoming events, and nearby POIs in one query
WITH guest_info AS (
  SELECT 
    g.id as guest_id,
    g.name as guest_name,
    r.room_number,
    u.id as room_unit_id,
    u.name as room_unit_name,
    ST_AsGeoJSON(u.geometry) as room_geometry,
    f.floor_number
  FROM guests g
  JOIN room_allocations ra ON g.id = ra.guest_id
  JOIN rooms r ON ra.room_id = r.id
  JOIN units u ON r.unit_id = u.id
  JOIN floors f ON r.floor_id = f.id
  WHERE g.id = '550e8400-e29b-41d4-a716-446655440003'
    AND ra.status = 'allocated'
),
upcoming_events AS (
  SELECT 
    e.id,
    e.name,
    e.start_time,
    v.name as venue_name,
    vu.id as venue_unit_id,
    ST_AsGeoJSON(vu.geometry) as venue_geometry
  FROM guest_events ge
  JOIN events e ON ge.event_id = e.id
  JOIN venues v ON e.venue_id = v.id
  JOIN units vu ON v.unit_id = vu.id
  WHERE ge.guest_id = '550e8400-e29b-41d4-a716-446655440003'
    AND e.start_time >= CURRENT_TIMESTAMP
  ORDER BY e.start_time
  LIMIT 3
),
nearby_pois AS (
  SELECT 
    p.id,
    p.name,
    p.type,
    ST_AsGeoJSON(p.geometry) as geometry,
    ST_Distance(p.geometry::geography, gi.room_geometry::geography) as distance
  FROM pois p, guest_info gi
  WHERE p.floor = gi.floor_number
  ORDER BY distance
  LIMIT 10
)
SELECT 
  'guest_info' as data_type,
  json_build_object(
    'guest_id', gi.guest_id,
    'room_number', gi.room_number,
    'room_unit_id', gi.room_unit_id,
    'room_geometry', gi.room_geometry,
    'floor_number', gi.floor_number
  ) as data
FROM guest_info gi
UNION ALL
SELECT 
  'upcoming_events' as data_type,
  json_agg(ue.*) as data
FROM upcoming_events ue
UNION ALL
SELECT 
  'nearby_pois' as data_type,
  json_agg(np.*) as data
FROM nearby_pois np;