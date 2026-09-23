require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/sockets');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: (origin, callback) => callback(null, true), credentials: true },
});
initSocket(io);

connectDB().then(() => {
  server.listen(PORT, () => console.log(`CampusBite API running on port ${PORT}`));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
