const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json());

// Состояние комнат
let rooms = {}; // { roomId: { videoTime: 0, videoId: '', users: [] } }

// Создание комнаты
app.post('/create-room', (req, res) => {
    const roomId = Math.random().toString(36).substr(2, 6);
    rooms[roomId] = { videoTime: 0, videoId: '', users: [] };
    res.json({ roomId });
});

// Присоединение к комнате
app.post('/join-room', (req, res) => {
    const { roomId, username } = req.body;
    if (!rooms[roomId]) return res.status(404).json({ error: 'Комната не найдена' });
    rooms[roomId].users.push(username);
    res.json({ room: rooms[roomId] });
});

// WebSocket синхронизация
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('join-room', ({ roomId, username }) => {
        socket.join(roomId);
        io.to(roomId).emit('user-joined', username);
    });

    socket.on('sync-video', ({ roomId, time, videoId }) => {
        if (rooms[roomId]) {
            rooms[roomId].videoTime = time;
            rooms[roomId].videoId = videoId;
            socket.to(roomId).emit('update-video', { time, videoId });
        }
    });

    socket.on('chat-message', ({ roomId, username, message }) => {
        io.to(roomId).emit('chat-message', { username, message });
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
