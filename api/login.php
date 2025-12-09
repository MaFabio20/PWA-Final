<?php
session_start();
header('Content-Type: application/json');

require_once "../db/conexion.php";

// Crear la conexión PDO correctamente
$conn = Conexion::connection();

$usuario = $_POST['usuario'] ?? '';
$password = $_POST['password'] ?? '';

if (!$usuario || !$password) {
    echo json_encode(['status' => 'error', 'msg' => 'missing']);
    exit;
}

// Consulta usando PDO
$stmt = $conn->prepare("SELECT id, usuario, nombre, password, rol FROM usuarios WHERE usuario = ?");
$stmt->execute([$usuario]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {

    // Comparación en texto plano (porque así está tu BD)
    if ($row['password'] === $password) {

        $_SESSION['user'] = [
            'id' => $row['id'],
            'usuario' => $row['usuario'],
            'nombre' => $row['nombre'],
            'rol' => $row['rol']
        ];

        echo json_encode(['status' => 'ok']);
        exit;
    }
}

// Si llega aquí → error
echo json_encode(['status' => 'error']);
exit;
