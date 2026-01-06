const Booking = require('../models/Booking');
const User = require('../models/Users');
const Event = require('../models/Event');
const Guest = require('../models/Guest');
const RoomAllocation = require('../models/RoomAllocation');
const pool = require('../database');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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

const bookingController = {
  /**
   * Create booking
   */
  async create(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        building_id,
        booking_category,
        host_name,
        host_email,
        start_date,
        end_date,
        host_phone,
        events,
        metadata
      } = req.body;

      // Handle events from both direct events parameter and metadata.events
      let eventsList = [];
      if (events && Array.isArray(events)) {
        eventsList = events;
      } else if (metadata?.events) {
        eventsList = [metadata.events];
      }

      
      if (!building_id || !booking_category || !host_name || !host_email || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create or find user
      let user = await User.findByEmail(host_email);
      
      if (!user) {
        const randomPassword = host_email.split('@')[0];
        
        user = await User.create({
          email: host_email,
          phone: host_phone || null,
          name: host_name,
          role: 'host',
          password: randomPassword
        });
      }
      
      // Create booking
      const bookingData = { 
        building_id,
        booking_category,
        host_id: user.id,
        host_name,
        host_email,
        host_phone,
        start_date,
        end_date,
        status: req.body.status || 'confirmed',
        guest_count: req.body.guest_count,
        host_metadata: req.body.host_metadata || {},
        metadata: req.body.metadata || {}
      };

      const booking = await Booking.create(bookingData);

      // Create events if provided (optional)
      let createdEvents = [];
      if (eventsList && Array.isArray(eventsList) && eventsList.length > 0) {
        for (const eventData of eventsList) {
          console.log('Processing event data:', eventData);
          const { event_name, venue_id,  start_date, end_date } = eventData;
          
          if (event_name) {
            // Find venue_id by venue_name if provided
            
            // if (venue_id) {
            //   const venueQuery = 'SELECT id FROM pois WHERE name = $1 AND category = $2';
            //   const venueResult = await client.query(venueQuery, [venue_name, 'venue']);
            //   if (venueResult.rows.length > 0) {
            //     venue_id = venueResult.rows[0].id;
            //   }
            // }
            
            const event = await Event.create({
              booking_id: booking.id,
              name: event_name,
              venue_id: venue_id,
              event_type: 'general',
              start_time: start_date,
              end_time: end_date,
              description: null,
              metadata: {}
            });
            createdEvents.push(event);
          }
        }
      }

      // Handle guest file upload and room allocation if file is provided
      let guestResults = null;
      let allocationResults = null;
      
      if (req.file) {
        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

        let guestData = [];

        // Parse file based on extension
        if (fileExtension === 'csv') {
          guestData = await parseCSV(filePath);
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
          guestData = await parseExcel(filePath);
        } else {
          fs.unlinkSync(filePath);
          throw new Error('Only CSV and Excel files are supported');
        }

        // Create guests
        guestResults = await Guest.bulkCreate(guestData.map(g => ({
          ...g,
          booking_id: booking.id
        })));
        console.log('Guest creation results:', guestResults);
        // Allocate rooms if guests were created successfully
        if (guestResults.successful.length > 0) {
          const guestIds = guestResults.successful.map(g => g.id);
          
          allocationResults = await RoomAllocation.bulkAllocate(
            guestIds,
            start_date,
            end_date,
            booking.id
          );
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);
      }
      
      await client.query('COMMIT');
      
      const response = {
        status: 'success',
        booking,
        events: createdEvents,
        host: { id: user.id, email: user.email }
      };

      // Add guest and allocation results if file was uploaded
      if (guestResults) {
        response.guests = {
          total: guestResults.successful.length + guestResults.failed.length,
          successful: guestResults.successful.length,
          failed: guestResults.failed.length,
          results: guestResults
        };
      }

      if (allocationResults) {
        response.allocations = {
          total: allocationResults.successful.length + allocationResults.failed.length,
          successful: allocationResults.successful.length,
          failed: allocationResults.failed.length,
          results: allocationResults
        };
      }
      
      res.status(201).json(response);

    } catch (error) {
      await client.query('ROLLBACK');
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  /**
   * Get all bookings
   */
  async getAll(req, res) {
    try {
      const bookings = await Booking.findAll();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get booking by ID
   */
  async getById(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Bulk upload guests for a booking
   */
  async bulkUploadGuests(req, res) {
    try {
      const { booking_id } = req.params;
      const { guests } = req.body;

      if (!Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ error: 'Guests array is required' });
      }

      const insertedGuests = await Booking.bulkCreateGuests(
        booking_id,
        guests
      );

      res.status(201).json({
        status: 'success',
        total: guests.length,
        inserted: insertedGuests.length,
        guests: insertedGuests
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Update booking
   */
  async update(req, res) {
    try {
      const updatedBooking = await Booking.update(
        req.params.id,
        req.body
      );

      if (!updatedBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(updatedBooking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Delete booking
   */
  async delete(req, res) {
    try {
      const deletedBooking = await Booking.delete(req.params.id);

      if (!deletedBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json({
        status: 'success',
        message: 'Booking deleted successfully',
        booking: deletedBooking
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Upload guest file and allocate rooms
   */
  async uploadGuestsWithAllocation(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const { booking_id } = req.params;
      const { check_in_date, check_out_date } = req.body;
      
      if (!check_in_date || !check_out_date) {
        return res.status(400).json({ error: 'check_in_date and check_out_date are required' });
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
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'Only CSV and Excel files are supported' });
      }

      // Create guests first
      const guestResults = await Guest.bulkCreate(guestData.map(g => ({
        ...g,
        booking_id
      })));

      if (guestResults.successful.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'No guests could be created' });
      }

      // Extract guest IDs for allocation
      const guestIds = guestResults.successful.map(g => g.id);

      // Allocate rooms
      const allocationResults = await RoomAllocation.bulkAllocate(
        guestIds,
        check_in_date,
        check_out_date,
        booking_id
      );

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.status(201).json({
        status: 'completed',
        guests: {
          total: guestData.length,
          successful: guestResults.successful.length,
          failed: guestResults.failed.length
        },
        allocations: {
          total: guestIds.length,
          successful: allocationResults.successful.length,
          failed: allocationResults.failed.length
        },
        results: {
          guests: guestResults,
          allocations: allocationResults
        }
      });

    } catch (error) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = { bookingController, upload };