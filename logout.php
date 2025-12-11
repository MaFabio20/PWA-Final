<?php
session_start();
session_destroy();
echo json_encode(['status' => 'ok']);
header("Location: index.php");
exit;
