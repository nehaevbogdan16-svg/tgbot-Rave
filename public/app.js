const socket = io();

let player, currentRoom, username;

// YouTube API
function onYouTubeIframeAPIReady() {
    player = new YT.Player('videoContainer', {
        height: '360',
        width: '640',
        videoId: '',
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        socket.emit('sync-video', { roomId: currentRoom, time: player.getCurrentTime(), videoId: player.getVideoData().video_id });
    }
}

// Кнопки
document.getElementById('createRoomBtn').onclick = async () => {
    username = document.getElementById('username').value;
    const res = await fetch('/create-room', { method:'POST' });
    const data = await res.json();
    joinRoom(data.roomId);
};

document.getElementById('joinRoomBtn').onclick = async () => {
    username = document.getElementById('username').value;
    const roomId = document.getElementById('roomIdInput').value;
    joinRoom(roomId);
};

async function joinRoom(roomId) {
    const res = await fetch('/join-room', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ roomId, username })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);

    currentRoom = roomId;
    document.getElementById('login').style.display = 'none';
    document.getElementById('room').style.display = 'block';

    socket.emit('join-room', { roomId, username });
}

// WebSocket события
socket.on('update-video', ({ time, videoId }) => {
    if (player.getVideoData().video_id !== videoId) player.loadVideoById(videoId, time);
    else player.seekTo(time, true);
});

socket.on('chat-message', ({ username, message }) => {
    const chat = document.getElementById('chat');
    chat.innerHTML += `<b>${username}:</b> ${message}<br>`;
});

document.getElementById('sendChatBtn').onclick = () => {
    const msg = document.getElementById('chatInput').value;
    socket.emit('chat-message', { roomId: currentRoom, username, message: msg });
    document.getElementById('chatInput').value = '';
};
