// Establishing our local variables which are key for future functions 
console.log("🔍 Checking localStorage values on room.html");

// Retrieve from localStorage
const roomId = localStorage.getItem('room_id');
const playerName = localStorage.getItem('player_name');
const initiativeCount = localStorage.getItem('initiative_count');
const playerId = localStorage.getItem('player_id');
const playerType = localStorage.getItem('player_type');

// ✅ Use or display them
console.log("Room ID:", roomId);
console.log("Player Name:", playerName);
console.log("Initiative Count:", initiativeCount);
console.log("Player ID:", playerId);
console.log("Player Type:", playerType);

// Establish WebSocket for live updates
let socket;



document.addEventListener('DOMContentLoaded', () => {
    const roomCode = localStorage.getItem("room_id");
    const playerId = localStorage.getItem("player_id");

    if (roomCode && playerId) {
        connectSocket(roomCode, playerId); // Establish WebSocket connection
        sendPing('refresh player list', 'dataRefresh');
    } else {
        console.warn("Missing roomCode or playerId. WebSocket not started.");
    }

    // Fetch initial room details
    getRoomDetails(roomCode);
    getPlayersByRoom(roomCode);
});

// Function to establish a WebSocket connection
function connectSocket(roomCode, playerId) {
    // Close any existing socket before opening a new one
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }

    // Establish WebSocket connection
    socket = new WebSocket(`wss://fvi3nq18r0.execute-api.eu-west-1.amazonaws.com/dev?room_code=${roomCode}&player_id=${playerId}`);

    socket.onopen = () => {
        console.log("🔌 WebSocket connection opened");

        socket.send(JSON.stringify({ action: "joinRoom", roomCode, playerId }));
    };

    socket.onmessage = (event) => {
        console.log("📨 Message from server:", event.data);

        const message = JSON.parse(event.data);

        switch (message.action) {
            case "heartbeat":
                console.log("❤️ Heartbeat received");
                break;
            case "dataRefresh":
                console.log("🔄 Data refresh requested");
                getRoomDetails(roomCode);
                getPlayersByRoom(roomCode);
                break;
           //case "turnUpdate":
           //    console.log("🌀 Turn update received");
           //    updateTurnState();
           //    break;
           //case "newPlayerJoined":
           //    console.log("👥 New player joined");
           //    addNewPlayerToRoom(message.playerId);
           //    break;
           //case "gameStarted":
           //    console.log("🎮 Game started");
           //    startGame();
           //    break;
            default:
                console.log("⚠️ Unrecognized action:", message.action);
        }
    };

    socket.onclose = () => {
        console.log("❌ WebSocket connection closed");
    };

    socket.onerror = (error) => {
        console.error("⚠️ WebSocket error:", error);
    };
}
//we use this to reference the route to get our room details and populate the html side
async function getRoomDetails(roomCode) {
    try {
        const response = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room/${roomCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching room data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Room data:', data);

        updateRoomDetails(data)

    } catch (error) {
        console.error('Error fetching room details:', error);
    }
}

// Function to fetch players by room
async function getPlayersByRoom(roomCode) {
    try {
        const response = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room/${roomCode}/players`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching players data: ${response.statusText}`);
        }

        const playersData = await response.json();
        console.log('Players data:', playersData);

        // Update the UI with player information
        updatePlayerDetails(playersData);

    } catch (error) {
        console.error('Error fetching players data:', error);
    }
}

// Function to update room details in the DOM
function updateRoomDetails(roomData) {
    // Update DOM elements with room data
    document.getElementById("room-id").innerText = roomData.room_code || 'N/A';
    document.getElementById("session-start-time").innerText = roomData.session_start_time || 'N/A';
    document.getElementById("round-count").innerText = roomData.round_count || 'N/A';
    document.getElementById("current-turn").innerText = roomData.current_turn || 'N/A';
    document.getElementById("room-status").innerText = roomData.room_status || 'N/A';
    
}

// Function to update player details in the DOM
function updatePlayerDetails(players) {
    const tableBody = document.getElementById('playerTableBody');
    tableBody.innerHTML = ''; // Clear old data
  
    players.forEach(player => {
      const row = document.createElement('tr');
  
      row.innerHTML = `
        <td class="col-1">${player.initiative_count}</td>
        <td class="col-2">${player.player_name}</td>
        <td class="col-1">${player.hit_point_count !== undefined && player.hit_point_count !== null ? player.hit_point_count : '~'}</td>
        <td class="col-1">${player.AC !== undefined && player.AC !== null ? player.AC : '~'}</td>
        <td class="col-3">${player.player_type}</td>
      `;
  
      tableBody.appendChild(row);
    });
  }


  async function sendPing(sendingmessage, sendingaction) {
    const roomCode = localStorage.getItem("room_id");

    try {
        const response = await fetch("https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/ping", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                roomCode: roomCode,
                message: sendingmessage,
                action: sendingaction
            })
        });

        const result = await response.json();
        console.log("✅ Ping sent:", result);
    } catch (error) {
        console.error("❌ Error sending ping:", error);
    }
}

