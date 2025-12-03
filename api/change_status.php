<?php
session_start();
require_once "../db/conexion.php";

$user = $_SESSION['user'] ?? null;
if (!$user) { header("Location: ../index.php"); exit; }

$id = intval($_POST['id'] ?? 0);
$new = $_POST['estado'] ?? '';

if (!$id || !$new) { header("Location: ../dashboard.php"); exit; }

// comprobar que ticket está asignado al usuario que hace el cambio (solo asignado puede cambiar)
$stmt = $conn->prepare("SELECT asignado_a, estado FROM tickets WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) { header("Location: ../dashboard.php"); exit; }
$row = $res->fetch_assoc();
if ($row['asignado_a'] != $user['id']) { header("Location: ../dashboard.php"); exit; }

// si ya finalizado no permitir
if ($row['estado'] === 'Finalizado') { header("Location: ../dashboard.php"); exit; }

// actualizar
$u = $conn->prepare("UPDATE tickets SET estado = ? WHERE id = ?");
$u->bind_param("si", $new, $id);
$u->execute();
$u->close();

// historial
$h = $conn->prepare("INSERT INTO historial (ticket_id, estado, usuario) VALUES (?, ?, ?)");
$h->bind_param("isi", $id, $new, $user['id']);
$h->execute();
$h->close();

header("Location: ../dashboard.php");
