// socket needs to be a local varibale so the other fucntions can call this and cant be a constant
// incase the users change to a new room and need to reinitialise the connection

let socket;


function connectSocket() {
    const roomCode = "ABCD1234";
    const playerId = "player1";
    socket = new WebSocket(`wss://fvi3nq18r0.execute-api.eu-west-1.amazonaws.com/dev?room_code=${roomCode}&player_id=${playerId}`);

    // Log connection progress every 500ms
    const interval = setInterval(() => {
        console.log("WebSocket readyState:", socket.readyState);
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSED) {
            clearInterval(interval); // Stop checking when it's done
        }
    }, 500);

  socket.onopen = () => {
    console.log("WebSocket connection opened");
    // You can send a test message here if needed
  };

  socket.onmessage = (event) => {
    console.log("Message received from server:", event.data);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function sendMessage() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({ action: "sendMessage", data: "Hello from client!" });
        socket.send(message);
        console.log("Message sent");
    } else {
        console.log("WebSocket is not open.");
    }
}

function disconnectSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();  // This triggers the $disconnect route on the backend
        console.log("Socket closed by user");
    } else {
        console.log("Socket is not open or already closed.");
    }
}

