const pool = require('../database');

class RoomAllocation {
  /**
   * Create room allocation
   */
  static async create(data) {
    const {
      booking_id,
      guest_id,
      poi_id,
      check_in_date,
      check_out_date,
      status = 1
    } = data;

    if (!booking_id || !guest_id || !poi_id || !check_in_date || !check_out_date) {
      throw new Error('booking_id, guest_id, poi_id, check_in_date and check_out_date are required');
    }

    const query = `
      INSERT INTO room_allocations
        (booking_id, guest_id, poi_id, check_in_date, check_out_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      booking_id,
      guest_id,
      poi_id,
      check_in_date,
      check_out_date,
      status
    ]);

    return result.rows[0];
  }

  /**
   * Get all room allocations
   */
  static async findAll() {
    const query = `
      SELECT 
             r.name AS room_name,
             g.name AS guest_name,
             b.host_name AS client_name
      FROM room_allocations ra
      JOIN pois r ON ra.poi_id = r.id
      JOIN guests g ON ra.guest_id = g.id
      JOIN bookings b ON ra.booking_id = b.id
      ORDER BY ra.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get allocation by ID
   */
  static async findById(id) {
    const query = `
      SELECT 
             r.name AS poi_name,
             g.name AS guest_name,
             b.host_name AS booking_client
      FROM room_allocations ra
      JOIN pois r ON ra.poi_id = r.id
      JOIN guests g ON ra.guest_id = g.id
      JOIN bookings b ON ra.booking_id = b.id
      WHERE ra.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update allocation
   */
  static async update(id, data) {
    const { check_in_date, check_out_date, status, booking_id, guest_id, poi_id } = data;

    const query = `
      UPDATE room_allocations
      SET
        booking_id = COALESCE($5, booking_id),
        guest_id = COALESCE($6, guest_id),
        poi_id = COALESCE($7, poi_id),
        check_in_date = COALESCE($2, check_in_date),
        check_out_date = COALESCE($3, check_out_date),
        status = COALESCE($4, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      
      check_in_date,
      check_out_date,
      status,
      booking_id,
      guest_id,
      poi_id
    ]);

    return result.rows[0];
  }

  /**
   * Delete allocation
   */
  static async delete(id) {
    const query = `
      DELETE FROM room_allocations
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get available rooms with capacity
   */
  static async getAvailableRooms() {
    const query = `
      SELECT p.id, p.name, p.capacity, p.metadata
      FROM pois p
      WHERE p.category = 'Room' 
        AND p.status = 0
        AND p.id NOT IN (
          SELECT DISTINCT poi_id 
          FROM room_allocations 
          WHERE status = 1
        )
      ORDER BY p.capacity ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Bulk allocate rooms to guests
   */
  static async bulkAllocate(guestIds, checkInDate, checkOutDate, booking_id) {
    const client = await pool.connect();
    const results = { successful: [], failed: [] };
    
    try {
      await client.query('BEGIN');
      
      // Get available rooms
      const availableRoomsResult = await client.query(`
        SELECT p.id, p.name, p.capacity, p.metadata
        FROM pois p
        WHERE p.category = 'Room' 
          AND p.status = 0
          AND p.id NOT IN (
            SELECT DISTINCT poi_id 
            FROM room_allocations 
            WHERE status = 1
          )
        ORDER BY p.capacity ASC
      `);
      
      let availableRooms = availableRoomsResult.rows;
      
      if (availableRooms.length === 0) {
        throw new Error('No rooms available');
      }
      
      // Get guests with their types
      const guestQuery = `
        SELECT id, name, guest_type
        FROM guests 
        WHERE id = ANY($1)
      `;
      const guestResult = await client.query(guestQuery, [guestIds]);
      const guests = guestResult.rows;

      // Sort guests by priority (Family > Friends > Individual)
      const guestPriority = { 'family': 3, 'friend': 2, 'guest': 1 };
      guests.sort((a, b) => (guestPriority[b.guest_type] || 0) - (guestPriority[a.guest_type] || 0));
      
      for (const guest of guests) {
        try {
          if (availableRooms.length === 0) {
            throw new Error('No more rooms available');
          }
          
          // Select room based on guest type
          let selectedRoom;
          let roomIndex;
          
          if (guest.guest_type === 'family') {
            // Find largest available room
            roomIndex = availableRooms.reduce((maxIdx, room, idx) => 
              (room.capacity || 1) > (availableRooms[maxIdx].capacity || 1) ? idx : maxIdx, 0
            );
            selectedRoom = availableRooms[roomIndex];
          } else if (guest.guest_type === 'guest') {
            // Find smallest available room (first one since sorted by capacity ASC)
            roomIndex = 0;
            selectedRoom = availableRooms[0];
          } else {
            // Friends or default - medium capacity
            roomIndex = Math.floor(availableRooms.length / 2);
            selectedRoom = availableRooms[roomIndex];
          }
          
          // Create allocation
          const allocationQuery = `
            INSERT INTO room_allocations (booking_id, guest_id, poi_id, check_in_date, check_out_date, status)
            VALUES ($1, $2, $3, $4, $5, 1)
            RETURNING *
          `;
          
          const allocation = await client.query(allocationQuery, [
            booking_id,
            guest.id,
            selectedRoom.id,
            checkInDate,
            checkOutDate
          ]);
          
          // Update room status to unavailable
          await client.query('UPDATE pois SET status = 1 WHERE id = $1', [selectedRoom.id]);
          
          // Remove room from available list
          availableRooms.splice(roomIndex, 1);
          
          results.successful.push({
            guest: guest.name,
            room: selectedRoom.name,
            allocation: allocation.rows[0]
          });
          
        } catch (error) {
          results.failed.push({
            guest: guest.name,
            error: error.message
          });
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    return results;
  }
}

module.exports = RoomAllocation;
