const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const { generateMessage } = require('./utills/messages')
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
const { getUser, getUsersInroom, addUser, removeUser } = require('./utills/users')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('System', `Welcome ${username}!`))
        socket.broadcast.to(user.room).emit('message', generateMessage('System', `${username} has joined the room!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            username: username,
            isLeft: false
        })

        callback(undefined, {room, users: getUsersInroom(room)})

        socket.on('sendMessage', (message, callback) => {
            const filter = new Filter()
            if (filter.isProfane(message)) return callback('Profanity is not allowed!')

            io.to(user.room).emit('message', generateMessage(username, message))
            callback()
        })

        socket.on('sendLocation', (position, callback) => {
            io.to(user.room).emit('LocationMessage', generateMessage(username, `https://google.com/maps?q=${position.latitude},${position.longitude}`))
            callback()
        })

        socket.on('disconnect', () => {
            const user = removeUser(socket.id)
            if (user) {
                io.to(user.room).emit('roomData', {
                    room: user.room,
                    username: username,
                    isLeft: true
                })
                
                io.to(user.room).emit('message', generateMessage('System', `${username} has left`))
            }
        })
    })
})


server.listen(port, () => {
    console.log(`Running on port ${port}`);

})