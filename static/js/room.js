// Establishing our local variables which are key for future functions 
console.log("🔍 Checking localStorage values on room.html");

// Retrieve from localStorage, very important as these are needed for a varaibel of functions, do not overwrite carelessly!
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
// socket needs to be a local varibale so the other fucntions can call this and cant be a constant
// incase the users change to a new room and need to reinitialise the connection
let socket;



document.addEventListener('DOMContentLoaded', async () => {
    const roomCode = localStorage.getItem("room_id");
    const playerId = localStorage.getItem("player_id");

    if (roomCode && playerId) {
        connectSocket(roomCode, playerId); // Establish WebSocket connection
        sendPing('refresh player list', 'dataRefresh');
        
        await new Promise(resolve => setTimeout(resolve, 200));  // wait 200ms
        updatePermissions();
        await getRoomDetails(roomCode);
        await getPlayersByRoom(roomCode);
    } else {
        console.warn("Missing roomCode or playerId. WebSocket not started.");
    }
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
        // Start sending a ping every 30 seconds to keep the connection going if its left idol 
        setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
            console.log('Sent ping to keep connection alive');
            }
        }, 30000);
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
                updatePermissions();
                break;
          //case "turnUpdate":
          //     console.log("🌀 Turn update received");
          //     getRoomDetails(roomCode);
          //     getPlayersByRoom(roomCode);
          //     break;
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
        // we do this so we can get the current turn as is for our other functionality 
        // of updating whos current turn it is, we could edit this in the future to pass in more roomdata if needed
        return data.current_turn;

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

        //scan to see if player needs to be kicked
        kickscan(playersData)  
        //using this so we can get the current turn 
        const currentTurn = await getRoomDetails(roomCode);
        // Update the UI with player information
        updatePlayerDetails(playersData, currentTurn);

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
function updatePlayerDetails(players, currentTurn) {
    const tableBody = document.getElementById('playerTableBody');
    tableBody.innerHTML = ''; // Clear old data

    players.sort((a, b) => b.initiative_count - a.initiative_count);

    players.forEach((player, index) => {
        const row = document.createElement('tr');

        if (index + 1 === currentTurn) {
            row.classList.add("table-success");
        }

        row.classList.add("player-row"); // Add a class to identify rows
        row.dataset.player = JSON.stringify(player);

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

document.getElementById('playerTableBody').addEventListener('click', function(event) {
    const row = event.target.closest('.player-row');

    if (row) {
        const playerType = localStorage.getItem('player_type');

        if (playerType === 'DM') {
            try {
                let playerSelected = JSON.parse(row.dataset.player); // Properly parse JSON string
                console.log("Selected Player:", playerSelected);
                openPlayerOptions(playerSelected);
            } catch (err) {
                console.error("Failed to parse player data:", row.dataset.player, err);
                showToast("An error occurred reading the player data.");
            }
        } else {
            showToast("Only the DM can manage players.");
        }
    }
});




// Function to open the player options modal
function openPlayerOptions(playerData) {
    const player = JSON.parse(playerData);  // Get player info from the data attribute
    
    // Filling in our form fields
    document.getElementById('edit-player-id').value = player.id;
    document.getElementById('edit-player-name').value = player.player_name;
    document.getElementById('edit-player-initiative').value = player.initiative_count;
    document.getElementById('edit-player-hp').value = player.hit_point_count;
    document.getElementById('edit-player-ac').value = player.AC;

    // Show the Bootstrap modal
    const myModalElement = document.getElementById('editPlayerModal');
    const myModal = new bootstrap.Modal(myModalElement);
    myModal.show();
    // We needed to set up a timer here because the event listeners needs to come after the modal has been shown
    setTimeout(() => {
        const submitButton = document.getElementById('submitEditPlayerBtn');
        const kickButton = document.getElementById('kickPlayerBtn');
        if (submitButton) {
            submitButton.addEventListener('click', function() {
                submitEditPlayer(player.id, myModal); //We passed in the players id and the modal to ensure the correct one is being referenced 
            }, {once: true});
        } else {
            console.error('Submit button not found!');
        }

        if (kickButton) {
            kickButton.addEventListener('click', function() {
                kickPlayer(player.id, myModal); 
            },{once: true});
        } else {
            console.error('Kick button not found!');
        }

    }, 300); 
}


async function submitEditPlayer(playerId, myModal) {
    // Prevent default form submission behavior
    event.preventDefault();

    const updatedData = {
        playerId: playerId,
        player_name: document.getElementById('edit-player-name').value,
        initiative_count: parseInt(document.getElementById('edit-player-initiative').value),
        hit_point_count: parseInt(document.getElementById('edit-player-hp').value),
        AC: parseInt(document.getElementById('edit-player-ac').value),
        player_type: "player" 
    };

    try {
        const response = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/players/${updatedData.playerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('Player updated!');

            //We complete our ping and then close out the modal
            sendPing('PlayerUpdated', 'dataRefresh');
            myModal.hide(); 
        } else {
            alert('Failed to update player');
        }
    } catch (error) {
        console.error('Error updating player:', error);
    }
}


async function kickPlayer(playerId, myModal) {
    event.preventDefault();
    console.log("Player being deleted", playerId)
    if (confirm('Are you sure you want to kick this player?')) {
        try {
            const response = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/players/${playerId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                alert('Player kicked!');
                myModal.close(); 
                sendPing('PlayerUpdated', 'dataRefresh');
            } else {
                alert('Failed to kick player');
            }
        } catch (error) {
            console.error('Error kicking player:', error);
        }
    }
}

function kickscan(players){
    const currentPlayerId = localStorage.getItem('player_id');
    const playerExists = players.some(player => player.id === currentPlayerId);

    if (!playerExists) {
        // If player is not found in the room, clear localStorage and redirect to main page
        console.log('Player is not in the room, redirecting...');
        localStorage.clear();
        window.location.href = '/';  // Redirect to the main page (index.html)
    } 
    
}

//sends a ping to the websocket which will activate specific actions
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

async function endTurn(increment) {
    const roomCode = localStorage.getItem("room_id");
    try {
        const response = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room/${roomCode}/turn?increment=${increment}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }

        });

        const result = await response.json();
        console.log("✅ Turn ended:", result);
        sendPing('Turn ended', 'dataRefresh');
    } catch (error) {
        console.error("❌ Error ending turn:", error);
    }
}

//This functions not needed anymore as the endturn lambda was editing to account for the current exceeding the amount of players
//Once this happens the lambda then invoked the end round function
//async function endRound() {
//   const roomCode = localStorage.getItem("room_id");
//   try {
//       const response = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room/${roomCode}/round`, {
//           method: "POST",
//           headers: {
//               "Content-Type": "application/json"
//           }
//
//       });
//
//       const result = await response.json();
//       console.log("✅ Round ended:", result);
//       sendPing('Turn ended', 'dataRefresh');
//   } catch (error) {
//       console.error("❌ Error ending turn:", error);
//   }
//


//We make a seperate check for if we are the dm 
// its a simple check that compared the local storage for the moment , 
// //we could change if the future for checkign if their id matches the id of the player in the dbd assocaited with this room
// but this might be overly complex
function amITheDM() {
    return playerType === "DM" ;
}

// we needed to create a function to get find if the player entered is their turn so we could then use the apply permissions functions below 
//
async function isItMyTurn(playerId) {
    const roomCode = localStorage.getItem("room_id");

    try {
        // Fetch latest room info
        const roomResponse = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room/${roomCode}`);
        const roomData = await roomResponse.json();
        const currentTurn = roomData.current_turn;

        // Fetch latest players info
        const playersResponse = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room/${roomCode}/players`);
        const playersData = await playersResponse.json();

        const orderedPlayers = playersData.sort((a, b) => b.initiative_count - a.initiative_count)

        if(orderedPlayers.length === 1 ){
            console.log("You need more players")
            return true;
        }
         const currentPlayer = orderedPlayers[currentTurn - 1];
         console.log("Turn check: Current players turn id: ", currentPlayer.id, "Current Turn is :", currentTurn, "Amount of players is", orderedPlayers.length, "Curent player data", orderedPlayers[currentTurn - 1]);
         return currentPlayer.id === playerId
         
    } catch (error) {
        console.error("❌ Something Wrong with players turn:", error);
        return false;
    }
}

//Here we will be setting up permissions for frontend buttons and features only available when meeting
//certain criteria like if its your turn or if you are the dm 

//first  a function to update our permissions
async function updatePermissions() {
    const playerId = localStorage.getItem('player_id');
    const playerType = localStorage.getItem('player_type'); // 'Player' or 'DM'

    const permissions = {
        canEndTurn: false,
        canEditAndKickPlayers: false,
        //canEditRoomSettings: false,
    };
    console.log("Permission Chat Information: ", playerId, playerType);
    const isMyTurn = await isItMyTurn(playerId, playerType);
    

    if (isMyTurn || amITheDM()) {
        permissions.canEndTurn = true;
    }
    if(amITheDM()){
        permissions.canEditAndKickPlayers  = true;
    }
    applyPermissions(permissions);
}

// function to apply the permissions
function applyPermissions(permissions) {
    const endTurnButton = document.getElementById("end-turn-button");
    const reverseTurnButton = document.getElementById("reverse-turn-button");
    const editanddeletemodal = document.getElementById("editPlayerModal");
    const bootstrapModal = new bootstrap.Modal(editanddeletemodal);
    //const kickPlayerButton = document.getElementById("kick-player-button");
    //const roomSettingsButton = document.getElementById("room-settings-button");

    if (permissions.canEndTurn) {
        endTurnButton.style.display = "block";
        
    } else {
        endTurnButton.style.display = "none";
    }

    if(!permissions.canEditAndKickPlayers) {
        bootstrapModal.hide();
        reverseTurnButton.style.display = "none";
    }else{
        reverseTurnButton.style.display = "block";
    }

    //if (kickPlayerButton) {
    //    kickPlayerButton.style.display = permissions.canKickPlayers ? "block" : "none";
    //}
//
    //if (roomSettingsButton) {
    //    roomSettingsButton.style.display = permissions.canEditRoomSettings ? "block" : "none";
    //}
}
