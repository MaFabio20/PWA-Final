-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-12-2025 a las 17:14:08
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

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text NOT NULL,
  `prioridad` enum('Alta','Media','Baja') DEFAULT 'Media',
  `estado` enum('Abierto','En proceso','Finalizado') DEFAULT 'Abierto',
  `creador` int(11) NOT NULL,
  `asignado_a` int(11) NOT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tickets`
--

INSERT INTO `tickets` (`id`, `titulo`, `descripcion`, `prioridad`, `estado`, `creador`, `asignado_a`, `attachment`, `fecha_creacion`) VALUES
(1, 'No tengo internet', 'Me quede sin internet', 'Alta', 'Finalizado', 4, 2, '1764781062_b2c4ac6a3742.png', '2025-12-03 11:57:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `rol` enum('admin','tecnico','usuario') DEFAULT 'usuario'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `usuario`, `password`, `nombre`, `rol`) VALUES
(1, 'admin', '1234', 'Administrador', 'admin'),
(2, 'fmahecha', '1234', 'Fabio Mahecha', 'tecnico'),
(3, 'jramirez', '1234', 'Juan Ramirez', 'tecnico'),
(4, 'cliente1', '1234', 'Cliente Uno', 'usuario');

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
-- Indices de la tabla `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `creador` (`creador`),
  ADD KEY `asignado_a` (`asignado_a`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `historial-user`
--
ALTER TABLE `historial-user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `historial-user`
--
ALTER TABLE `historial-user`
  ADD CONSTRAINT `historial-user_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  ADD CONSTRAINT `historial-user_ibfk_2` FOREIGN KEY (`usuario`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`creador`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`asignado_a`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
