// Install prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // optionally show a UI to ask user to install
});

function promptInstall(){
  if (deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      deferredPrompt = null;
    });
  }
}

// simple filter function for dashboard (client-side)
function applyFilter(){
  const f = document.getElementById('filterState').value;
  const tickets = document.querySelectorAll('.ticket');
  tickets.forEach(t => {
    if (f === 'todos' || t.dataset.estado === f) t.style.display = '';
    else t.style.display = 'none';
  });
}
