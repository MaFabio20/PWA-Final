<?php
session_start();
require_once "../db/conexion.php";

$conn = Conexion::connection();
if (!$conn) { die("Error conexión: " . Conexion::$mensaje); }

$creador = intval($_POST['creador'] ?? 0);
$titulo = trim($_POST['titulo'] ?? '');
$descripcion = trim($_POST['descripcion'] ?? '');
$prioridad = $_POST['prioridad'] ?? 'Media';
$asignado_a = intval($_POST['asignado_a'] ?? 0);

if (!$titulo || !$descripcion || !$asignado_a) {
    header("Location: ../dashboard.php");
    exit;
}

// prepara uploads dir
$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

// manejo de archivo (opcional)
$uploadName = null;
if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
    $tmp = $_FILES['attachment']['tmp_name'];
    $orig = basename($_FILES['attachment']['name']);
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $tmp);
    finfo_close($finfo);

    // permitir solo imágenes
    $allowed = ['image/jpeg','image/png','image/webp','image/gif','image/jpg'];
    if (!in_array($mime, $allowed)) {
        // no permitido, ignorar archivo
        $uploadName = null;
    } else {
        $ext = pathinfo($orig, PATHINFO_EXTENSION);
        $uploadName = time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $dest = $uploadDir . $uploadName;
        if (!move_uploaded_file($tmp, $dest)) {
            $uploadName = null;
        }
    }
}

// insertar ticket (PDO)
$sql = "INSERT INTO tickets (titulo, descripcion, prioridad, estado, creador, asignado_a, attachment) VALUES (:titulo, :descripcion, :prioridad, 'Abierto', :creador, :asignado_a, :attachment)";
$stmt = $conn->prepare($sql);
$stmt->execute([
    ':titulo' => $titulo,
    ':descripcion' => $descripcion,
    ':prioridad' => $prioridad,
    ':creador' => $creador,
    ':asignado_a' => $asignado_a,
    ':attachment' => $uploadName
]);
$ticket_id = $conn->lastInsertId();

// insertar historial
if ($ticket_id) {
    $hstmt = $conn->prepare("INSERT INTO historial (ticket_id, estado, usuario) VALUES (:tid, 'Abierto', :user)");
    $hstmt->execute([':tid' => $ticket_id, ':user' => $creador]);
}

// redirigir de vuelta
header("Location: ../dashboard.php");
exit;
