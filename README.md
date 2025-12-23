# Indoor Navigation API

PostgreSQL + PostGIS database with Node.js Express REST APIs for indoor navigation system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Initialize database:
```bash
npm run init-db
```

4. Start server:
```bash
npm run dev
```

## API Endpoints

### Units (Areas like shops, facilities, rooms)
- `POST /api/units` - Create unit
- `GET /api/units` - Get all units
- `GET /api/units/:id` - Get unit by ID
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Routes (Walkable paths)
- `POST /api/routes` - Create route
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get route by ID
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route

### POIs (Points of interest)
- `POST /api/pois` - Create POI
- `GET /api/pois` - Get all POIs
- `GET /api/pois/:id` - Get POI by ID
- `PUT /api/pois/:id` - Update POI
- `DELETE /api/pois/:id` - Delete POI

### Bulk Upload (Shapefile ZIP)
- `POST /api/upload/units` - Bulk upload units from shapefile
- `POST /api/upload/routes` - Bulk upload routes from shapefile
- `POST /api/upload/pois` - Bulk upload POIs from shapefile

## Features

- PostGIS spatial data support
- GeoJSON input/output
- Auto-calculated area for units
- Auto-calculated distance for routes
- JSONB metadata storage
- Spatial indexing (GIST)
- UUID primary keys
- Timestamp tracking
- Bulk shapefile upload (ZIP format)
- Transaction-based bulk inserts
- Geometry validation and conversion
- Error tracking for failed records

## Best Practices

- Geometry validation enforced at database level
- Proper error handling and HTTP status codes
- CORS and security headers enabled
- Environment-based configuration
- Spatial indexes for performance

## Scaling Considerations

- Add building/floor hierarchy tables
- Implement spatial queries for indoor routing
- Add caching layer (Redis)
- Consider read replicas for high traffic
- Implement pagination for large datasets