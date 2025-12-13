// ==============================================
// REGISTRAR SERVICE WORKER
// ==============================================
 if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/services-worker.js")
      .then(() => console.log("SW registrado"))
      .catch(err => console.log("Error SW:", err));
  });
}


     

// ==============================================
// LOGIN OFFLINE
// ==============================================
async function loginOffline(user, pass) {
  const savedUser = localStorage.getItem("user");
  const savedPass = localStorage.getItem("pass");

  return user === savedUser && pass === savedPass;
}

// ==============================================
// LOGIN NORMAL + OFFLINE
// ==============================================
window.login = function (event) {
  event.preventDefault();

  const form = document.querySelector(".login-form");
  const data = new FormData(form);
  const user = data.get("usuario");
  const pass = data.get("password");

  // Intento ONLINE
  fetch("api/login.php", { method: "POST", body: data })
    .then(r => r.json())
    .then(res => {
      if (res.status === "ok") {
        localStorage.setItem("user", user);
        localStorage.setItem("pass", pass);
        window.location.href = "dashboard.php";
      } else {
        mostrarError("Credenciales incorrectas");
      }
    })
    .catch(async () => {
      // Intento OFFLINE
      const ok = await loginOffline(user, pass);
      if (ok) {
        window.location.href = "/dashboard.php";
      } else {
        mostrarError("Sin conexión y sin sesión previa.");
      }
    });
};

// Mensajes visuales
function mostrarError(msg) {
  const e = document.getElementById("error-msg");
  e.innerText = msg;
}
