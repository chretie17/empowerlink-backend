const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');
const jobRoutes = require('./routes/jobRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applications');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);

// Start server with nodemon
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));