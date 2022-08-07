import { createBoard, playMove } from "./connect4.js";


function getWebSocketServer() {
    if (window.location.host === "sadricengineering.com:8000") {
      return "wss://readyconnect4.herokuapp.com/";
    } else if (window.location.host === "localhost:8000") {
      return "ws://localhost:8001/";
    } else {
      throw new Error(`Unsupported host: ${window.location.host}`);
    }
  }


window.addEventListener("DOMContentLoaded", ()=>{
    const board = document.querySelector(".board");
    createBoard(board);
    // Open the websocket
    const websocket = new WebSocket(getWebSocketServer());
    initGame(websocket)
    receiveMoves(board, websocket);
    sendMoves(board, websocket);
})


const sendMoves = (board, webSocket) =>{
    const params = new URLSearchParams(window.location.search);
    if (params.has("watch")) {
        return;
      }

    board.addEventListener("click", ({target})=>{
        const column = target.dataset.column;

        if(column === undefined){
            return;
        }

        const event = {
            "type": "play",
            column: parseInt(column, 10),
        };

        webSocket.send(JSON.stringify(event));
    });
}


const winnerMessage = (message) =>{
    const winner = document.querySelector(".winner")
    winner.textContent = message
}

const errorMessage = (message) =>{
    const winner = document.querySelector(".winner")
    winner.textContent = message
}

const receiveMoves = (board, websocket) =>{
    
    websocket.onmessage = ({data}) =>{
        const event  = JSON.parse(data);
        switch(event.type){
            case "init":
                document.querySelector(".join").href = "?join=" + event.join;
                document.querySelector(".watch").href = "?watch=" + event.watch;
                break;
            case "play":
                playMove(board, event.player, event.column, event.row)
                break;
            case "win":
                clearTimeout(()=>{document.querySelector(".winner").textContent=""})
                winnerMessage(`Player ${event.player} wins!`);
                // No further messages are expected; close the websocket connection.
                websocket.close(1000);
                break;
            case "error":
                errorMessage(event.message);
                setTimeout(()=>{document.querySelector(".winner").textContent=""}, 2000)

                break;
            default:
                throw new Error(`Unsuported event type :${event.type}.`);
        }
    };
}

const initGame = (websocket) => {
    websocket.onopen = () =>{
        // Send an "init" event according to who is connecting.
        const params = new URLSearchParams(window.location.search);
        let event = {type: "init"};
        if(params.has("join")){
            event.join = params.get('join')
        }else if (params.has("watch")) {
            // Spectator watches an existing game.
            event.watch = params.get("watch");
        }else {
            // First player starts a new game
            console.log("I started the game")
        }
        websocket.send(JSON.stringify(event));
    };
}