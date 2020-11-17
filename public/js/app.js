var name = getQueryVariable('name') || 'Anonymous';
var room = getQueryVariable('room');
var socket = io();

console.log(name + ' wants to join ' + room);

// Update h1 tag
jQuery('.room-title').text("Room: " + room);
 
socket.on('connect', function () {
	console.log('Conncted to socket.io server!');
	socket.emit('joinRoom', {
		name: name,
		room: room
	});
});

socket.on('message', function (message) {
	var momentTimestamp = moment.utc(message.timestamp);
	var $messages = jQuery('.messages');
	var $message = jQuery('<li class="list-group-item"></li>');

	console.log('New message:');
	console.log(message.text);

	//display on correct side of screen
	if (name == message.name)
	{
		$message.append('<p class="text-right"><strong>' + message.name + ' ' + momentTimestamp.local().format('h:mm a') + '</strong></p>');
		$message.append('<p class="text-right">' + message.text + '</p>');
		$messages.append($message);
	}
	else
	{
		$message.append('<p class="text-left"><strong>' + message.name + ' ' + momentTimestamp.local().format('h:mm a') + '</strong></p>');
		$message.append('<p class="text-left">' + message.text + '</p>');
		$messages.append($message);
	}
});

// Handles submitting of new message
var $form = jQuery('#message-form');
$form.on('submit', function (event) {
	event.preventDefault();

	var $message = $form.find('input[name=message]');

	socket.emit('message', {
		name: name,
		text: $message.val()
	});

	$message.val('');
});

function downloadHistory(){
	console.log("downloading history....")
	socket.emit('download');
}

function deleteHistory(){
	console.log("deleting history....")
	socket.emit('delete');
}