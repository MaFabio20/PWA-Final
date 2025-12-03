<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "pwa_ejecucion";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("DB connection error: " . $conn->connect_error);
}
$conn->set_charset("utf8");
?>
