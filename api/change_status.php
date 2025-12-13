<?php
session_start();
require_once "../db/conexion.php";

$conn = Conexion::connection();
if (!$conn) {
    die("Error conexión: " . Conexion::$mensaje);
}

$user = $_SESSION['user'] ?? null;
if (!$user) {
    header("Location: /index.php");
    exit;
}

$id  = intval($_POST['id'] ?? 0);
$new = trim($_POST['estado'] ?? '');

if ($id <= 0 || $new === '') {
    header("Location: /dashboard.php");
    exit;
}

// comprobar asignación
$stmt = $conn->prepare("SELECT asignado_a, estado FROM tickets WHERE id = :id");
$stmt->execute([':id' => $id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    header("Location: /dashboard.php");
    exit;
}

if ((int)$row['asignado_a'] !== (int)$user['id']) {
    header("Location: /dashboard.php");
    exit;
}

if ($row['estado'] === 'Finalizado') {
    header("Location: /dashboard.php");
    exit;
}

// actualizar
$u = $conn->prepare("UPDATE tickets SET estado = :estado WHERE id = :id");
$u->execute([':estado' => $new, ':id' => $id]);

// historial
$h = $conn->prepare("INSERT INTO historial (ticket_id, estado, usuario) VALUES (:tid, :estado, :user)");
$h->execute([
    ':tid' => $id,
    ':estado' => $new,
    ':user' => $user['id']
]);

header("Location: /dashboard.php");
exit;
