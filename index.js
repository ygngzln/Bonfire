const express = require('express')
const app = express()
const path = require("path")
const server = require('http').createServer(app)

const port = process.env.PORT || 3000;

const io = require('socket.io')(server);

var msgindex = {
  messages: [],
  sender: [],
  tag: []
};

var idusers = {}
var onlineusers = {}

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html")
});

function sortOnline(){
  abclist = []
  for(var id in onlineusers){
    abclist.push([onlineusers[id].user, id])
  }
  abclist.sort((a,b) => a[0].localeCompare(b[0]));
  onlineusers = {}
  for(x=0;x<abclist.length;x++){
    user = abclist[x][0]
    id = abclist[x][1]
    data = {}
    data["user"] = user
    onlineusers[id] = data
  }
}

io.on('connection', (socket) => {
  io.sockets.emit('UpdateApp', msgindex)

  socket.on('EnteredIndex', (id, user) => {
    data = {}
    data["user"] = user
    idusers[id] = data
    onlineusers[id] = data
    message = `${user} has entered chat`
    msgindex.messages.push([message, {}])
    msgindex.sender.push("j")
    msgindex.tag.push("none")
    sortOnline()
    io.sockets.emit('EnteredApp', idusers, onlineusers, id, message, msgindex)
  })
  
  socket.on('SendIndex', (message, id, tagTextId, replyId) => {
    if(Object.keys(replyId).length != 0){
      tagTextId[replyId.from] = "Tagged"
      msgindex.messages.push([message, replyId])
    }else{
      msgindex.messages.push([message, {}])
    }
    msgindex.sender.push(id)
    msgindex.tag.push(tagTextId)
    io.sockets.emit('SendApp', msgindex, [message, replyId], id, tagTextId)
  })

  socket.on('disconnect', () => {
    if(idusers[socket.id] && idusers && onlineusers[socket.id]){
      delete onlineusers[socket.id]
      user = idusers[socket.id].user
      message = `${user} has left chat`
      msgindex.messages.push([message, {}])
      msgindex.sender.push("e")
      msgindex.tag.push("none")
      sortOnline()
      io.sockets.emit('LeftApp', user, message, msgindex, socket.id)
    }
  })
});