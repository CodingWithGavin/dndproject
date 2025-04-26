//Create a room 
//listens for our submit on the createroom form to begin
document.addEventListener('DOMContentLoaded', function() {
    const createRoomForm = document.getElementById('createRoomForm');
  
    if (createRoomForm) {
      createRoomForm.addEventListener('submit', async function(e) {
        e.preventDefault();
  
        const player_name = document.getElementById('dmName').value;
        const initiative_count = parseInt(document.getElementById('initiative').value);
  
        const payload = {
          player_name,
          initiative_count
        };
  
        try {
          const response = await fetch('https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
  
          const data = await response.json();
          const player_response = data.player_response;
  
          document.getElementById('roomResult').innerHTML = `
            <div class="alert alert-success">
              <strong>Room Created!</strong> Room Code: <code>${data.room_id}</code>
            </div>
          `;
  
          console.log("Full API Response:", data);
  
          // Get important variables into local storage
          localStorage.setItem('room_id', data.room_id);
          localStorage.setItem('player_name', player_response.player_name);
          localStorage.setItem('initiative_count', player_response.initiative_count);
          localStorage.setItem('player_id', player_response.player_id);
          localStorage.setItem('player_type', player_response.player_type);
  
          // ✅ Log the values properly
          console.log("✅ Room Created - Saving to LocalStorage");
          console.log("Room ID:", data.room_id);
          console.log("Player Name:", player_response.player_name);
          console.log("Initiative:", player_response.initiative_count);
          console.log("Player ID:", player_response.player_id);
          console.log("Player Type:", player_response.player_type);
  
          // move to the next page, the room
          window.location.href = `room.html?room_id=${data.room_id}`;
        } catch (err) {
          document.getElementById('roomResult').innerHTML = `
            <div class="alert alert-danger">Error: ${err.message}</div>
          `;
        }
      });
    } else {
      console.warn("createRoomForm element not found");
    }
  });
  
  // Join a room 
// Listens for our submit on the join room form to begin
document.addEventListener('DOMContentLoaded', function() {
    const joinRoomForm = document.getElementById('joinRoomForm');
    
    if (joinRoomForm) {
      joinRoomForm.addEventListener('submit', async function(e) {
        e.preventDefault();
    
        const player_name = document.getElementById('playerName').value; // Player name input
        const initiative_count = parseInt(document.getElementById('initiativeCount').value); // Player initiative count
        const hit_point_count = parseInt(document.getElementById('hitPointCount').value); // Player hit points
        const AC = parseInt(document.getElementById('armorClass').value); // Player Armor Class (AC)
        const room_id = document.getElementById('roomCode').value.toUpperCase(); //make sure the code is made uppercase

        const payload = {
          player_name,
          initiative_count,
          room_id,  // Room ID should now be uppercase
          hit_point_count,
          AC,
          player_type: 'player' // This is for a regular player (not DM)
        };

        console.log("Checking room with room_id: " + room_id);  // Log to verify room_id is uppercase

        try {
          // First, check if the room exists
          const roomCheckResponse = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room/${room_id}`);
          
          // Check if the room exists using the HTTP status code
          if (!roomCheckResponse.ok) {
            if (roomCheckResponse.status === 404) {
              // Room does not exist
              document.getElementById('roomResult').innerHTML = `
                <div class="alert alert-danger">Error: Room with code <code>${room_id}</code> does not exist.</div>
              `;
              return;  // Exit the function early
            } else {
              // Handle other response status codes
              const errorData = await roomCheckResponse.json();
              document.getElementById('roomResult').innerHTML = `
                <div class="alert alert-danger">Error: ${errorData.message || 'An error occurred'}</div>
              `;
              return;
            }
          }

          // Room exists, proceed to create the player
          console.log("Room exists, proceeding to create player...");
          
          // Make the API call to create the player
          const response = await fetch(`https://29v468q4h6.execute-api.eu-west-1.amazonaws.com/dev/room/${room_id}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
    
          const data = await response.json();
    
          if (response.ok && data.message === 'Player created successfully.') {
            // Handle success
            document.getElementById('roomResult').innerHTML = `
              <div class="alert alert-success">
                <strong>Joined Room!</strong> You are now a player in room with code: <code>${room_id}</code>
              </div>
            `;
    
            console.log("Full API Response:", data);
    
            // Save player details to localStorage
            localStorage.setItem('player_id', data.player_id);
            localStorage.setItem('player_name', data.player_name);
            localStorage.setItem('initiative_count', data.initiative_count);
            localStorage.setItem('player_type', 'player');
    
            // Redirect to room page
            window.location.href = `room.html?room_id=${room_id}`;
          } else {
            // Handle error response
            document.getElementById('roomResult').innerHTML = `
              <div class="alert alert-danger">Error: ${data.message || 'An error occurred'}</div>
            `;
          }
        } catch (err) {
          // Handle general error (e.g., network failure)
          document.getElementById('roomResult').innerHTML = `
            <div class="alert alert-danger">Error: ${err.message}</div>
          `;
        }
      });
    } else {
      console.warn("joinRoomForm element not found");
    }
});


  
  