const InvitationData = require('../models/InvitationData');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');


upload = multer({ dest: 'uploads/' })
const invitationDataController = {
    async create(req, res) {
        try {
            const invitationData = await InvitationData.create(req.body); 
            res.status(201).json(invitationData);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const invitationData = await InvitationData.findAll();
            res.json(invitationData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req, res) {
        try {
            const invitationData = await InvitationData.findByPk(req.params.id);
            if (!invitationData) {
                return res.status(404).json({ error: 'Invitation Data not found' });
            }
            res.json(invitationData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async update(req, res) {
        try {
            const updated = await InvitationData.update(req.body, {
                where: { id: req.params.id },
            });
            if (!updated) {
                return res.status(404).json({ error: 'Invitation Data not found' });
            }
            const updatedInvitationData = await InvitationData.findByPk(req.params.id);
            res.json(updatedInvitationData);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async delete(req, res) {
        try {
            const deleted = await InvitationData.destroy({
                where: { id: req.params.id },
            });
            if (!deleted) {
                return res.status(404).json({ error: 'Invitation Data not found' });
            }
            res.json({ message: 'Invitation Data deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async patchData(req, res) {
        try {
            const { invitation_id, template_section_id } = req.params;
            const updatedData = await InvitationData.patchData(invitation_id, template_section_id, req.body);
            if (!updatedData) {
                return res.status(404).json({ error: 'Invitation Data not found' });
            }
            res.json(updatedData);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    async getByInvitationAndTemplateSection(req, res) {
        try {
           // Debug log to check params
            const { invitation_id, template_section_id } = req.params;
            const invitationData = await InvitationData.findByInvitationAndTemplateSection(invitation_id, template_section_id);
            if (!invitationData) {
                return res.status(404).json({ error: 'Invitation Data not found' });
            }
            res.json(invitationData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getAllByInvitationId(req, res) {
        try {
            const { invitation_id } = req.params;
            const invitationData = await InvitationData.getAllByInvitationId(invitation_id);
            if (!invitationData || invitationData.length === 0) {
                return res.status(404).json({ error: 'Invitation Data not found' });
            }
            res.json(invitationData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filePath = req.file.path;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "invitations",
      resource_type: "image",
    });
    
    const imageData = {
      image_url: result.secure_url,
      public_id: result.public_id,
      type: req.body.type || 'general'
    };
    
    // Delete local file after successful upload
    fs.unlinkSync(filePath);
    
    const invitationData = await InvitationData.upsertImage(
      req.body.invitation_id,
      req.body.template_section_id,
      imageData
    );
    
    res.status(200).json({
      id: invitationData.id,
      invitation_id: invitationData.invitation_id,
      template_section_id: invitationData.template_section_id,
      data: invitationData.data
    });

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // cleanup if file exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ success: false, message: "Image upload failed" });
  }
    },

    async deleteImage(req, res) {
      try {
        const { invitation_id, template_section_id, public_id } = req.body;
        
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(public_id);

        // Remove from database
        const updatedData = await InvitationData.deleteImage(invitation_id, template_section_id, public_id);

        if (!updatedData) {
          return res.status(404).json({ success: false, message: "Invitation data not found" });
        }

        res.status(200).json({
          success: true,
          message: "Image deleted successfully",
          data: updatedData.data
        });
      } catch (error) {
        console.error("Image Delete Error:", error);
        res.status(500).json({ success: false, message: "Image deletion failed" });
      }
    },

    async getDataByPublicId(req, res) {
        try {
            const { public_id } = req.params;
            const invitationData = await InvitationData.findByPublicId(public_id);
            if (!invitationData) {
                return res.status(404).json({ error: 'Invitation Data not found' });
            }
            res.json(invitationData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async getDataByRsvpToken(req, res) {
        try {
            const { rsvp_token } = req.params;
            const invitationData = await InvitationData.findByRsvpToken(rsvp_token);
            if (!invitationData) {
                return res.status(404).json({ error: 'Invitation Data not found' });
            }
            res.json(invitationData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async deleteRepeatedData(req, res) {
      try {
        const { invitation_id, template_section_id, nano_id } = req.params;
        const deletedData = await InvitationData.deleteRepeatedData(invitation_id, template_section_id, nano_id);
        res.json(deletedData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    async patchRepeatedEntry(req, res) {
      try {
        const { invitation_id, template_section_id, nano_id } = req.params;
        const updatedEntry = await InvitationData.patchRepeatedEntry(invitation_id, template_section_id, nano_id, req.body);
        res.json(updatedEntry);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
};

module.exports = invitationDataController;