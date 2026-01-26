const Invitation = require('../models/Invitation');
const Event = require('../models/Event');
const Guest = require('../models/Guest');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const e = require('express');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// const parseCSV = require('../utils/parseCSV');
// const parseExcel = require('../utils/parseExcel');

exports.upload = multer({ dest: 'uploads/' });
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

exports.create = async (req, res) => {
  try {
    
    // Create invitation first
    
    const invitation = await Invitation.create(req.body, req.user.id);
    const invitation_id = invitation.id;
    const eventsList = req.body.events || req.body.event;
    
    let createdEvents = [];
    
    if (eventsList) {
      let eventsArray;
      
      // Parse events if it's a string
      if (typeof eventsList === 'string') {
        try {
          eventsArray = JSON.parse(eventsList);
        } catch (e) {
          console.error('Failed to parse events JSON:', e);
          eventsArray = [];
        }
      } else {
        eventsArray = eventsList;
      }
      
      if (Array.isArray(eventsArray) && eventsArray.length > 0) {
        for (const eventData of eventsArray) {
          console.log('Creating event:', invitation_id);
          const { event_name, venue_id, start_time, end_time, event_type, description } = eventData;
          if (event_name) {
            console.log('Creating event for invitation ID:', invitation_id);
            const event = await Event.create({
              invitation_id: invitation_id,
              name: event_name,
              venue_id: venue_id,
              event_type: event_type || 'general',
              start_time: start_time,
              end_time: end_time,
              description: description || null,
              metadata: {}
            });

            
            createdEvents.push(event);
          }
        }
      }
    }
    
    let guestResults = null;

    // Handle guest array from request body
    if (req.body.guests) {
      let guestsArray;
      
      // Parse guests if it's a string
      if (typeof req.body.guests === 'string') {
        try {
          guestsArray = JSON.parse(req.body.guests);
        } catch (e) {
          console.error('Failed to parse guests JSON:', e);
          guestsArray = [];
        }
      } else {
        guestsArray = req.body.guests;
      }
      
      if (Array.isArray(guestsArray) && guestsArray.length > 0) {
        guestResults = await Guest.bulkCreate(guestsArray.map(g => ({
          ...g,
          invitation_id: invitation_id
        })));
        
      }
    }
    
    // Handle guest file upload
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

      // Create guests with invitation_id
      const fileGuestResults = await Guest.bulkCreate(guestData.map(g => ({
        ...g,
        invitation_id: invitation_id
      })));
      
      // Combine results if both exist
      if (guestResults && Array.isArray(guestResults)) {
        guestResults = [...guestResults, ...fileGuestResults];
      } else {
        guestResults = fileGuestResults;
      }
      
      // Clean up uploaded file
      fs.unlinkSync(filePath);
    }

    res.status(201).json(invitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findByUserId = async (req, res) => {
  try {
    const invitations = await Invitation.findByUserId(req.params.user_id);
    
    // Fetch events for each invitation
    const invitationsWithEvents = await Promise.all(
      invitations.map(async (invitation) => {
        const events = await Event.findByInvitationId(invitation.id);
        return {
          ...invitation,
          events: events || []
        };
      })
    );
    
    res.json(invitationsWithEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findGuestByInvitationId = async (req, res) => {
  try {
    const invitation_id = req.params.invitation_id;
    const invitations = await Invitation.findGuestByInvitationId(invitation_id);
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findById = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Invitation.delete(req.params.id);
    res.json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const invitations = await Invitation.findAll();
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const invitation = await Invitation.update(req.params.id, req.body);
    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
};

exports.updates = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No fields provided' });
    }

    const allowedFields = [
      'invitation_title',
      'invitation_message',
      'invitation_tag_line',
      'metadata',
      'quick_action'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (!Object.keys(filteredUpdates).length) {
      return res.status(400).json({ error: 'Invalid fields' });
    }

    const invitation = await Invitation.updates(id, filteredUpdates);
    res.json(invitation);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.findEventsByInvitationId = async (req, res) => {
  try {
    const invitation_id = req.params.invitation_id;
    const events = await Event.findEventByInvitationId(invitation_id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filePath = req.file.path;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "invitations",        // optional
      resource_type: "image",
    });

    // Delete local file after successful upload
    fs.unlinkSync(filePath);
    const invitation_iamges = await Invitation.addImage(
      req.body.invitation_id,
      result.secure_url,
      result.public_id,
      req.body.type || 'general'
    );
    res.status(200).json({
      id: invitation_iamges.id,
      invitation_id: invitation_iamges.invitation_id,
      image_url: invitation_iamges.image_url,
    });

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // cleanup if file exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ success: false, message: "Image upload failed" });
  }
};

exports.getImagesByInvitationId = async (req, res) => {
  try {
    const invitation_id = req.params.invitation_id;
    const images = await Invitation.getImagesByInvitationId(invitation_id);
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getImageById = async (req, res) => {
  try {
    const image_id = req.params.image_id;
    const image = await Invitation.getImageById(image_id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const image_id = req.params.image_id;
    
    const image = await Invitation.getImageById(image_id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.public_id);

    // Delete from database
    await Invitation.deleteImage(image_id);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getInvitationByRsvpToken = async (req, res) => {
  try {
    const rsvp_token = req.params.rsvp_token;
    const invitation = await Invitation.getInvitationByRsvpToken(rsvp_token);
    console.log(`RSVP token: ${rsvp_token}, Invitation: `, invitation);
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    res.json(invitation);
  } catch (error) {
    if (error.message === 'RSVP already accepted or invalid status') {
      return res.status(400).json({ error: error.message }); // Or 409 Conflict
    }
    res.status(500).json({ error: error.message });
  } 
};


exports.updateGuestRsvpStatus = async (req, res) => {
  try {
    const rsvp_token = req.params.rsvp_token;
    const { status } = req.body;
    const guest = await Invitation.updateGuestRsvpStatus(rsvp_token, status);
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    } 
    res.json(guest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}





