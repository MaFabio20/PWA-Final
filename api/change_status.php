<?php
session_start();
require_once "../db/conexion.php";

$conn = Conexion::connection();
if (!$conn) {
    die("Error conexión");
}

$user = $_SESSION['user'] ?? null;
if (!$user) {
    header("Location: ../index.php");
    exit;
}

$id  = intval($_POST['id'] ?? 0);
$new = $_POST['estado'] ?? '';

$estados_validos = ['Abierto', 'En proceso', 'Finalizado'];

if ($id <= 0 || !in_array($new, $estados_validos)) {
    header("Location: ../dashboard.php");
    exit;
}

/* ==============================
   VALIDAR ASIGNACIÓN
============================== */
$stmt = $conn->prepare(
    "SELECT asignado_a, estado FROM tickets WHERE id = :id"
);
$stmt->execute([':id' => $id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    header("Location: ../dashboard.php");
    exit;
}

// solo el técnico asignado puede cambiar
if ((int)$row['asignado_a'] !== (int)$user['id']) {
    header("Location: ../dashboard.php");
    exit;
}

// si ya está finalizado, no permitir cambios
if ($row['estado'] === 'Finalizado') {
    header("Location: ../dashboard.php");
    exit;
}

/* ==============================
   1. ACTUALIZAR TICKET
============================== */
$u = $conn->prepare(
    "UPDATE tickets SET estado = :estado WHERE id = :id"
);
$u->execute([
    ':estado' => $new,
    ':id'     => $id
]);

/* ==============================
   2. GUARDAR HISTORIAL (TABLA CORRECTA)
============================== */
$h = $conn->prepare(
    "INSERT INTO historial (ticket_id, estado, usuario)
     VALUES (:tid, :estado, :user)"
);
$h->execute([
    ':tid'    => $id,
    ':estado' => $new,
    ':user'   => $user['id']
]);

header("Location: ../dashboard.php");
exit;
