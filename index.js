const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');
const Message = require('./models/message.model');

// Connect to MongoDB
connectDB();

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // Load previous messages from DB on connect
  Message.find().sort({ timestamp: 1 }).limit(20).then(messages => {
    socket.emit('loadMessages', messages);
  });

  // Listen for new messages
  socket.on('message', async (msg) => {
    console.log(`💬 Message from ${socket.id}:`, msg);

    // Save message to MongoDB
    const newMessage = new Message({
      senderId: socket.id,
      message: msg
    });
    await newMessage.save();

    // Broadcast to all users
    io.emit('message', { senderId: socket.id, message: msg });
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
