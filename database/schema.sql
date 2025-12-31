-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Units table (areas like shops, facilities, rooms)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, 
    -- category VARCHAR(100),
    feature_type VARCHAR(20) DEFAULT 'unit' CHECK (feature_type = 'unit'), 
    floor_id UUID NOT NULL REFERENCES floors(id), 
    building_id VARCHAR(100),
    -- area DECIMAL GENERATED ALWAYS AS (ST_Area(geometry::geography)) STORED,  
    metadata JSONB DEFAULT '{}', 
    -- show BOOLEAN DEFAULT true, 
    -- unit_type VARCHAR(255), 
    -- display_point BOOLEAN DEFAULT true, 
    -- accessibility BOOLEAN DEFAULT false, 
    -- restriction BOOLEAN DEFAULT false, 
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- Routes table (walkable paths) 


CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    from_poi_id UUID, 
    to_poi_id UUID, 
    building_id VARCHAR(100),
    floor_id UUID NOT NULL REFERENCES floors(id),  
    distance DECIMAL GENERATED ALWAYS AS (ST_Length(geometry::geography)) STORED,
    geometry GEOMETRY(LINESTRING, 4326) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POIs table (points of interest)
CREATE TABLE pois (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    floor_id UUID  REFERENCES floors(id),
    metadata JSONB DEFAULT '{}',
    -- floor_name VARCHAR(100),
    geom GEOMETRY(POINT, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spatial indexes
CREATE INDEX idx_units_geometry ON units USING GIST (geometry);
CREATE INDEX idx_routes_geometry ON routes USING GIST (geometry);
CREATE INDEX idx_pois_geometry ON pois USING GIST (geometry);

-- Additional indexes
CREATE INDEX idx_units_floor_id ON units (floor_id);
CREATE INDEX idx_routes_floor_id ON routes (floor_id);
CREATE INDEX idx_pois_type ON pois (type);
CREATE INDEX idx_pois_building_id ON pois (building_id);

-- Foreign key constraints
ALTER TABLE routes ADD CONSTRAINT fk_routes_from_poi FOREIGN KEY (from_poi_id) REFERENCES pois(id);
ALTER TABLE routes ADD CONSTRAINT fk_routes_to_poi FOREIGN KEY (to_poi_id) REFERENCES pois(id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pois_updated_at BEFORE UPDATE ON pois FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Hotel & Event Management Table

-- Buildings table
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotels table
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    building_id UUID NOT NULL REFERENCES buildings(id),
    contact_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Floors table
CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id),
    floor_name VARCHAR(10) NOT NULL,
    name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table (linked to units)
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(50) NOT NULL,
    floor_id UUID NOT NULL REFERENCES floors(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    room_type VARCHAR(50),
    capacity INTEGER,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venues table (linked to units)
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    floor_id UUID NOT NULL REFERENCES floors(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    venue_type VARCHAR(50),
    capacity INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floors_id 
    booking_category VARCHAR(50) NOT NULL,
    host_id VARCHAR(100)
    host_name VARCHAR(255) NOT NULL,
    host_metadata JSONB DEFAULT '{}',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    guest_count INTEGER,
    status VARCHAR(20) DEFAULT 'confirmed',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guests table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    guest_type VARCHAR(50) DEFAULT 'guest',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room allocations table
CREATE TABLE room_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    guest_id UUID NOT NULL REFERENCES guests(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'allocated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    venue_id UUID NOT NULL REFERENCES venues(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guest events table
CREATE TABLE guest_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id),
    event_id UUID NOT NULL REFERENCES events(id),
    attendance_status VARCHAR(20) DEFAULT 'invited',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guest devices table
CREATE TABLE guest_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id),
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id),
    event_id UUID REFERENCES events(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    unit_id UUID REFERENCES units(id),
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE request_form_data (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    preferred_date DATE,
    number_of_buildings VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RBAC Model
CREATE TYPE user_role AS ENUM ('admin', 'host', 'guest');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'guest',
    name VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    building_id UUID REFERENCES buildings(id),
    unit_id UUID REFERENCES units(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Additional indexes
CREATE INDEX idx_hotels_building_id ON hotels (building_id);
CREATE INDEX idx_floors_building_id ON floors (building_id);
CREATE INDEX idx_rooms_floor_id ON rooms (floor_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- Update triggers for new tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();rooms_unit_id ON rooms (unit_id);
CREATE INDEX idx_venues_unit_id ON venues (unit_id);
CREATE INDEX idx_guests_booking_id ON guests (booking_id);
CREATE INDEX idx_room_allocations_guest_id ON room_allocations (guest_id);
CREATE INDEX idx_events_booking_id ON events (booking_id);
CREATE INDEX idx_events_venue_id ON events (venue_id);
CREATE INDEX idx_guest_events_guest_id ON guest_events (guest_id);
CREATE INDEX idx_guest_events_event_id ON guest_events (event_id);
CREATE INDEX idx_notifications_guest_id ON notifications (guest_id);
CREATE INDEX idx_guest_devices_guest_id ON guest_devices (guest_id);

-- Update triggers for new tables
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON floors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_allocations_updated_at BEFORE UPDATE ON room_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guest_events_updated_at BEFORE UPDATE ON guest_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guest_devices_updated_at BEFORE UPDATE ON guest_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();