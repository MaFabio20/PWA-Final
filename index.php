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

      <!-- FORMULARIO SIN RECARGAR PÁGINA -->
      <form onsubmit="return login(event)" class="login-form">

        <label>Usuario</label>
        <input type="text" name="usuario" required>

        <label>Contraseña</label>
        <input type="password" name="password" required>

        <button type="submit" class="btn-login">Ingresar</button>

        <!-- Mensaje de error -->
        <p id="error-msg" class="error-msg"></p>

      </form>

      <p class="login-info">
        Usuarios de prueba:<br>
        <strong>cliente1 / 1234</strong> (usuario) <br>
        <strong>fmahecha / 1234</strong> (técnico)
      </p>

    </div>

    <div class="login-right"></div>
  </div>

  <script src="js/app.js"></script>

  <!-- SCRIPT DE VALIDACIÓN Y ANIMACIÓN -->
  <script>
    function login(event) {
      event.preventDefault();

      const form = document.querySelector('.login-form');
      const formData = new FormData(form);

      fetch("api/login.php", {
        method: "POST",
        body: formData
      })
      .then(r => r.json())
      .then(data => {
        if (data.status === "ok") {
          window.location.href = "dashboard.php"; // Redirección correcta
        } else {
          mostrarError("Usuario o contraseña incorrectos");
        }
      });

      return false;
    }

    // Animación + texto
    function mostrarError(msg) {
      const err = document.getElementById("error-msg");
      err.innerText = msg;

      const inputs = document.querySelectorAll(".login-form input");

      inputs.forEach(i => {
          i.classList.add("input-error");
          setTimeout(() => i.classList.remove("input-error"), 500);
      });
    }
  </script>

  <!-- REGISTRO CORRECTO DEL SERVICE WORKER -->
  <script>
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("Service Worker registrado en INDEX"))
        .catch(err => console.error("Error SW:", err));
    }
  </script>

</body>
</html>
