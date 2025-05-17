const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// In-memory storage for topics and messages
let topics = ['General', 'Technology', 'Sports'];
let messages = {
  // topicName: [ {id, message, time}, ... ]
  'General': [],
  'Technology': [],
  'Sports': []
};

// Serve index.html directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send current topics list on connect
  socket.emit('topicsList', topics);

  // Handle create topic
  socket.on('createTopic', (topicName) => {
    if (!topics.includes(topicName)) {
      topics.push(topicName);
      messages[topicName] = [];
      io.emit('topicsList', topics);
      console.log(`Topic created: ${topicName}`);
    }
  });

  // Join topic room
  socket.on('joinTopic', (topicName) => {
    socket.join(topicName);
    console.log(`${socket.id} joined topic: ${topicName}`);

    // Send chat history for that topic
    socket.emit('chatHistory', messages[topicName] || []);
  });

  // Receive message in topic
  socket.on('topicMessage', ({ topicName, message }) => {
    if (!topics.includes(topicName)) return;

    const msgData = {
      id: socket.id,
      message,
      time: new Date().toLocaleTimeString()
    };

    messages[topicName].push(msgData);
    io.to(topicName).emit('newMessage', { ...msgData, topic: topicName });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
