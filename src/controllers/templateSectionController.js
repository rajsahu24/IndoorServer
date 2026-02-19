const templateSection = require('../models/TemplateSection');

const templateSectionController = {
    async create(req, res) {
        try {
            const templateSectionData = await templateSection.create(req.body);
            res.status(201).json(templateSectionData);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getAll(req, res) { 
        try {
            const templateSections = await templateSection.findAll();
            res.json(templateSections);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const templateSectionData = await templateSection.findById(req.params.id);
            if (!templateSectionData) {
                return res.status(404).json({ error: 'Template Section not found' });
            }
            res.json(templateSectionData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const updated = await templateSection.update(req.body, {
                where: { id: req.params.id },
            });
            if (!updated[0]) {
                return res.status(404).json({ error: 'Template Section not found' });
            }
            const updatedTemplateSection = await templateSection.findById(req.params.id);
            res.json(updatedTemplateSection);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const deleted = await templateSection.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ error: 'Template Section not found' });
            }
            res.json({ message: 'Template Section deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    async getByInvitationId(req, res) {
        try {
            const templateSections = await templateSection.findByInvitationId(req.params.id);
            res.json(templateSections);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = templateSectionController;