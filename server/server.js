const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');
const { db } = require('./db_connection');


// Запуск http та websocket сервера
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server
});

// підключення до ази даних
db.connect(function(err) {
  if (err) throw err;
  // console.log('---Connected to the MySQL server---');
});



// Генераця унікального ідентифікатора підключення
const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};

// Підключені клієнти
const clients = {};
// Користувачі що доєднались до редагування
const users = {};
// Тут зберігаємо поточний вміст редактора
let editorContent = null;
// історія дій користуача
let userActivity = [];



const sendMessage = (json) => {
  // Надсилаємо поточні дані всім підключеним клієнтам
  Object.keys(clients).map((client) => {
    clients[client].sendUTF(json);
  });
}

const typesDef = {
  USER_LOGIN: "userLogin",
  EDIT_DOCUMENT: "editDocument"
}

wsServer.on('request', function(request) {
  var userID = getUniqueID();
  // console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  console.log('Client: ' + userID + ' connected.');
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const dataFromClient = JSON.parse(message.utf8Data);
      const json = { type: dataFromClient.type };
      // вхід до редактора
      if (dataFromClient.type === typesDef.USER_LOGIN) {
        users[userID] = dataFromClient;
        userActivity.push(`${dataFromClient.username} приєднався`);
        json.data = { users, userActivity };
        // запис користувача до бази даних
        var insertData = "INSERT INTO clients(client_ip, username, on_connect)VALUES(?, ?, ?)"
        db.query(insertData, [userID, dataFromClient.username, new Date()], (err, result) => {
          if (err) throw err
          // console.log("user saved to database")
        })
      }
      // редагування тексту
      else if (dataFromClient.type === typesDef.EDIT_DOCUMENT) {
        editorContent = dataFromClient.content;
        // userActivity.push(`${dataFromClient.username} edit the document`);
        json.data = { editorContent, userActivity };
      }
      //відправка даних до клієнської частини
      sendMessage(JSON.stringify(json));
    }
  });
  // Відключення клієнта
  connection.on('close', function(connection) {
    console.log("Client " + userID + " disconnected.");
    const json = { type: typesDef.USER_LOGIN };
    userActivity.push(`${users[userID].username} покинув нас`);
    json.data = { users, userActivity };
    // запис до бази часу коли користувач відключився
    db.query('UPDATE clients SET on_disconnect = \"${new Date()}\" WHERE client_ip = \"${userID}\"', (err, result) => {
      if (err) throw err
    })
    delete clients[userID];
    delete users[userID];
    sendMessage(JSON.stringify(json));
  });
});