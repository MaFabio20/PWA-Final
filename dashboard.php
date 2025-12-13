<?php
session_start();

if (!isset($_SESSION['user'])) {
    echo "<script>
      if (localStorage.getItem('user_offline')) {
        // continuar sin sesión PHP
      } else {
        window.location.href = 'index.php';
      }
    </script>";
}


require_once "db/conexion.php";
$conn = Conexion::connection();
if (!$conn) {
    die("Error de conexión: " . Conexion::$mensaje);
}

$user = $_SESSION['user'];
$userId = intval($user['id']);
$role = $user['rol'];

$tecnicosStmt = $conn->query("SELECT id, nombre FROM usuarios WHERE rol='tecnico' ORDER BY nombre");
$tecnicos = $tecnicosStmt->fetchAll(PDO::FETCH_ASSOC);

if ($role === 'admin') {
    $ticketsSQL = "SELECT t.*, u1.nombre AS creador_nombre, u2.nombre AS asignado_nombre 
                   FROM tickets t 
                   LEFT JOIN usuarios u1 ON t.creador=u1.id 
                   LEFT JOIN usuarios u2 ON t.asignado_a=u2.id 
                   ORDER BY t.fecha_creacion DESC";
    $stmt = $conn->query($ticketsSQL);
} elseif ($role === 'tecnico') {
    $stmt = $conn->prepare("SELECT t.*, u1.nombre AS creador_nombre, u2.nombre AS asignado_nombre 
                            FROM tickets t 
                            LEFT JOIN usuarios u1 ON t.creador=u1.id 
                            LEFT JOIN usuarios u2 ON t.asignado_a=u2.id 
                            WHERE t.asignado_a = :uid OR t.creador = :uid
                            ORDER BY t.fecha_creacion DESC");
    $stmt->execute([':uid' => $userId]);
} else {
    $stmt = $conn->prepare("SELECT t.*, u1.nombre AS creador_nombre, u2.nombre AS asignado_nombre 
                            FROM tickets t 
                            LEFT JOIN usuarios u1 ON t.creador=u1.id 
                            LEFT JOIN usuarios u2 ON t.asignado_a=u2.id 
                            WHERE t.creador = :uid
                            ORDER BY t.fecha_creacion DESC");
    $stmt->execute([':uid' => $userId]);
}

$tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Colviseg - Dashboard</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#004aad">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="shortcut icon" href="assets/img-pwa/favicon.png" type="image/x-icon">
</head>
<body>

<header class="topbar">
  <div class="brand">Colviseg — Tickets</div>
  <div class="user-area">
    <?= htmlspecialchars($user['nombre']) ?> (<?= htmlspecialchars($user['usuario']) ?>)
    <a href="logout.php" class="btn-ghost">Cerrar sesión</a>
  </div>
</header>

<main class="layout">
  <aside class="panel">
    <h3>Crear nuevo ticket</h3>
    <form action="api/create_ticket.php" method="POST" enctype="multipart/form-data">
      <label>Título</label>
      <input name="titulo" required maxlength="200">
      <label>Descripción</label>
      <textarea name="descripcion" rows="4" required></textarea>
      <label>Prioridad</label>
      <select name="prioridad">
        <option>Alta</option>
        <option selected>Media</option>
        <option>Baja</option>
      </select>
      <label>Asignar a (técnico)</label>
      <select name="asignado_a" required>
        <option value="">-- seleccionar --</option>
        <?php foreach($tecnicos as $t): ?>
          <option value="<?= $t['id'] ?>"><?= htmlspecialchars($t['nombre']) ?></option>
        <?php endforeach; ?>
      </select>

      <label>Foto (opcional)</label>
      <!-- capture permite abrir cámara en móviles; en PC abrirá selector de archivos -->
      <input type="file" name="attachment" accept="image/*" capture="environment">

      <input type="hidden" name="creador" value="<?= $userId ?>">
      <button class="btn-primary" type="submit">Crear ticket</button>
    </form>
  </aside>

  <section class="panel-list">
    <div class="list-header">
      <h3>Tickets</h3>
      <div>
        <label>Filtrar:</label>
        <select id="filterState" onchange="applyFilter()">
          <option value="todos">Todos</option>
          <option value="Abierto">Abiertos</option>
          <option value="En proceso">En proceso</option>
          <option value="Finalizado">Finalizados</option>
        </select>
      </div>
    </div>

    <div id="ticketsContainer" class="ticketsContainer">
      <?php if ($tickets): ?>
        <?php foreach($tickets as $row): ?>
          <article class="ticket" data-estado="<?= htmlspecialchars($row['estado']) ?>">
            <div class="ticket-row">
              <div>
                <h4 class="ticket-title"><?= htmlspecialchars($row['titulo']) ?></h4>
                <p class="ticket-desc"><?= nl2br(htmlspecialchars($row['descripcion'])) ?></p>
                <?php if (!empty($row['attachment'])): ?>
                  <p><a href="uploads/<?= htmlspecialchars($row['attachment']) ?>" target="_blank">Ver imagen</a></p>
                <?php endif; ?>
              </div>
              <div style="text-align:right">
                <div class="ticket-meta">Prioridad: <strong><?= htmlspecialchars($row['prioridad']) ?></strong></div>
                <div style="margin-top:8px">
                  <span class="status-pill <?= $row['estado']=='Abierto' ? 'status-abierto' : ($row['estado']=='En proceso' ? 'status-en_proceso' : 'status-finalizado') ?>">
                    <?= htmlspecialchars($row['estado']) ?>
                  </span>
                </div>
              </div>
            </div>

            <div class="ticket-info">
              <div>Creado por: <strong><?= htmlspecialchars($row['creador_nombre']) ?></strong></div>
              <div>Asignado a: <strong><?= htmlspecialchars($row['asignado_nombre']) ?></strong></div>
              <div>Creado: <?= htmlspecialchars($row['fecha_creacion']) ?></div>
            </div>

            <div class="ticket-actions">
              <?php if ($row['asignado_a'] == $userId && $row['estado'] != 'Finalizado'): ?>
                <form action="api/change_status.php" method="POST" style="display:inline-block">
                  <input type="hidden" name="id" value="<?= $row['id'] ?>">
                  <input type="hidden" name="estado" value="En proceso">
                  <button class="small-btn btn-proceso">Marcar En proceso</button>
                </form>

                <form action="api/change_status.php" method="POST" style="display:inline-block">
                  <input type="hidden" name="id" value="<?= $row['id'] ?>">
                  <input type="hidden" name="estado" value="Finalizado">
                  <button class="small-btn btn-final">Marcar Finalizado</button>
                </form>
              <?php endif; ?>
            </div>

            <details class="historial">
              <summary>Historial</summary>
              <ul>
                <?php
                  $hid = intval($row['id']);
                  $hstmt = $conn->prepare("SELECT h.*, u.nombre FROM historial_user h LEFT JOIN usuarios u ON h.usuario=u.id WHERE h.ticket_id = :hid ORDER BY h.fecha DESC");
                  $hstmt->execute([':hid' => $hid]);
                  $hrows = $hstmt->fetchAll(PDO::FETCH_ASSOC);
                  foreach($hrows as $h) {
                    echo "<li>".htmlspecialchars($h['fecha'])." — ".htmlspecialchars($h['nombre'])." → <b>".htmlspecialchars($h['estado'])."</b></li>";
                  }
                ?>
              </ul>
            </details>
          </article>
        <?php endforeach; ?>
      <?php else: ?>
        <p class="muted">No hay tickets para mostrar.</p>
      <?php endif; ?>
    </div>
  </section>
</main>



<script src="./js/app.js"></script>


</script>
</body>
</html>
