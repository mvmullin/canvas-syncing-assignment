// import modules
const http = require('http');
const socketio = require('socket.io');
const fs = require('fs');

// set port
const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read client html files into memory
const part1 = fs.readFileSync(`${__dirname}/../client/part1.html`);
const part2 = fs.readFileSync(`${__dirname}/../client/part2.html`);
const part3 = fs.readFileSync(`${__dirname}/../client/part3.html`);
const part4 = fs.readFileSync(`${__dirname}/../client/part4.html`);

// the current value on the server to send to clients
let num = 0;

// Keep track of socket rooms
const rooms = {};

// function invoked by HTTP module on requests from clients
const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  switch (request.url) {
    case '/part1':
      response.write(part1);
      break;
    case '/part2':
      response.write(part2);
      break;
    case '/part3':
      response.write(part3);
      break;
    case '/part4':
      response.write(part4);
      break;
    default:
      response.write(part1);
      break;
  }
  response.end();
};

// create http server with callback, and listen for requests on specified port
const app = http.createServer(onRequest).listen(port);

// Websocket server code, separate protocol from HTTP. 
// Pass HTTP server into socket.io and grab websocket server
const io = socketio(app);

// function to handle joining sockets
const onJoined = (sock) => {
  const socket = sock;

  socket.on('joinRoom', (data) => {
    socket.join(data.room);
    rooms[socket.name] = data.room;
  });
};

// function to increase the value
const onIncreaseVal = (sock) => {
  const socket = sock;

  socket.on('updateNumber', (data) => {
    num += data;

    io.sockets.in('room1').emit('updateNum', num);
  });
};

// function to emit draw data from one client to the rest of the clients
const onDraw = (sock) => {
  const socket = sock;

  socket.on('draw', (data) => {
    io.sockets.in(rooms[socket.name]).emit('drawn', data);
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    socket.leave(rooms[socket.name]);
  });
};

io.sockets.on('connection', (socket) => {
  onJoined(socket);
  onIncreaseVal(socket);
  onDraw(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
