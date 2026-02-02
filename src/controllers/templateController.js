const Template = require('../models/Template');

const templateController = {
    async create(req, res) {
        try {
            const template = await Template.create(req.body);
            res.status(201).json(template);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const templates = await Template.findAll();
            res.json(templates);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const template = await Template.findByPk(req.params.id);
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            res.json(template);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const [updated] = await Template.update(req.body, {
                where: { id: req.params.id },
            });
            if (!updated) {
                return res.status(404).json({ error: 'Template not found' });
            }
            const updatedTemplate = await Template.findByPk(req.params.id);
            res.json(updatedTemplate);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async delete(req, res) {
        try {
            const deleted = await Template.destroy({
                where: { id: req.params.id },
            });
            if (!deleted) {
                return res.status(404).json({ error: 'Template not found' });
            }
            res.json({ message: 'Template deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = templateController;