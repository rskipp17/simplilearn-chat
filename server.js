var PORT = process.env.PORT || 8000;
var moment = require('moment');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

var clientInfo = {};

const MongoClient = require('mongodb').MongoClient;
var collection;

const uri = "mongodb+srv://ryan:ryan123@cluster0.snr6f.mongodb.net/chatdb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useUnifiedTopology: true });
client.connect(err => {
	collection = client.db("chatdb").collection('messages')
	console.log("connected to web database")
})

// Sends current users to provided socket
function sendCurrentUsers(socket) {
	var info = clientInfo[socket.id];
	var users = [];

	if (typeof info === 'undefined') {
		return;
	}

	Object.keys(clientInfo).forEach(function (socketId) {
		var userInfo = clientInfo[socketId];

		if (info.room === userInfo.room) {
			users.push(userInfo.name);
		}
	});

	socket.emit('message', {
		name: 'System',
		text: 'Current users: ' + users.join(', '),
		timestamp: moment().valueOf()
	});
}

io.on('connection', function (socket) {
	console.log('User connected via socket.io!');

	socket.on('disconnect', function () {
		var userData = clientInfo[socket.id];

		if (typeof userData !== 'undefined') {
			socket.leave(userData.room);
			io.to(userData.room).emit('message', {
				name: 'System',
				text: userData.name + ' has left!',
				timestamp: moment().valueOf()
			});
			delete clientInfo[socket.id];
		}
	});

	socket.on('joinRoom', function (req) {
		clientInfo[socket.id] = req;
		socket.join(req.room);
		socket.broadcast.to(req.room).emit('message', {
			name: 'System',
			text: req.name + ' has joined!',
			timestamp: moment().valueOf()
		});
	});

	socket.on('download', function () {
		collection.find().toArray()
			.then(messages => {
				console.log(messages)
			})
			.catch(err => { })
	})

	socket.on('delete', function () {
		collection.remove().then(result => {
			console.log('all messages removed from DB')
				.catch(() => { })
		}).catch(() => { })
	});

	socket.on('message', function (message) {
		console.log('Message received: ' + message.text);

		if (message.text === '@currentUsers') {
			sendCurrentUsers(socket);
		} else {
			message.timestamp = moment().valueOf();
			io.to(clientInfo[socket.id].room).emit('message', message);
		}

		query = '{"userName": "' + clientInfo[socket.id].name + '",'
		query = query + '"userMessage": "' + message.text + '",'
		query = query + '"room": "' + clientInfo[socket.id].room + '",'
		query = query + '"timestamp": "' + message.timestamp + '"}';
		fQuery = JSON.parse(query);
		collection.insertOne(fQuery).then(result => {
			console.log('message added to DB')
				.catch(() => { })
		}).catch(() => { })
	})

	// timestamp property - JavaScript timestamp (milliseconds)

	socket.emit('message', {
		name: 'System',
		text: 'Welcome to the chat application!',
		timestamp: moment().valueOf()
	});
});

http.listen(PORT, function () {
	console.log('Server started!');
});