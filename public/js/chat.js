const socket = io()
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoScroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = containerHeight
    }
    
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

socket.on('LocationMessage', (message) => {
    message.createdAt = moment(message.createdAt).format('HH:mm:ss')
    const html = Mustache.render(locationMessageTemplate, { ...message })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('message', (message) => {
    message.createdAt = moment(message.createdAt).format('HH:mm:ss')
    const html = Mustache.render(messageTemplate, { ...message })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room, users
    })

    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
