let socket;

function connectSocket() {
  socket = new WebSocket("wss://fvi3nq18r0.execute-api.eu-west-1.amazonaws.com/dev/");

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
    socket.send(JSON.stringify({ action: "default", data: "Hello from local!" }));
  } else {
    console.log("WebSocket is not open.");
  }
}
