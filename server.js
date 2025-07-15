const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');
const jobRoutes = require('./routes/jobRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applications');
const CommunitySkillsRoutes = require('./routes/Communit&Skills');
const AdminPostRoutes = require('./routes/AdminPost'); 
const ReportRoutes = require('./routes/Reports');
const dashboardRoutes = require('./routes/DashboardRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/', CommunitySkillsRoutes);
app.use('/api/admin', AdminPostRoutes);
app.use('/api/reports', ReportRoutes)
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/microfinance', require('./routes/microfinanceroutes'));
app.use('/api/counselor', require('./routes/Counselor'));

// Start server with nodemon
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));