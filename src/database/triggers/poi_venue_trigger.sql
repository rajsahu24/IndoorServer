-- Trigger function to automatically insert/update venue records when POI category is 'Venue'
CREATE OR REPLACE FUNCTION trg_insert_venue_from_poi()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if category is 'Venue' (case-insensitive)
    IF NEW.category IS NOT NULL AND LOWER(TRIM(NEW.category)) = 'venue' THEN
        -- Avoid duplicate venue for same POI
        IF NOT EXISTS (SELECT 1 FROM venues WHERE poi_id = NEW.id) THEN
            INSERT INTO venues (
                poi_id,
                name,
                metadata,
                status
            )
            VALUES (
                NEW.id,
                NEW.name,
                NEW.metadata,
                NEW.status
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for updates
CREATE OR REPLACE FUNCTION trg_update_venue_from_poi()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle category change to 'Venue'
    IF NEW.category IS NOT NULL AND LOWER(TRIM(NEW.category)) = 'venue' THEN
        -- Insert if doesn't exist
        IF NOT EXISTS (SELECT 1 FROM venues WHERE poi_id = NEW.id) THEN
            INSERT INTO venues (
                poi_id,
                name,
                metadata,
                status
            )
            VALUES (
                NEW.id,
                NEW.name,
                NEW.metadata,
                NEW.status
            );
        ELSE
            -- Update existing venue
            UPDATE venues SET
                name = NEW.name,
                metadata = NEW.metadata,
                status = NEW.status
            WHERE poi_id = NEW.id;
        END IF;
    -- Handle category change from 'Venue' to something else
    ELSIF OLD.category IS NOT NULL AND LOWER(TRIM(OLD.category)) = 'venue' 
          AND (NEW.category IS NULL OR LOWER(TRIM(NEW.category)) != 'venue') THEN
        -- Remove from venues table
        DELETE FROM venues WHERE poi_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on POI table
DROP TRIGGER IF EXISTS poi_venue_insert_trigger ON pois;
CREATE TRIGGER poi_venue_insert_trigger
    AFTER INSERT ON pois
    FOR EACH ROW
    EXECUTE FUNCTION trg_insert_venue_from_poi();

DROP TRIGGER IF EXISTS poi_venue_update_trigger ON pois;
CREATE TRIGGER poi_venue_update_trigger
    AFTER UPDATE ON pois
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_venue_from_poi();