const socket = io(); 
var sendButton = document.getElementById("sendButton")
var textbox = document.getElementById("textbox")
var textcontent = document.getElementById("textdiv")
var typeouter = document.getElementById("typeouter")
var tags = document.getElementById("tags")
var outerreply = document.getElementById("outerreply")
var emojis = document.getElementById("emojis")
var emojisBtn = document.getElementById("emojisBtn")
var emojiSearch = document.getElementById("emojiSearch")
var emojiList = document.getElementsByClassName("emoji")
var reply = document.getElementById("reply")
var replyS = document.getElementById("replySender")
var replyBtn = document.getElementById("replyBtn")
var onlineouter = document.getElementById("onlineouter")
var online = document.getElementById("online")
var log = document.getElementById("log")
var usererr = document.getElementById("usererr")
var userbox = document.getElementById("user")
var sending = false;
var message = textbox.value
var user;
var newTalker;
var msgapp = {};
var idusers = {};
var onlineusers = {};
var spacing = 8;
var onlinespacing = 8;
var isOnline = false;
var usermsg;
var talking;
var tabList = [];
var tabListID = [];
var tabListIndex = [];
var tabChange = false;
var tagText = {};
var tagsVis;
var defaultTabs = false;
var currentDivOver = "none";
var divOver = false;
var currentReply = {};
var emojisActive = false;
var newDiv;
var newDivI;
var newDivO;
var newImg;
var newText;

textcontent.style.visibility = "hidden";
typeouter.style.visibility = "hidden";
tags.style.visibility = "hidden";
outerreply.style.visibility = "hidden";
emojis.style.visibility = "hidden";
replyBtn.style.visibility = "hidden";
onlineouter.style.visibility = "hidden";
usererr.style.visibility = "hidden";

window.addEventListener("keydown", function(e){
  if(e.key == "Backspace"){
    if(textbox.value == 0){
      if(currentReply && Object.keys(currentReply).length > 0){
        clearReply()
      }
    }
    focus()
  }else if(e.keyCode == 9){
    if(tabList.length != 0){
      selectFirstTab()
    }
  }else if(e.keyCode == 13){
    if(tabList.length == 0){
      if(isOnline){
        send()
      }else{
        start()
      }
    }else{
      selectFirstTab()
      clearTabs()
    }
  }else if(e.keyCode == 27){
    if(currentReply && Object.keys(currentReply).length > 0){
      clearReply()
    }
    clearTabs()
  }else if(e.keyCode <= 127 && e.keyCode >= 32){
    focus()
  }
})

window.addEventListener("keyup", function(e){
  if(e.keyCode == 9){
    textbox.focus()
  }
  if(message != textbox.value){
    message = textbox.value
    tagOptions(message)
  }
})

window.addEventListener("click", function(e){
  if(emojisActive){
    rect = emojis.getBoundingClientRect();
    rect2 = emojisBtn.getBoundingClientRect()
    x = e.pageX
    y = e.pageY;
    if(rect.bottom < y || rect.top > y || rect.right < x ||rect.left > x) {
      if(rect2.bottom < y || rect2.top > y || rect2.right < x || rect2.left > x){
        closeEmojis()
      }
    }
  }
})

for(let i=0;i<emojiList.length;i++){
  emojiList[i].addEventListener("click", function(e){
    emojiSelect(e.target.innerHTML)
  })
}

function focus(){
  if(isOnline && !emojisActive){
    textbox.focus()
  }else{
    userbox.focus()
    usererr.style.visibility = "hidden"
  }
}

function start(){
  username = userbox.value
  pass = checkuser(username)
  if(pass){
    isOnline = true;
    textcontent.style.visibility = "visible";
    typeouter.style.visibility = "visible";
    onlineouter.style.visibility = "visible";
    log.style.visibility = "hidden"
    socket.emit("EnteredIndex", socket.id, username.trim())
  }else{
    userbox.focus()
  }
}

function checkuser(n){
  if(n.length == 0){
    errorMessage("Enter a username first.")
    return (false)
  }else if(n.trim() === ""){
    errorMessage("Enter a username first.")
    return (false)
  }else if(n.length >= 28){
    errorMessage("Username too long (max 28 characters).")
    return (false)
  }
  for(let x=0;x<n.length;x++){
    if(n[x] === " "){
      errorMessage("You cannot have spaces in username (symbols are allowed).")
      return (false);
    }
  }

  return (true);
}

function errorMessage(str){
  usererr.style.visibility = "visible"
  usererr.innerHTML = str
}

function updateMsgApp(newmsgs, newsends, newtags){
  msgapp.messages = newmsgs
  msgapp.sender = newsends
  msgapp.tag = newtags
}

function updateOnlineList(){
  onlinespacing = 8
  online.innerHTML = ''
  for(var id in onlineusers){
    user = onlineusers[id].user
    drawOnlineName(user)
  }
}

function updatePrev(){
  if(msgapp.messages && isOnline){
    spacing = 8
    textcontent.innerHTML = "";
    textcontent.appendChild(replyBtn)
    msglist = msgapp.messages
    sdlist = msgapp.sender
    tglist = msgapp.tag
    talking = "";
    for(let x=0;x<msglist.length;x++){
      usermsg = true
      newDiv = undefined;
      userid = sdlist[x]
      msgtg = tglist[x]
      if(userid != talking){
        if(userid === "j" || userid === "e"){
          usermsg = false;
          if(userid === "j"){
            drawEntry(msglist[x][0])
          }else if(userid === "e"){
            drawExit(msglist[x][0])
          }
        }else{
          talking = userid;
          for(var id in idusers){
            if(id === talking){
              if(id === socket.id){
                drawName(idusers[id].user, true)
              }else{
                drawName(idusers[id].user, false)
              }
              newTalker = idusers[id].user
            }
          }
          add(newDiv)
        }
      }
      if(usermsg){
        if(Object.keys(msglist[x][1]).length != 0){
          rplist = msglist[x][1]
          drawReply(rplist.username, rplist.msg, rplist.from)
          add(newDiv)
        }
        drawText(msglist[x][0], userid, msgtg, x, newTalker)
      }
      add(newDiv)
    }
  }
}

function send(){
  if(message.length != 0 && message.trim() != ""){
    sending = true
    clearTabs()
    message = textbox.value
    textbox.value = "";
    socket.emit("SendIndex", message, socket.id, tagText, currentReply)
    clearReply()
    currentReply = {}
    tagText = {}
  }
};

function drawText(message, from, tagged, index, username){
  newDiv = document.createElement("div")
  newDiv.style.marginTop = `${spacing}px`
  newDiv.style.position = "absolute"
  newDiv.style.width = "100%"
  newDiv["index"] = index
  newDiv["fromID"] = from
  newDiv["tagID"] = tagged
  newDiv["fromNM"] = username
  
  newDivI = document.createElement("div")
  newDivI.innerHTML = message;
  newDivI.style.wordBreak = "break-word"
  newDivI.style.fontFamily = "Roboto,sans-serif"
  newDivI.style.fontSize = "20px"
  
  if(from === socket.id){
    newDivI.style.float = "right"
    newDivI.style.marginRight = "4px"
  }else{
    newDivI.style.float = "left"
    newDivI.style.marginLeft = "4px"
  }

  if(socket.id in tagged){
    newDivI.style.backgroundColor = "yellow"
    newDivI.style.border = "4px solid yellow"
  }
  
  newDiv.appendChild(newDivI)
  newDiv["msg"] = message
  
  newDiv.onmouseover = function(){
    this.style.backgroundColor = "silver"
    currentDivOver = this
    divOver = true
    if(this.fromID == socket.id){
      showReplyButton(true, this.style.marginTop, this.offsetWidth, true)
    }else{
      showReplyButton(true, this.style.marginTop, this.offsetWidth, false)
    }
  }
  
  newDiv.onmouseout = function(){
    this.style.background = "transparent"
    divOver = false
    showReplyButton(false, " ", " ", false)
  } 
}

function drawReply(name, message, from){
  newDiv = document.createElement("div")
  newDiv.style.marginTop = `${spacing}px`;
  newDiv.style.position = "absolute";
  newDiv.style.wordBreak = "break-word";
  newDiv.style.fontSize = "14px";
  newDiv.style.backgroundColor = "yellow";
  newDiv.style.border = "2px dashed darkgoldenrod";
  newDiv.style.color = "darkgoldenrod"
  if(from === socket.id){
    newDiv.style.right = "4px";
  }else{
    newDiv.style.left = "4px";
  }
  newDiv.style.fontFamily = "Garamond,Serif";
  newDiv.innerHTML = `@${name} says ${message.slice(0,20)}... `;
}

function drawName(name, from){
  newDiv = document.createElement("div")
  newDiv.style.marginTop = `${spacing}px`
  newDiv.style.position = "absolute"
  newDiv.style.wordBreak = "break-word"
  newDiv.style.fontSize = "18px"
  newDiv.style.border = "4px solid dimgray"
  newDiv.style.fontWeight = "bold"
  newDiv.style.paddingRight = "2px"
  newDiv.style.paddingLeft = "2px"
  if(from){
    newDiv.style.right = "4px"
  }else{
    newDiv.style.left = "4px"
  }
  newDiv.style.fontFamily = "Monaco,monospace"
  newDiv.innerHTML = name;
}

function drawOnlineName(user){
  newDivO = document.createElement("div")
  newDivO.style.marginTop = `${onlinespacing}px`
  newDivO.style.position = "relative"
  newDivO.style.wordBreak = "break-word"
  newDivO.style.fontSize = "18px"
  newDivO.style.fontWeight = "bold"
  newDivO.style.border = "4px solid dimgray"
  newDivO.style.backgroundColor = "gray"
  newDivO.style.marginRight = "8px"
  newDivO.style.marginLeft = "8px"
  newDivO.style.fontFamily = "Monaco,monospace"
  newDivO.innerHTML = user;
  online.appendChild(newDivO)
  onlinespacing += newDivO.fontSize;
}

function drawEntry(msg){
  newImg = document.createElement("img")
  newImg.src = "assets/enter.png"
  newImg.style.backgroundColor = "green"
  newImg.style.border = "4px solid green"
  newImg.style.verticalAlign = "middle"
  newImg.style.borderRadius = "18px"
  newText = document.createElement("span")
  newText.innerHTML = msg
  newText.style.fontSize = "18px"
  newText.style.marginLeft = "2px"
  newDiv = document.createElement("div")
  spacing += 4
  newDiv.style.marginTop = `${spacing}px`
  spacing += 4
  newDiv.style.fontWeight = "bold"
  newDiv.style.fontSize = 18
  newDiv.style.wordBreak = "break-word"
  newDiv.style.position = "absolute"
  newDiv.style.left = "6px"
  newDiv.style.fontFamily = "Monaco,monospace"
  newDiv.appendChild(newImg)
  newDiv.appendChild(newText)
}

function drawExit(msg){
  newImg = document.createElement("img")
  newImg.src = "assets/exit.png"
  newImg.style.backgroundColor = "red"
  newImg.style.border = "4px solid red"
  newImg.style.verticalAlign = "middle"
  newImg.style.borderRadius = "18px"
  newText = document.createElement("span")
  newText.innerHTML = msg
  newText.style.fontSize = "18px"
  newDiv = document.createElement("div")
  spacing += 4
  newDiv.style.marginTop = `${spacing}px`
  spacing += 4
  newDiv.style.fontSize = 18
  newDiv.style.fontWeight = "bold"
  newDiv.style.wordBreak = "break-word"
  newDiv.style.position = "absolute"
  newDiv.style.left = "6px"
  newDiv.style.fontFamily = "Monaco,monospace"
  newDiv.appendChild(newImg)
  newDiv.appendChild(newText)
}

function drawUserMsg(msg, id, tagTextID, index){
  if(id != talking){
    talking = id;
    for(var ids in idusers){
      if(ids === talking){
        if(ids === socket.id){
          drawName(idusers[ids].user, true)
        }else{
          drawName(idusers[ids].user, false)
        }
        newTalker = idusers[ids].user
      }
    }
    add(newDiv)
  }
  if(Object.keys(msg[1]).length != 0){
    obj = msg[1]
    drawReply(obj.username, obj.msg, id)
    add(newDiv)
  }
  drawText(msg[0], id, tagTextID, index, newTalker)
  add(newDiv)
}

function drawTab(name, index, id){
  newDiv = document.createElement("div")
  newDiv.innerHTML = name
  newDiv.onclick = function(){
    tabSelected(name, index, id)
    clearTabs()
  }
  newDiv.style.textAlign = "center"
  newDiv.style.backgroundColor = "darkgray"
  newDiv.style.color = "black"
  tags.appendChild(newDiv)
  tags.style.visibility = "visible"
}

function add(div){
  try{
    textcontent.appendChild(div)
  }catch(e){
    console.log("div append error")
  }
  textcontent.scrollTop = textcontent.scrollHeight
  if(div.offsetHeight == 27){
    div.offsetHeight = 24
  }
  spacing += div.offsetHeight + 2
}

function tagOptions(msg){
  tag = false
  atDefault = false;
  index = 0
  i = msg.indexOf("@")
  if(i == -1){
    tagText = {}
  }
  for(let x=0;x<msg.length;x++){
    if(tag){
      if(msg[x] === " "){
        name = ""
        tag = false
        clearTabs()
      }
    }else if(!tag){
      if(msg[x] === "@"){
        index = x
        name = ""
        for(let y=x+1;y<msg.length;y++){
          if(msg[y] === " "){
            break;
          }else{
            name += msg[y]
          }
        }
        if(name.length != 0){
          tag = true
        }else{
          atDefault = true
        }
      }
    }
  }
  
  if(tag){
    tabHeight()
    if(defaultTabs){
      clearTabs()
      defaultTabs = false
    }
    makeTabList(name, index)
  }else if(!tag && atDefault){
    tabHeight()
    defaultTabList(index)
    defaultTabs = true
  }else if(!atDefault && !tag){
    clearTabs()
  }
}

function tabHeight(){
  if(Object.keys(currentReply).length == 0){
    tags.style.bottom = "17.35%"
  }else{
    tags.style.bottom = "20.2%"
  }
}

function makeTabList(name, index){
  name = name.toLowerCase()
  tabChange = false;
  for(var id in onlineusers){
    username = onlineusers[id].user
    usernameLow = onlineusers[id].user.toLowerCase()
    if(usernameLow.indexOf(name) != -1){
      if(usernameLow === name){
        clearTabs()
        tagText[id] = "Tagged"
      }else if(usernameLow != name){
        if(tabList.indexOf(username) == -1 && tabList.length < 5){
          tabList.push(username)
          tabListID.push(id)
          tabListIndex.push(index)
          tabChange = true
          drawTab(`@${username}`, index, id)
        }
      }
    }else{
      i = tabList.indexOf(username)
      if(i != -1){
        tabList.splice(i, 1)
        redrawTabs()
      }
    }
  }
}

function redrawTabs(){
  tempTablist = tabList
  tempTablistIndex = tabListIndex
  tempTablistID = tabListID
  clearTabs()
  for(let x=0;x<tabList.length;x++){
    drawTab(`@${tempTablist[x]}`, tempTablistIndex[x], tempTablistID[x])
  }
}

function defaultTabList(index){
  for(var id in onlineusers){
    if(tabList.indexOf(onlineusers[id].user) == -1 && tabList.length < 5){
      tabList.push(onlineusers[id].user)
      tabListID.push(id)
      tabListIndex.push(index)
      tabChange = true
      drawTab(`@${onlineusers[id].user}`, index, id)
    }
  }
}

function tabSelected(name, index, id){
  textbox.value = `${message.slice(0,index)}@${name} `
  textbox.focus()
  tagText[id] = "Tagged"
}

function clearTabs(){
  tagsVis = tags.style.visibility
  if(tagsVis === "visible"){
    tags.style.visibility = "hidden"
    tags.innerHTML = ""
    tabList = []
    tabListID = []
    tabListIndex = []
  }
}

function selectFirstTab(){
  tabSelected(tabList[0], tabListIndex[0], tabListID[0])
  clearTabs()
}

function showReplyButton(or, top, right, from){
  if(or){
    replyBtn.style.visibility = "visible"
    replyBtn.style.marginTop = `calc(${top} - 12px)`
    if(from){
      replyBtn.style.left = "auto"
      replyBtn.style.right = `${right-58}px`
    }else{
      replyBtn.style.right = "auto"
      replyBtn.style.left = `${right-58}px`
    }
  }else{
    replyBtn.style.visibility = "hidden"
  }
}

function showReplyTab(div){
  username = div.fromNM
  msg = div.msg
  from = div.fromID
  tag = div.tagID
  
  replySender.innerHTML = `Replying to @${username}: `
  reply.innerHTML = msg
  outerreply.style.visibility = "visible"
  currentReply = {}
  currentReply["username"] = username
  currentReply["msg"] = msg
  currentReply["from"] = from
  currentReply["tag"] = tag
}

function clearReply(){
  currentReply = {}
  outerreply.style.visibility = "hidden"
}

function overReply(){
  currentDivOver.style.backgroundColor = "silver"
  if(currentDivOver.fromID === socket.id){
    showReplyButton(true, currentDivOver.style.marginTop, currentDivOver.offsetWidth, true)
  }else{
    showReplyButton(true, currentDivOver.style.marginTop, currentDivOver.offsetWidth, false)
  }
}

function outReply(){
  if(!divOver){
    if(socket.id in currentDivOver.tagID){
      currentDivOver.style.backgroundColor = "yellow"
    }else{
      currentDivOver.style.background = "transparent"
    }
    divOver = false
    currentDivOver = "none"
    showReplyButton(false, " ", " ", false)
  }
}

function replyPressed(){
  textbox.focus()
  showReplyTab(currentDivOver)
}

function showEmojis(){
  if(emojis.style.visibility === "visible"){
    closeEmojis()
  }else{
    emojis.style.visibility = "visible";
    emojisActive = true;
  }
}

function closeEmojis(){
  emojis.style.visibility = "hidden";
  emojisActive = false;
  emojiSearch.value = ""
}

function emojiSelect(e){
  emojis.style.visibility = "hidden";
  textbox.focus();
  emojisActive = false;
  textbox.value = `${textbox.value}${e} `
  message = textbox.value
}

socket.on('UpdateApp', (msgindex) => {
  msgapp["messages"] = msgindex.messages
  msgapp["sender"] = msgindex.sender
  msgapp["tag"] = msgindex.tag
})

socket.on('EnteredApp', (data, onlinedata, id, message, msgindex) => {
  idusers = data
  onlineusers = onlinedata
  if(id === socket.id){
    updateMsgApp(msgindex.messages, msgindex.sender, msgindex.tag)
    updatePrev()
  }else{
    drawEntry(message)
    add(newDiv)
    updateMsgApp(msgindex.messages, msgindex.sender, msgindex.tag)
  }
  updateOnlineList()
})

socket.on('LeftApp', (user, message, msgindex, id) => {
  updateMsgApp(msgindex.messages, msgindex.sender, msgindex.tag)
  delete onlineusers[id]
  updateOnlineList()
  drawExit(message)
  add(newDiv)
})

socket.on('SendApp', (msgindex, message, id, tagTextID) => {
  updateMsgApp(msgindex.messages, msgindex.sender)
  drawUserMsg(message, id, tagTextID, msgindex.messages.length)
  sending = false
})