const express = require('express');
const invitationController = require('../controllers/invitation');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');



router.post('/',auth,invitationController.upload.single('guestFile'),invitationController.create);
router.get('/user/:user_id', auth, invitationController.findByUserId);
router.get('/guest/:invitation_id', auth, invitationController.findGuestByInvitationId);
router.get('/:id', invitationController.findById);
router.get('/', auth, invitationController.findAll);
router.put('/:id', auth, invitationController.update);
router.patch('/:id', auth, invitationController.updates);
router.delete('/:id', auth, invitationController.delete);
router.get('/event/:invitation_id', invitationController.findEventsByInvitationId);
router.post('/image',upload.single("image"),invitationController.uploadImage);
router.get('/image/:invitation_id',invitationController.getImagesByInvitationId);
router.delete('/image/:image_id',auth,invitationController.deleteImage);
router.get('/get_imageby_id/:image_id',invitationController.getImageById);
router.get('/rsvp/:rsvp_token', invitationController.getInvitationByRsvpToken);

router.patch('/guest_rsvp/:rsvp_token', invitationController.updateGuestRsvpStatus);



module.exports = router;