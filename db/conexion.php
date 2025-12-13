<?php

class Conexion {

    public static $mensaje = ""; 

    public static function connection() {

        $hostname  = "server-pwa.mysql.database.azure.com;
        $port      = 3306;
        $database  = "pwa_ejecucion";
        $username  = "admin_php";
        $password  = "Colviseg20*";

        $ssl_cert_path = __DIR__ . "/../assets/databases/DigiCertGlobalRootG2.crt.pem";

        if (!file_exists($ssl_cert_path)) {
            self::$mensaje = "❌ Certificado NO encontrado en: $ssl_cert_path";
            return false;
        }

        try {

            $dsn = "mysql:host=$hostname;port=$port;dbname=$database;charset=utf8";

            $options = [
                PDO::MYSQL_ATTR_SSL_CA => $ssl_cert_path,
                PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ];

            $pdo = new PDO($dsn, $username, $password, $options);

            self::$mensaje = "✔ Conexión exitosa a Azure MySQL";
            return $pdo;

        } catch (PDOException $e) {

            self::$mensaje = "❌ Error de conexión: " . $e->getMessage();
            return false;
        }
    }
}



?>

