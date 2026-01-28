const Guest = require('../models/Guest');
const Room = require('../models/Room');
const pool = require('../database');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

const guestController = {
  async create(req, res) {
    try {
      
      const guest = await Guest.create(req.body);
      res.status(201).json(guest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  async getAll(req, res) {
    try {
      const guests = await Guest.findAll();
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByBooking(req, res) {
    try {
      const { booking_id } = req.params;
      const guests = await Guest.findByBooking(booking_id);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const guest = await Guest.findById(req.params.id);

      if (!guest) {
        return res.status(404).json({ error: 'Guest not found' });
      }

      res.json(guest);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const updatedGuest = await Guest.update(
        req.params.id,
        req.body
      );

      if (!updatedGuest) {
        return res.status(404).json({ error: 'Guest not found' });
      }

      res.json(updatedGuest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deletedGuest = await Guest.delete(req.params.id);

      if (!deletedGuest) {
        return res.status(404).json({ error: 'Guest not found' });
      }

      res.json({
        status: 'success',
        message: 'Guest deleted successfully',
        guest: deletedGuest
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Bulk guest booking with file upload
  async bulkBooking(req, res) {
    try {
      const { booking_id, check_in_date, check_out_date } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      if (!booking_id || !check_in_date || !check_out_date) {
        return res.status(400).json({ error: 'booking_id, check_in_date, and check_out_date are required' });
      }

      const filePath = req.file.path;
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

      let guestData = [];

      // Parse file based on extension
      if (fileExtension === 'csv') {
        guestData = await parseCSV(filePath);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        guestData = await parseExcel(filePath);
      } else {
        return res.status(400).json({ error: 'Only CSV and Excel files are supported' });
      }

      // Get available rooms with their capacities
      // Assuming getAvailableRooms() returns an array like [{ id: 1, room_number: '101', capacity: 2, status: 'available' }, ...]
      // and filters for the given check_in_date and check_out_date internally if needed
      const availableRooms = await getAvailableRooms();

      if (availableRooms.length === 0) {
        return res.status(400).json({ error: 'No rooms available for the specified dates' });
      }

      // Track remaining capacity for each room (initialize with room's max capacity)
      // We strictly iterate through availableRooms in order to fill them sequentially
      availableRooms.forEach(room => {
        room.remainingCapacity = room.metadata.capacity || 1; // Default to 1 if capacity not set
      });

      // Calculate total available slots across all rooms
      const totalAvailableSlots = availableRooms.reduce((sum, room) => sum + room.remainingCapacity, 0);

      if (totalAvailableSlots < guestData.length) {
        fs.unlinkSync(filePath); // Clean up early on error
        return res.status(400).json({
          error: `Not enough capacity available. Need ${guestData.length} slots, but only ${totalAvailableSlots} available`
        });
      }

      const results = {
        successful: [],
        failed: [],
        total: guestData.length
      };

      let currentRoomIndex = 0;

      // Process each guest
      for (let i = 0; i < guestData.length; i++) {
        const guest = guestData[i];

        try {
          // Find the next room with remaining capacity
          // Since we already checked total capacity, we assume we will find a room
          while (currentRoomIndex < availableRooms.length && availableRooms[currentRoomIndex].remainingCapacity <= 0) {
            currentRoomIndex++;
          }

          if (currentRoomIndex >= availableRooms.length) {
            // Should not be reached given the total check, but essentially means "Full"
            throw new Error('Unexpected error: No room with available capacity found despite pre-check');
          }

          const assignedRoom = availableRooms[currentRoomIndex];

          //  console.log('Assigning guest to room:', assignedRoom);
          // Create guest with room assignment
          const createdGuest = await Guest.create({
            booking_id,
            poi_id: assignedRoom.id, // Assuming Guest model has a poi_id field
            name: guest.name,
            phone: guest.phone || null,
            email: guest.email || null,
            check_in_date, // Add dates to guest if needed
            check_out_date,
            metadata: guest.metadata || {}
          });

          // Decrement remaining capacity for the assigned room
          assignedRoom.remainingCapacity -= 1;

          // Push success with details
          results.successful.push({
            guest: {
              id: createdGuest.id,
              name: createdGuest.name,
              room_id: assignedRoom.id,
              room_number: assignedRoom.room_number || assignedRoom.id // Assuming room has room_number
            }
          });

        } catch (error) {
          results.failed.push({
            guest,
            error: error.message
          });
        }
      }

      // Optionally, update room occupancies in the database
      // For example, if you have a Room model, update current_occupancy or booked_slots
      // await updateRoomOccupancies(roomCapacities, check_in_date, check_out_date);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.status(201).json({
        status: 'completed',
        results,
        summary: {
          totalAvailableSlots: totalAvailableSlots,
          usedSlots: results.successful.length,
          remainingSlots: totalAvailableSlots - results.successful.length
        }
      });

    } catch (error) {
      // Ensure file cleanup on outer error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message }); // Changed to 500 for server errors
    }
  },

  // Simple bulk guest upload without room allocation
  async uploadGuests(req, res) {
    try {
      const booking_id = req.body.booking_id || null;
      const invitation_id = req.body.invitation_id || null;
      let guestData = [];
      let fileGuestData = [];
      let arrayGuestData = [];

      // Handle file upload if present
      if (req.file) {
        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        
        if (fileExtension === 'csv') {
          fileGuestData = await parseCSV(filePath);
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
          fileGuestData = await parseExcel(filePath);
        } else {
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: 'Only CSV and Excel files are supported' });
        }
        
        fs.unlinkSync(filePath);
      }

      // Handle array data if present
      if (req.body.guests && Array.isArray(req.body.guests)) {
        arrayGuestData = req.body.guests;
      }

      // Combine both sources
      guestData = [...fileGuestData, ...arrayGuestData];

      if (guestData.length === 0) {
        return res.status(400).json({ error: 'Either file or guests array is required' });
      }
      
      // Bulk create guests
      const results = await Guest.bulkCreate(guestData.map(g => ({
        ...g,
        booking_id,
        invitation_id
      })));

      res.status(201).json({
        status: 'completed',
        total: guestData.length,
        successful: results.successful.length,
        failed: results.failed.length,
        results
      });

    } catch (error) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  }
};

// Helper function to parse CSV
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Helper function to parse Excel
function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

// Helper function to get available rooms
async function 
getAvailableRooms() {
  const query = `
    SELECT r.*
    FROM pois r
    WHERE (r->>'status')::int = 0
  `;

  const result = await pool.query(query);
  return result.rows;
}

module.exports = { guestController, upload };