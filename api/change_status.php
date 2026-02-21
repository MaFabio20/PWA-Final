<?php
ob_start();
session_start();
define('DASHBOARD_URL', '../dashboard.php');

require_once __DIR__ . '/../vendor/autoload.php';

use DB\Conexion;

$pdo = Conexion::connection();

if (!$pdo) {
    die("Error conexión: " . Conexion::$mensaje);
}

$user = $_SESSION['user'] ?? null;

if (!$user) {
    header("Location: ../index.php");
    exit;
}

$id  = intval($_POST['id'] ?? 0);
$new = trim($_POST['estado'] ?? '');

if ($id <= 0 || $new === '') {
    header("Location: " . DASHBOARD_URL);
    exit;
}

$stmt = $pdo->prepare("SELECT asignado_a, estado FROM tickets WHERE id = :id");
$stmt->execute([':id' => $id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    header("Location: " . DASHBOARD_URL);
    exit;
}

if ((int)$row['asignado_a'] !== (int)$user['id']) {
    header("Location: " . DASHBOARD_URL);
    exit;
}

if ($row['estado'] === 'Finalizado') {
    header("Location: " . DASHBOARD_URL);
    exit;
}

$u = $pdo->prepare("UPDATE tickets SET estado = :estado WHERE id = :id");
$u->execute([
    ':estado' => $new,
    ':id' => $id
]);


$h = $pdo->prepare("INSERT INTO historial (ticket_id, estado, usuario)
                    VALUES (:tid, :estado, :user)");

$h->execute([
    ':tid' => $id,
    ':estado' => $new,
    ':user' => $user['id']
]);

header("Location: " . DASHBOARD_URL);
ob_end_flush();
exit;
