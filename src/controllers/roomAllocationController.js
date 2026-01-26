  const RoomAllocation = require('../models/RoomAllocation');
  const Guest = require('../models/Guest');
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

  const roomAllocationController = {
    async create(req, res) {
      try {
        const allocation = await RoomAllocation.create(req.body);
        res.status(201).json(allocation);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    async getAll(req, res) {
      try {
        const allocations = await RoomAllocation.findAll();
        res.json(allocations);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async getById(req, res) {
      try {
        const allocation = await RoomAllocation.findById(req.params.id);

        if (!allocation) {
          return res.status(404).json({ error: 'Room allocation not found' });
        }

        res.json(allocation);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async update(req, res) {
      try {
        const updatedAllocation = await RoomAllocation.update(
          req.params.id,
          req.body
        );

        if (!updatedAllocation) {
          return res.status(404).json({ error: 'Room allocation not found' });
        }

        res.json(updatedAllocation);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    async delete(req, res) {
      try {
        const deletedAllocation = await RoomAllocation.delete(req.params.id);

        if (!deletedAllocation) {
          return res.status(404).json({ error: 'Room allocation not found' });
        }

        res.json({
          status: 'success',
          message: 'Room allocation deleted successfully',
          allocation: deletedAllocation
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async bulkAllocate(req, res) {
      try {
        const { guest_ids, check_in_date, check_out_date, booking_id } = req.body;

        if (!guest_ids || !Array.isArray(guest_ids) || guest_ids.length === 0) {
          return res.status(400).json({ error: 'guest_ids array is required' });
        }

        if (!check_in_date || !check_out_date || !booking_id) {
          return res.status(400).json({ error: 'guest_ids, check_in_date, check_out_date, and booking_id are required' });
        }

        const results = await RoomAllocation.bulkAllocate(
          guest_ids,
          check_in_date,
          check_out_date,
          booking_id
        );

        res.status(201).json({
          status: 'completed',
          total: guest_ids.length,
          successful: results.successful.length,
          failed: results.failed.length,
          results
        });

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async bulkAllocateFromFile(req, res) {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'File is required' });
        }

        const { booking_id, check_in_date, check_out_date } = req.body;
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
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: 'Only CSV and Excel files are supported' });
        }

        // Create guests first
        const guestResults = await Guest.bulkCreate(guestData.map(g => ({
          ...g,
          // booking_id
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

  module.exports = { roomAllocationController, upload };
