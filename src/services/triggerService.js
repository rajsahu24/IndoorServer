const pool = require('../database');
const fs = require('fs');
const path = require('path');

class TriggerService {
  static async initializeTriggers() {
    try {
      const triggerPath = path.join(__dirname, '../database/triggers/poi_venue_trigger.sql');
      const triggerSQL = fs.readFileSync(triggerPath, 'utf8');
      
      await pool.query(triggerSQL);
      console.log('POI-Venue trigger initialized successfully');
    } catch (error) {
      console.error('Error initializing triggers:', error);
      throw error;
    }
  }
}

module.exports = TriggerService;