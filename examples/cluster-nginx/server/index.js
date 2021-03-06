// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
var serverName = process.env.NAME || 'Unknown';
var port = 7000 + (process.env.pm_id - 0);
console.log(port)
// io.adapter(redis({ host: 'localhost', port:  6379}));
io.adapter(redis({ host: '192.168.206.18', port: 6371, password:'awahtfAYSjGFXfMeLXi3lEFD9M4LHtuf' }));
io.set('transports', ['polling']);
server.listen(port, function () {
  console.log('Server listening at port %d', port);
  console.log('Hello, I\'m %s, how can I help?', serverName);
});
app.use(function(req, res, next){
  res.cookie('socket-io-port', port);
  next();
})
// Routing
app.use(express.static(__dirname + '/public'));
// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  console.log(process.pid)
  
  socket.emit('my-name-is', serverName);

  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
