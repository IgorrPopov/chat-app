const socket = io();

// Elements 
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');

const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
// const $location = document.querySelector('#location');



// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;


// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild;

    // Height of the last message
    const newMessageStyles = getComputedStyles($newMessage);
    const newMessageHeight = $newMessage.offsetHeight;

    console.log(newMessageStyles);
}

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector('#sidebar').innerHTML = html;
});


socket.on('message', (message) => {
    console.log('messageTemplate');
    console.log('Message: ', message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    });
 

    $messages.insertAdjacentHTML('beforeend', html);
});

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        url: message.url,
        username: message.username
    });

    $messages.insertAdjacentHTML('beforeend', html);
});

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated', count);
// });

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Click');
//     socket.emit('increment');
// });


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // const message = document.querySelector('#message-form__input').value;
    

    $messageFormButton.setAttribute('disabled', 'disabled');

    // disable
    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        // enable

        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('Message delivered!');
    }); 
});

socket.on('sendMessageToAll', (message) => {
    console.log('64: ' + message);
});



$sendLocationButton.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position);
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location has been shared');
            $sendLocationButton.removeAttribute('disabled');
        });
    });

});



socket.emit('join', { username, room }, error => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});