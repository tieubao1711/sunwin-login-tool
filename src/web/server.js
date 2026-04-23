const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./api');
const controlApi = require('./controlApi');

let io;

function startWebServer(port = 3001) {
  const app = express();
  const server = http.createServer(app);

  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }));

  app.use(express.json());

  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true
    }
  });

  app.use('/api', apiRoutes);
  app.use('/api/control', controlApi);
  
  app.use(express.static(path.join(__dirname, 'public')));

  server.listen(port, () => {
    console.log(`[Web] http://localhost:${port}`);
  });

  return { io };
}

function getIO() {
  return io;
}

module.exports = {
  startWebServer,
  getIO
};