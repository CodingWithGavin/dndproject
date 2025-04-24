const createBtn = document.querySelector('[data-bs-target="#createRoomForm"]');
  const joinBtn = document.querySelector('[data-bs-target="#joinRoomForm"]');
  const createCollapse = new bootstrap.Collapse('#createRoomForm', { toggle: false });
  const joinCollapse = new bootstrap.Collapse('#joinRoomForm', { toggle: false });

  createBtn.addEventListener('click', () => {
    joinCollapse.hide();
    createCollapse.toggle();
  });

  joinBtn.addEventListener('click', () => {
    createCollapse.hide();
    joinCollapse.toggle();
  });