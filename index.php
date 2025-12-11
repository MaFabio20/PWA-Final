<?php
session_start();
if (isset($_SESSION['user'])) header("Location: dashboard.php");
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Colviseg - Login</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="manifest" href="manifest.json">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="shortcut icon" href="assets/img-pwa/favicon.png" type="image/x-icon">
</head>

<body class="login-body">

  <div class="login-container">
    <div class="login-left">
      
      <img src="assets/img-pwa/icon_512.png" class="login-logo" alt="Logo">

      <h2>Iniciar sesión</h2>

      <form onsubmit="return login(event)" class="login-form">
        <label>Usuario</label>
        <input type="text" name="usuario" required>

        <label>Contraseña</label>
        <input type="password" name="password" required>

        <button type="submit" class="btn-login">Ingresar</button>

        <p id="error-msg" class="error-msg"></p>
      </form>

      <p class="login-info">
        Usuarios de prueba:<br>
        <strong>cliente1 / 1234</strong><br>
        <strong>fmahecha / 1234</strong>
      </p>

    </div>
    <div class="login-right"></div>
  </div>

  <script>
    // Verificar sesión offline al cargar la página
    window.addEventListener('load', () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        // Redirigir automáticamente si hay sesión offline
        window.location.href = "dashboard.php";
      }
    });

    function login(event) {
      event.preventDefault();

      const form = document.querySelector('.login-form');
      const formData = new FormData(form);

      fetch("./api/login.php", {
        method: "POST",
        body: formData
      })
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") {
          // Login exitoso online: almacenar flag de sesión
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userToken', 'logged-in'); // Flag simple (no token real)
          window.location.href = "dashboard.php";
        } else {
          mostrarError("Usuario o contraseña incorrectos");
        }
      })
      .catch(err => {
        // Error de conexión: intentar login offline
        const previousToken = localStorage.getItem('userToken');
        if (previousToken === 'logged-in') {
          mostrarError("Login offline: Usando sesión previa. Redirigiendo...");
          setTimeout(() => window.location.href = "dashboard.php", 2000); // Redirigir después de 2 segundos
        } else {
          mostrarError("Sin conexión. No hay sesión previa. Intenta cuando tengas internet.");
        }
      });
    }

    function mostrarError(msg) {
      const err = document.getElementById("error-msg");
      err.innerText = msg;

      const inputs = document.querySelectorAll(".login-form input");
      inputs.forEach(i => {
        i.classList.add("input-error");
        setTimeout(() => i.classList.remove("input-error"), 500);
      });
    }

    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js') // Cambia '/sw.js' si tu SW está en otra ruta
        .then(registration => {
          console.log('Service Worker registrado:', registration);
          // Registrar sync para reenvío offline (útil para tickets en dashboard)
          if ('sync' in registration) {
            registration.sync.register('sync-post-queue');
          }
        })
        .catch(error => console.log('Error registrando SW:', error));
    }
  </script>
<script>
  // Función para mostrar mensajes (agrega un div en tu HTML, ej. <div id="messages"></div>)
  function showMessage(message, type = 'info') {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `<p class="${type}">${message}</p>`;
    setTimeout(() => messagesDiv.innerHTML = '', 5000);
  }

  // Manejar envío de tickets
  document.getElementById('ticketForm').addEventListener('submit', async (e) => { // Cambia 'ticketForm' por el ID real de tu form
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch('/api/submit-ticket.php', { // Cambia por tu endpoint real
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.status === "ok") { // Asume que devuelve {'status': 'ok'}
        showMessage('Ticket enviado exitosamente!', 'success');
        e.target.reset();
      } else if (result.offline) {
        // Offline: El SW ya lo guardó
        showMessage(result.message, 'warning');
        e.target.reset();
      } else {
        showMessage('Error al enviar ticket: ' + (result.msg || 'Desconocido'), 'error');
      }
    } catch (error) {
      showMessage('Error de conexión. El ticket se enviará offline.', 'warning');
    }
  });

  // Verificar sesión offline al cargar (opcional, para asegurar que esté logueado)
  window.addEventListener('load', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      // Si no hay sesión, redirigir a login
      window.location.href = "index.php";
    }
  });
</script>
</body>
</html>