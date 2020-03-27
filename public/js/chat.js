const socket = io()
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector("#messages")
const $messagesContainer = document.querySelector('.chat__messages')
// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username: myUsername, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

let namesToColors = { System: 'black' }

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild

    // debugger;
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messagesContainer.offsetHeight

    const containerHeight = $messagesContainer.scrollHeight

    const scrollOffset = $messagesContainer.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messagesContainer.scrollTop = containerHeight
    }

}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    $messageFormButton.setAttribute('disabled', '')
    const text = event.target.elements.message.value
    console.log(`Sending ${text} to server`);

    socket.emit('sendMessage', text, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) return console.log('Profanity isn ot allowed')

        console.log('Message Delivered')

    })
})

document.querySelector('#send-location').addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled', '')
    if (!navigator.geolocation) {
        return alert("No location services... you're too old!")
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { longitude: position.coords.longitude, latitude: position.coords.latitude }, () => {
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

const setMessageColor = (message, lastMessageElement) => {
    if (message.username.toLowerCase() !== myUsername.toLowerCase() & !(message.username in namesToColors)) {
        namesToColors[message.username] = getRandomColor()
    }

    if (message.username.toLowerCase() == myUsername.toLowerCase()) {
        lastMessageElement.classList.add('me')
    }
    else {
        lastMessageElement.querySelector('.message__name').style.color = namesToColors[message.username]
    }
}

socket.on('LocationMessage', (message) => {
    message.createdAt = moment(message.createdAt).format('HH:mm:ss')
    const html = Mustache.render(locationMessageTemplate, { ...message })
    $messages.insertAdjacentHTML('beforeend', html)
    const lastMessageElement = $messages.lastElementChild.querySelector('.message')
    setMessageColor(message, lastMessageElement)
    autoScroll()
})

socket.on('message', (message) => {
    message.createdAt = moment(message.createdAt).format('HH:mm:ss')
    const html = Mustache.render(messageTemplate, { ...message })
    $messages.insertAdjacentHTML('beforeend', html)

    const lastMessageElement = $messages.lastElementChild.querySelector('.message')
    setMessageColor(message, lastMessageElement)

    autoScroll()
})


const setColorForUsers = () => {
    const users = []
    Object.keys(namesToColors).forEach((username) => {
        if (username !== 'System') {
            users.push({ username, color: namesToColors[username] })
        }
    })

    return users
}

const updateRoomUsers = (room, users) => {
    const $sideBar = document.querySelector('#sidebar')
    users = setColorForUsers(users)
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    $sideBar.innerHTML = html
}

const clearRoomUsers = () => {
    namesToColors = { 'System': 'black' }
    namesToColors[myUsername] = 'white'
}

socket.on('roomData', ({ room, username, isLeft }) => {
    const users = []

    if (isLeft) {
        delete namesToColors[username]
    }
    else {
        const randomColor = getRandomColor()
        namesToColors[username] = randomColor
    }

    updateRoomUsers(room, users)
})


socket.emit('join', { username: myUsername, room }, (error, roomData) => {
    if (error) {
        alert(error)
        location.href = '/'
        return
    }

    const { room, users } = roomData
    clearRoomUsers()
    users.forEach((user) => {
        if (user.username.toLowerCase() !== myUsername.toLowerCase())
            namesToColors[user.username] = getRandomColor()
    })
    updateRoomUsers(room, users)

})
