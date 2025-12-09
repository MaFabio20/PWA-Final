<?php
session_start();
require_once "../db/conexion.php";

$conn = Conexion::connection();
if (!$conn) { die("Error conexión: " . Conexion::$mensaje); }

$user = $_SESSION['user'] ?? null;
if (!$user) { header("Location: ../index.php"); exit; }

$id = intval($_POST['id'] ?? 0);
$new = $_POST['estado'] ?? '';

if (!$id || !$new) { header("Location: ../dashboard.php"); exit; }

// comprobar que ticket está asignado al usuario que hace el cambio (solo asignado puede cambiar)
$stmt = $conn->prepare("SELECT asignado_a, estado FROM tickets WHERE id = :id");
$stmt->execute([':id' => $id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) { header("Location: ../dashboard.php"); exit; }
if ($row['asignado_a'] != $user['id']) { header("Location: ../dashboard.php"); exit; }

// si ya finalizado no permitir
if ($row['estado'] === 'Finalizado') { header("Location: ../dashboard.php"); exit; }

// actualizar
$u = $conn->prepare("UPDATE tickets SET estado = :estado WHERE id = :id");
$u->execute([':estado' => $new, ':id' => $id]);

// historial
$h = $conn->prepare("INSERT INTO historial (ticket_id, estado, usuario) VALUES (:tid, :estado, :user)");
$h->execute([':tid' => $id, ':estado' => $new, ':user' => $user['id']]);

header("Location: ../dashboard.php");
exit;
