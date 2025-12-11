
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("Service Worker registrado correctamente"))
      .catch(err => console.error("Error al registrar SW:", err));
  }


// Install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Mostrar el cuadro para instalar
function promptInstall(){
  if (deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
    });
  }
}

// Filtro de tickets
function applyFilter(){
  const f = document.getElementById('filterState').value;
  const tickets = document.querySelectorAll('.ticket');

  tickets.forEach(t => {
    if (f === 'todos' || t.dataset.estado === f) {
      t.style.display = '';
    } else {
      t.style.display = 'none';
    }
  });
}

