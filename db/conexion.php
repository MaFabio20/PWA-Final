<?php
## Conexión Azure
public static function connection(){

    $hostname  = "serverphplimpio.mysql.database.azure.com";
    $port      = "3306";
    $database  = "pwa_ejecucion";
    $username  = "admin_php";
    $password  = "Colviseg20*";

    // Ruta del certificado CA descargado desde Azure
    $ssl_cert_path = __DIR__ . "/assets/database/DigiCertGlobalRootG2.crt.pem";

    $options = array(
        PDO::MYSQL_ATTR_SSL_CA => $ssl_cert_path,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    );

    try {

        $pdo = new PDO(
            "mysql:host=$hostname;port=$port;dbname=$database;charset=utf8",
            $username,
            $password,
            $options
        );

        return $pdo;

    } catch (PDOException $e) {
        die("Error de conexión Azure: " . $e->getMessage());
    }
}

?>

