//Create a room 
//listens for our submit on the createroom form to begin
document.getElementById('createRoomForm').addEventListener('submit', async function(e) {
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
  
      document.getElementById('roomResult').innerHTML = `
        <div class="alert alert-success">
          <strong>Room Created!</strong> Room Code: <code>${data.room_id}</code>
        </div>
      `;
  
    } catch (err) {
      document.getElementById('roomResult').innerHTML = `
        <div class="alert alert-danger">Error: ${err.message}</div>
      `;
    }
  });