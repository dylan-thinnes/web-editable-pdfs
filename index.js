const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Initialize static server
app.use('/', express.static("./static"));

io.on('connection', socket => {
    socket.on("event", e => {
        console.log("event", e);
        socket.broadcast.emit("event", e);
    });
});

http.listen(8080, () => console.log("Listening on 8080."));
