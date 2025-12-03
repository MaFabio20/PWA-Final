<?php
session_start();
require_once "../db/conexion.php";

$creador = intval($_POST['creador'] ?? 0);
$titulo = trim($_POST['titulo'] ?? '');
$descripcion = trim($_POST['descripcion'] ?? '');
$prioridad = $_POST['prioridad'] ?? 'Media';
$asignado_a = intval($_POST['asignado_a'] ?? 0);

if (!$titulo || !$descripcion || !$asignado_a) {
    header("Location: ../dashboard.php");
    exit;
}

// Manejo de archivo
$uploadName = null;
if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
    $tmp = $_FILES['attachment']['tmp_name'];
    $orig = basename($_FILES['attachment']['name']);
    // generar nombre único
    $ext = pathinfo($orig, PATHINFO_EXTENSION);
    $uploadName = time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $dest = __DIR__ . '/../uploads/' . $uploadName;
    if (!move_uploaded_file($tmp, $dest)) {
        $uploadName = null;
    }
}

$stmt = $conn->prepare("INSERT INTO tickets (titulo, descripcion, prioridad, estado, creador, asignado_a, attachment) VALUES (?, ?, ?, 'Abierto', ?, ?, ?)");
$stmt->bind_param("sssiss", $titulo, $descripcion, $prioridad, $creador, $asignado_a, $uploadName);
$stmt->execute();
$ticket_id = $stmt->insert_id;
$stmt->close();

// insertar historial
if ($ticket_id) {
    $stmt2 = $conn->prepare("INSERT INTO historial (ticket_id, estado, usuario) VALUES (?, 'Abierto', ?)");
    $stmt2->bind_param("ii", $ticket_id, $creador);
    $stmt2->execute();
    $stmt2->close();
}

header("Location: ../dashboard.php");
