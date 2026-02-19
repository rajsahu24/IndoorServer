const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
app.use(helmet());

// Build CORS allowed origins from environment variables
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://inviteera.com',
];

// Add FRONTEND_URL from environment if available
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  allowedOrigins.push(process.env.TEMPLATE_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

// Handle preflights very early with the same options
app.options('*', cors(corsOptions));

app.use(cors(corsOptions));

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));



const unitRoutes = require('./routes/units');
const routeRoutes = require('./routes/routes');
const poiRoutes = require('./routes/pois');
const uploadRoutes = require('./routes/upload');
const hotelRoutes = require('./routes/hotels');
const eventRoutes = require('./routes/events');
const navigationRoutes = require('./routes/navigation');
const buildingRoutes = require('./routes/buildings');
const floorRoutes = require('./routes/floorRoutes');
const venueRoutes = require('./routes/venues');
const roomRoutes = require('./routes/room');
const bookingRoutes = require('./routes/booking');
const guestRoutes = require('./routes/guest');
const roomAllocationRoutes = require('./routes/roomAllocationRoutes');
const requestFromData = require('./routes/requestFromData');
const authRoutes = require('./routes/auth');
const invitationRoutes = require('./routes/invitations');
const templatesRoutes = require('./routes/template');
const templateSectionRoutes = require('./routes/templateSection');
const invitationDataRoutes = require('./routes/invitationData');

const PORT = process.env.PORT || 5000;



// Middleware
// app.use(helmet());
// app.use(cors({
//   origin: ["http://localhost:3000",
//     "http://localhost:5173",
//     "https://invitation-backend-production-7fe4.up.railway.app",
//     "https://invitation-frontend-five.vercel.app","https://invitation-frontend-five.vercel.app/"], // EXACT frontend origin
//   credentials: true
// }));
// app.set('trust proxy', 1)
// app.use(cookieParser());
// app.use(express.json({ limit: '10mb' }));

// Routes


app.use('/api/units', unitRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/pois', poiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/navigation', navigationRoutes);
app.use(`/api/buildings`, buildingRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/room-allocations', roomAllocationRoutes);
app.use('/api/request-from-data', requestFromData);
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/template-sections', templateSectionRoutes);
app.use('/api/invitation-data', invitationDataRoutes);


app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;