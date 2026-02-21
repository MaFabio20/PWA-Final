<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';

use DB\Conexion;

$pdo = Conexion::connection();

if (!$pdo) {
    echo json_encode(['status' => 'error', 'msg' => 'db_error']);
    exit;
}

$usuario = $_POST['usuario'] ?? '';
$password = $_POST['password'] ?? '';

if (!$usuario || !$password) {
    echo json_encode(['status' => 'error', 'msg' => 'missing']);
    exit;
}

// Consulta usando PDO
$stmt = $pdo->prepare("SELECT id, usuario, nombre, password, rol FROM usuarios WHERE usuario = ?");
$stmt->execute([$usuario]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {

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

echo json_encode(['status' => 'error']);
exit;