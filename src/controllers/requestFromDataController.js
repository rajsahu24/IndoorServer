const request_form_data = require('../models/RequestFormData');

const requestFromDataController = {
  async create(req, res) {
    try {
      const newRequestFormData = await request_form_data.create(req.body);
      res.status(201).json(newRequestFormData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const allRequestFormData = await request_form_data.getAll();
      res.json(allRequestFormData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const requestFormData = await request_form_data.getById(req.params.id);
      if (!requestFormData) {
        return res.status(404).json({ message: 'Request form data not found' });
      }
      res.json(requestFormData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = requestFromDataController;