const express = require('express');
const cors = require('cors');
require('dotenv').config();

const intakeRouter = require('./routes/intake');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allows any origin for easy hackathon frontend-backend integration
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API routes
app.use('/api', intakeRouter);

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'IdentyBridge Backend API is running.',
    endpoints: {
      intake: 'POST /api/intake (Multipart form data: photo, audio, metadata)',
      verify: 'POST /api/match/verify (JSON: patient_id, report_id)',
      dashboard: 'GET /api/dashboard'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  IdentyBridge Server running on port ${PORT}  `);
  console.log(`  Mode: ${process.env.OPENAI_API_KEY ? 'Live OpenAI' : 'Mock/Simulation'}`);
  console.log(`===============================================`);
});

module.exports = app;
