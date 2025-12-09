-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-12-2025 a las 17:13:59
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pwa_ejecucion`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial-user`
--

CREATE TABLE `historial-user` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `usuario` int(11) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historial-user`
--

INSERT INTO `historial-user` (`id`, `ticket_id`, `estado`, `usuario`, `fecha`) VALUES
(1, 1, 'Abierto', 4, '2025-12-03 11:57:42'),
(2, 1, 'En proceso', 2, '2025-12-03 11:58:21'),
(3, 1, 'Finalizado', 2, '2025-12-03 11:58:26');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `historial-user`
--
ALTER TABLE `historial-user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `usuario` (`usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `historial-user`
--
ALTER TABLE `historial-user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `historial-user`
--
ALTER TABLE `historial-user`
  ADD CONSTRAINT `historial-user_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  ADD CONSTRAINT `historial-user_ibfk_2` FOREIGN KEY (`usuario`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
