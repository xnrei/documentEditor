import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Identicon from 'react-identicons';
import {
  UncontrolledTooltip
} from 'reactstrap';
import Editor from 'react-medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import './App.css';

const client = new W3CWebSocket('ws://127.0.0.1:8000');
const contentDefaultMessage = "Write something";


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUsers: [],
      userActivity: [],
      username: null,
      text: ''
    };
  }
  // При введені валідного username, його надсилає на сервер
  logInUser = () => {
    const username = this.username.value;

    if (checkInputUserName(username)){
        if (username.trim()) {
            const data = {
                username
            };
            this.setState({
                ...data
            }, () => {
                client.send(JSON.stringify({
                    ...data,
                    type: "userLogin",
                    username: username
                }));
            });
        }
    }
  }

  // При зміні всмісту, надсилається поточний вміст редактора на сервер.
 onEditorStateChange = (text) => {
   client.send(JSON.stringify({
     type: "editDocument",
     username: this.state.username,
     content: text
   }));
 };

 componentWillMount() {
   // повідомлення про підключення клієнта до сервера
   client.onopen = () => {
     console.log('Client Connected');
   };
   // обробка отриманих з сервера даних
   client.onmessage = (message) => {
     const dataFromServer = JSON.parse(message.data);
     const stateToChange = {};
     // при логіні
     if (dataFromServer.type === "userLogin") {
       stateToChange.currentUsers = Object.values(dataFromServer.data.users);

     }
     // при зміні документу
     else if (dataFromServer.type === "editDocument") {
       stateToChange.text = dataFromServer.data.editorContent || contentDefaultMessage;
     }
     //
     stateToChange.userActivity = dataFromServer.data.userActivity;
     this.setState({
       ...stateToChange
     });
   };
 }
//сторінка реєстрації
  showLoginSection = () => (
    <div className="account">
      <div className="accountWrapper">
        <div className="accountInfo">
          <div className="accountProfile">
            <p className="accountName">UserName:</p>
            <input name="username" ref={(input) => { this.username = input; }} className="InputUserNameForm"/>
          </div>
          <button type="button" onClick={() => this.logInUser()} className="btn btn-danger joinButton">Приєднатись</button>
        </div>
      </div>
    </div>
  )
// сторінка редагування документу
  showEditorSection = () => (
    <div className="mainPage">
      <div className="document">
        <div className="currentUsers">
          {this.state.currentUsers.map(user => (
            <React.Fragment>
              <span id={user.username} className="userInfo" key={user.username}>
                <Identicon className="accountAvatar"  size={40} string={user.username} />
              </span>
              <UncontrolledTooltip placement="top" target={user.username}>
                {user.username}
              </UncontrolledTooltip>
            </React.Fragment>
          ))}
        </div>
        <Editor
          options={{
            placeholder: {
              text: this.state.text ? contentDefaultMessage : ""
            }
          }}
          className="editor"
          text={this.state.text}
          onChange={this.onEditorStateChange}
        />
      </div>

        <div className='history'>
            <h6 className="historyTitle">Історія </h6>
            <div className="historyWrapper">
                <ul>
                    {this.state.userActivity.map((activity, index) => <li key={`activity-${index}`}>{activity}</li>)}
                </ul>
            </div>
        </div>

    </div>
  )

  render() {
    const {
      username
    } = this.state;
    return (
      <React.Fragment>
          <div className="background">
              <h3 ref="/" className="title">Спільне редагування документу</h3>
              <div className="pageContainer">
                  {username ? this.showEditorSection() : this.showLoginSection()}
              </div>
          </div>
      </React.Fragment>
    );
  }
}

export default App;


//Перевірка правильності вводу імені користувача
function checkInputUserName(username){
    const regex = /[a-zA-Z_]+$/;
    if (regex.test(username)){
        return true
    }else{
        alert("Дозволені лише малі та виликі символи латиниці та \"_\"")
    }
}