<?php
session_start();
header('Content-Type: application/json');

require_once "../db/conexion.php";

$usuario = $_POST['usuario'] ?? '';
$password = $_POST['password'] ?? '';

if (!$usuario || !$password) {
    echo json_encode(['status'=>'error','msg'=>'missing']);
    exit;
}

$stmt = $conn->prepare("SELECT id, usuario, nombre, password, rol FROM usuarios WHERE usuario = ?");
$stmt->bind_param("s", $usuario);
$stmt->execute();
$res = $stmt->get_result();

if ($res && $res->num_rows === 1) {
    $row = $res->fetch_assoc();

    // Comparación en texto plano para pruebas
    if ($row['password'] === $password) {
        $_SESSION['user'] = [
            'id' => $row['id'],
            'usuario' => $row['usuario'],
            'nombre' => $row['nombre'],
            'rol' => $row['rol']
        ];
        echo json_encode(['status'=>'ok']);
        exit;
    }
}

echo json_encode(['status'=>'error']);
