require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const taskRoutes = require('./routes/tasks');
const statsRoute = require('./routes/stats');
const activitiesRoute = require('./routes/activities');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.locals.io = io;

app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoute);
app.use('/api/activities', activitiesRoute);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
