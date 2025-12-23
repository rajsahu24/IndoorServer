const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/units', unitRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/pois', poiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/navigation', navigationRoutes);
app.use(`/api/buildings`,buildingRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/room-allocations', roomAllocationRoutes);


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;