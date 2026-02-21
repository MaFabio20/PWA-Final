<?php
ob_start();
session_start();
define('REDIRECT_PREFIX', 'Location: ');
define('DASHBOARD_URL', '../dashboard.php');

require_once __DIR__ . '/../vendor/autoload.php';

use DB\Conexion;

$pdo = Conexion::connection();

if (!$pdo) {
    die("Error conexión: " . Conexion::$mensaje);
}

$user = $_SESSION['user'] ?? null;

if (!$user) {
    header(REDIRECT_PREFIX . DASHBOARD_URL);
    exit;
}

$id  = intval($_POST['id'] ?? 0);
$new = trim($_POST['estado'] ?? '');

if ($id <= 0 || $new === '') {
    header(REDIRECT_PREFIX . DASHBOARD_URL);
    exit;
}

$stmt = $pdo->prepare("SELECT asignado_a, estado FROM tickets WHERE id = :id");
$stmt->execute([':id' => $id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
   header(REDIRECT_PREFIX . DASHBOARD_URL);
    exit;
}

if ((int)$row['asignado_a'] !== (int)$user['id']) {
    header(REDIRECT_PREFIX . DASHBOARD_URL);
    exit;
}

if ($row['estado'] === 'Finalizado') {
    header(REDIRECT_PREFIX . DASHBOARD_URL);
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

header(REDIRECT_PREFIX . DASHBOARD_URL);
ob_end_flush();
exit;
