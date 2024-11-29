import express from 'express';
const app = express()
import path from 'path'
import {dirname} from 'path'
import {createServer} from 'http'
import { fileURLToPath } from 'url';
const server = createServer(app)

const port = process.env.PORT || 3000;

import {Server} from 'socket.io' 

const io = new Server(server)

var msgindex = {
  messages: [],
  sender: [],
  tag: []
};

var idusers = {}
var onlineusers = {}


const __dirname = dirname(fileURLToPath(import.meta.url));

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html")
});

function sortOnline(){
  var abclist = []
  for(var id in onlineusers){
    abclist.push([onlineusers[id].user, id])
  }
  abclist.sort((a,b) => a[0].localeCompare(b[0]));
  var onlineusers = {}
  for(let x=0;x<abclist.length;x++){
    var user = abclist[x][0]
    var id = abclist[x][1]
    var data = {}
    data["user"] = user
    onlineusers[id] = data
  }
}

io.on('connection', (socket) => {
  io.sockets.emit('UpdateApp', msgindex)

  socket.on('EnteredIndex', (id, user) => {
    var data = {}
    data["user"] = user
    idusers[id] = data
    onlineusers[id] = data
    var message = `${user} has entered chat`
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
      var user = idusers[socket.id].user
      var message = `${user} has left chat`
      msgindex.messages.push([message, {}])
      msgindex.sender.push("e")
      msgindex.tag.push("none")
      sortOnline()
      io.sockets.emit('LeftApp', user, message, msgindex, socket.id)
    }
  })
});