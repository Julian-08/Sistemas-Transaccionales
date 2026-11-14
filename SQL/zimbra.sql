-- =====================================================================
-- CRM ZIMBRA - Versión 5
-- Incluye: tablas, triggers, procedimientos almacenados y datos de prueba.
-- Roles fijos: 1 = ADMINISTRADOR, 2 = ASESOR, 3 = CLIENTE.
-- Motor: MySQL 8.0.16 o superior (CHECK, CTE recursivas, SIGNAL).
-- Las contraseñas de prueba son PLACEHOLDER: la aplicación debe enviar
-- hashes reales (bcrypt/argon2) a los procedimientos.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS crm_zimbra
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE crm_zimbra;

-- =====================================================================
-- TABLAS
-- =====================================================================

-- 1. ROLES
CREATE TABLE roles (
    id_rol  INT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(30) NOT NULL UNIQUE,
    CONSTRAINT chk_nombre_rol CHECK (nombre IN ('CLIENTE', 'ASESOR', 'ADMINISTRADOR'))
);

-- 2. USUARIOS
CREATE TABLE usuarios (
    id_usuario               INT AUTO_INCREMENT PRIMARY KEY,
    id_rol                   INT NOT NULL,
    nombre                   VARCHAR(100) NOT NULL,
    email                    VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash          VARCHAR(255) NOT NULL,
    estado                   VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    token_recuperacion_hash  VARCHAR(255) NULL,
    token_expiracion         DATETIME NULL,
    fecha_creacion           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    CONSTRAINT chk_estado_usuario CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- 3. ASESOR_COMERCIAL
CREATE TABLE asesor_comercial (
    id_asesor     INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario    INT NOT NULL UNIQUE,
    meta_mensual  DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_asesor_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_meta_mensual CHECK (meta_mensual >= 0)
);

-- 4. CLIENTES
CREATE TABLE clientes (
    id_cliente           INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario           INT NOT NULL UNIQUE,
    empresa              VARCHAR(100) NOT NULL,
    origen_web           VARCHAR(100) DEFAULT 'Sitio Web Zimbra',
    puntaje              INT NOT NULL DEFAULT 0,
    fecha_registro       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    es_prospecto         BOOLEAN NOT NULL DEFAULT FALSE,
    estado_prospecto     VARCHAR(20) NULL,
    fecha_clasificacion  DATETIME NULL,
    id_asesor            INT NULL,
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_cliente_asesor FOREIGN KEY (id_asesor) REFERENCES asesor_comercial(id_asesor) ON DELETE SET NULL,
    CONSTRAINT chk_puntaje_cliente CHECK (puntaje >= 0),
    CONSTRAINT chk_estado_prospecto CHECK (
        estado_prospecto IS NULL
        OR estado_prospecto IN ('NUEVO', 'CONTACTADO', 'INTERESADO', 'CERRADO', 'DESCARTADO')
    )
);

-- 5. PRUEBAS_DESCARGA
CREATE TABLE pruebas_descarga (
    id_prueba          INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente         INT NOT NULL,
    fecha_inicio       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dias_prueba        INT NOT NULL DEFAULT 60,
    fecha_vencimiento  DATETIME NOT NULL,
    CONSTRAINT fk_prueba_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    CONSTRAINT chk_dias_prueba CHECK (dias_prueba > 0),
    CONSTRAINT chk_fechas_prueba CHECK (fecha_vencimiento > fecha_inicio)
);

-- 6. INGRESOS
CREATE TABLE ingresos (
    id_ingreso  INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario  INT NOT NULL,
    fecha_hora  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ingreso_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 7. ACTIVIDAD_MARKETING
CREATE TABLE actividad_marketing (
    id_actividad            INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente              INT NOT NULL,
    tipo_evento             VARCHAR(50) NOT NULL,
    fecha_hora              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    url_visitada            VARCHAR(255),
    tiempo_permanencia_seg  INT NOT NULL DEFAULT 0,
    scoring_interes         INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_actividad_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    CONSTRAINT chk_tipo_evento CHECK (tipo_evento IN ('DESCARGA', 'VISITA_WEB', 'EMAIL', 'FORMULARIO')),
    CONSTRAINT chk_tiempo_permanencia CHECK (tiempo_permanencia_seg >= 0)
);

-- 8. SEGUIMIENTOS
CREATE TABLE seguimientos (
    id_seguimiento     INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente         INT NOT NULL,
    id_asesor          INT NOT NULL,
    fecha_seguimiento  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    medio              VARCHAR(20) NOT NULL,
    observaciones      TEXT,
    CONSTRAINT fk_seguimiento_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    CONSTRAINT fk_seguimiento_asesor FOREIGN KEY (id_asesor) REFERENCES asesor_comercial(id_asesor),
    CONSTRAINT chk_medio CHECK (medio IN ('LLAMADA', 'CORREO'))
);

-- 9. ALERTAS
CREATE TABLE alertas (
    id_alerta           INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente          INT NOT NULL,
    id_usuario_destino  INT NOT NULL,
    mensaje             VARCHAR(255) NOT NULL,
    fecha_hora          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida               BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_alerta_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_destino FOREIGN KEY (id_usuario_destino) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 10. PROPUESTAS_RFP
CREATE TABLE propuestas_rfp (
    id_propuesta    INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente      INT NOT NULL,
    id_asesor       INT NOT NULL,
    monto_estimado  DECIMAL(12, 2) NOT NULL,
    fecha_emision   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado          VARCHAR(20) NOT NULL DEFAULT 'ENVIADA',
    CONSTRAINT fk_propuesta_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_propuesta_asesor FOREIGN KEY (id_asesor) REFERENCES asesor_comercial(id_asesor),
    CONSTRAINT chk_monto_estimado CHECK (monto_estimado > 0),
    CONSTRAINT chk_estado_propuesta CHECK (estado IN ('ENVIADA', 'EN_REVISION', 'ACEPTADA', 'RECHAZADA'))
);

-- 11. VENTAS_LICENCIAS
CREATE TABLE ventas_licencias (
    id_venta       INT AUTO_INCREMENT PRIMARY KEY,
    id_propuesta   INT NOT NULL UNIQUE,
    id_cliente     INT NOT NULL,
    id_asesor      INT NOT NULL,
    monto_final    DECIMAL(12, 2) NOT NULL,
    fecha_cierre   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_licencia  VARCHAR(30) NOT NULL,
    periodo        VARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
    CONSTRAINT fk_venta_propuesta FOREIGN KEY (id_propuesta) REFERENCES propuestas_rfp(id_propuesta),
    CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_venta_asesor FOREIGN KEY (id_asesor) REFERENCES asesor_comercial(id_asesor),
    CONSTRAINT chk_monto_final CHECK (monto_final > 0),
    CONSTRAINT chk_tipo_licencia CHECK (tipo_licencia IN ('ILIMITADA', 'PAGO_POR_USO'))
);

-- =====================================================================
-- TRIGGERS
-- Regla: un trigger no debe leer ni escribir la tabla que dispara la
-- sentencia (error 1442). Por eso cada uno toca tablas distintas.
-- =====================================================================
DELIMITER $$

-- T1 (RF-006, RF-008): cada actividad suma su puntaje al cliente y, si el
--     cliente ya es prospecto, genera una alerta al asesor o al administrador.
CREATE TRIGGER trg_actividad_ai
AFTER INSERT ON actividad_marketing
FOR EACH ROW
BEGIN
    DECLARE v_es_prospecto BOOLEAN;
    DECLARE v_destino INT;

    UPDATE clientes
       SET puntaje = puntaje + NEW.scoring_interes
     WHERE id_cliente = NEW.id_cliente;

    SELECT es_prospecto INTO v_es_prospecto
      FROM clientes
     WHERE id_cliente = NEW.id_cliente;

    IF v_es_prospecto = 1 THEN
        -- RF-008 A1: si no hay asesor asignado, la alerta va al administrador activo
        SET v_destino = (
            SELECT COALESCE(
                       a.id_usuario,
                       (SELECT u.id_usuario FROM usuarios u
                         WHERE u.id_rol = 1 AND u.estado = 'ACTIVO'
                         ORDER BY u.id_usuario LIMIT 1))
              FROM clientes c
              LEFT JOIN asesor_comercial a ON a.id_asesor = c.id_asesor
             WHERE c.id_cliente = NEW.id_cliente
        );

        IF v_destino IS NOT NULL THEN
            INSERT INTO alertas (id_cliente, id_usuario_destino, mensaje)
            VALUES (NEW.id_cliente, v_destino,
                    CONCAT('Prospecto activo en el sitio: ', NEW.tipo_evento));
        END IF;
    END IF;
END$$

-- T2 (RF-007, RF-017): al superar el puntaje mínimo, el cliente pasa a prospecto.
--     Puntaje mínimo = 50 (RF-017). Para cambiarlo, edite el valor aquí.
CREATE TRIGGER trg_clientes_bu
BEFORE UPDATE ON clientes
FOR EACH ROW
BEGIN
    IF OLD.es_prospecto = FALSE AND NEW.puntaje >= 50 THEN
        SET NEW.es_prospecto = TRUE,
            NEW.estado_prospecto = 'NUEVO',
            NEW.fecha_clasificacion = NOW();
    END IF;
END$$

-- T3 (Descarga de prueba): calcula la fecha de vencimiento a partir de los días.
CREATE TRIGGER trg_pruebas_bi
BEFORE INSERT ON pruebas_descarga
FOR EACH ROW
BEGIN
    SET NEW.fecha_vencimiento = DATE_ADD(NEW.fecha_inicio, INTERVAL NEW.dias_prueba DAY);
END$$

-- T4 (RF-013): el primer seguimiento pasa el prospecto de NUEVO a CONTACTADO.
CREATE TRIGGER trg_seguimientos_ai
AFTER INSERT ON seguimientos
FOR EACH ROW
BEGIN
    UPDATE clientes
       SET estado_prospecto = 'CONTACTADO'
     WHERE id_cliente = NEW.id_cliente
       AND estado_prospecto = 'NUEVO';
END$$

-- =====================================================================
-- PROCEDIMIENTOS ALMACENADOS (transacciones)
-- =====================================================================

-- RF-001 / Registro: el cliente se registra y se crea su ficha de cliente.
CREATE PROCEDURE sp_registrar_cliente(
    IN p_nombre   VARCHAR(100),
    IN p_email    VARCHAR(100),
    IN p_hash     VARCHAR(255),
    IN p_empresa  VARCHAR(100)
)
BEGIN
    DECLARE v_id_usuario INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El correo ya está registrado';
    END IF;

    INSERT INTO usuarios (id_rol, nombre, email, contrasena_hash)
    VALUES (3, p_nombre, p_email, p_hash);
    SET v_id_usuario = LAST_INSERT_ID();

    INSERT INTO clientes (id_usuario, empresa) VALUES (v_id_usuario, p_empresa);
    COMMIT;
END$$

-- RF-001 / RF-004: registra un ingreso solo si el usuario está activo (A2).
CREATE PROCEDURE sp_registrar_ingreso(IN p_id_usuario INT)
BEGIN
    DECLARE v_estado VARCHAR(20);

    SELECT estado INTO v_estado FROM usuarios WHERE id_usuario = p_id_usuario;

    IF v_estado IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario no existe';
    END IF;
    IF v_estado <> 'ACTIVO' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuario inactivo: acceso denegado';
    END IF;

    INSERT INTO ingresos (id_usuario) VALUES (p_id_usuario);
END$$

-- RF-014: el administrador crea administradores o asesores.
CREATE PROCEDURE sp_crear_usuario(
    IN p_nombre     VARCHAR(100),
    IN p_email      VARCHAR(100),
    IN p_hash       VARCHAR(255),
    IN p_id_rol     INT,
    IN p_meta       DECIMAL(12, 2)
)
BEGIN
    DECLARE v_id_usuario INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_id_rol NOT IN (1, 2) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Aquí solo se crean administradores o asesores; los clientes se registran solos';
    END IF;

    START TRANSACTION;
    IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El correo ya está registrado';
    END IF;

    INSERT INTO usuarios (id_rol, nombre, email, contrasena_hash)
    VALUES (p_id_rol, p_nombre, p_email, p_hash);
    SET v_id_usuario = LAST_INSERT_ID();

    IF p_id_rol = 2 THEN
        INSERT INTO asesor_comercial (id_usuario, meta_mensual)
        VALUES (v_id_usuario, IFNULL(p_meta, 0));
    END IF;
    COMMIT;
END$$

-- RF-014: activar o desactivar usuarios. No se puede desactivar al último admin activo.
CREATE PROCEDURE sp_cambiar_estado_usuario(IN p_id_usuario INT, IN p_estado VARCHAR(20))
BEGIN
    DECLARE v_rol INT;
    DECLARE v_admins INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT id_rol INTO v_rol FROM usuarios WHERE id_usuario = p_id_usuario FOR UPDATE;

    IF p_estado = 'INACTIVO' AND v_rol = 1 THEN
        SELECT COUNT(*) INTO v_admins FROM usuarios WHERE id_rol = 1 AND estado = 'ACTIVO';
        IF v_admins <= 1 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede desactivar al único administrador activo';
        END IF;
    END IF;

    UPDATE usuarios SET estado = p_estado WHERE id_usuario = p_id_usuario;
    COMMIT;
END$$

-- RF-015: asignar rol. No se puede quitar el rol de administrador al último admin activo (A1).
CREATE PROCEDURE sp_asignar_rol(IN p_id_usuario INT, IN p_id_rol INT)
BEGIN
    DECLARE v_rol_actual INT;
    DECLARE v_admins INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT id_rol INTO v_rol_actual FROM usuarios WHERE id_usuario = p_id_usuario FOR UPDATE;

    IF v_rol_actual = 1 AND p_id_rol <> 1 THEN
        SELECT COUNT(*) INTO v_admins FROM usuarios WHERE id_rol = 1 AND estado = 'ACTIVO';
        IF v_admins <= 1 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede quitar el rol al único administrador';
        END IF;
    END IF;

    UPDATE usuarios SET id_rol = p_id_rol WHERE id_usuario = p_id_usuario;

    IF p_id_rol = 2 AND NOT EXISTS (SELECT 1 FROM asesor_comercial WHERE id_usuario = p_id_usuario) THEN
        INSERT INTO asesor_comercial (id_usuario, meta_mensual) VALUES (p_id_usuario, 0);
    END IF;
    COMMIT;
END$$

-- RF-003: solicitar recuperación. Siempre responde igual, exista o no el correo.
CREATE PROCEDURE sp_solicitar_recuperacion(
    IN p_email       VARCHAR(100),
    IN p_token_hash  VARCHAR(255),
    IN p_minutos     INT
)
BEGIN
    UPDATE usuarios
       SET token_recuperacion_hash = p_token_hash,
           token_expiracion = NOW() + INTERVAL p_minutos MINUTE
     WHERE email = p_email AND estado = 'ACTIVO';
END$$

-- RF-003: restablecer contraseña con token vigente y de un solo uso.
CREATE PROCEDURE sp_restablecer_contrasena(
    IN p_id_usuario   INT,
    IN p_token_hash   VARCHAR(255),
    IN p_nuevo_hash   VARCHAR(255)
)
BEGIN
    DECLARE v_token VARCHAR(255);
    DECLARE v_expira DATETIME;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT token_recuperacion_hash, token_expiracion
      INTO v_token, v_expira
      FROM usuarios
     WHERE id_usuario = p_id_usuario
       FOR UPDATE;

    IF v_token IS NULL OR v_token <> p_token_hash THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Enlace de recuperación inválido';
    END IF;
    IF v_expira < NOW() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El enlace venció; solicita uno nuevo';
    END IF;

    UPDATE usuarios
       SET contrasena_hash = p_nuevo_hash,
           token_recuperacion_hash = NULL,
           token_expiracion = NULL
     WHERE id_usuario = p_id_usuario;
    COMMIT;
END$$

-- RF-005: registrar una actividad del cliente. El puntaje lo suma el trigger T1.
CREATE PROCEDURE sp_registrar_actividad(
    IN p_id_cliente  INT,
    IN p_tipo        VARCHAR(50),
    IN p_url         VARCHAR(255),
    IN p_tiempo_seg  INT
)
BEGIN
    DECLARE v_score INT;

    SET v_score = CASE p_tipo
                    WHEN 'DESCARGA'   THEN 40
                    WHEN 'FORMULARIO' THEN 30
                    WHEN 'EMAIL'      THEN 15
                    WHEN 'VISITA_WEB' THEN 10
                    ELSE NULL
                  END;
    IF v_score IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipo de evento no válido';
    END IF;

    INSERT INTO actividad_marketing
        (id_cliente, tipo_evento, url_visitada, tiempo_permanencia_seg, scoring_interes)
    VALUES (p_id_cliente, p_tipo, p_url, p_tiempo_seg, v_score);
END$$

-- Descarga de la prueba: crea la prueba y registra la descarga como actividad.
CREATE PROCEDURE sp_descargar_prueba(IN p_id_cliente INT, IN p_dias INT)
BEGIN
    DECLARE v_vigentes INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT COUNT(*) INTO v_vigentes
      FROM pruebas_descarga
     WHERE id_cliente = p_id_cliente AND fecha_vencimiento > NOW();

    IF v_vigentes > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El cliente ya tiene una prueba vigente';
    END IF;

    INSERT INTO pruebas_descarga (id_cliente, fecha_inicio, dias_prueba, fecha_vencimiento)
    VALUES (p_id_cliente, NOW(), p_dias, NOW());   -- T3 recalcula el vencimiento

    CALL sp_registrar_actividad(p_id_cliente, 'DESCARGA', '/descargas/prueba', 0);
    COMMIT;
END$$

-- RF-016: asignar un prospecto a un asesor activo y avisarle.
CREATE PROCEDURE sp_asignar_prospecto(IN p_id_cliente INT, IN p_id_asesor INT)
BEGIN
    DECLARE v_es_prospecto BOOLEAN;
    DECLARE v_usuario INT;
    DECLARE v_estado VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT es_prospecto INTO v_es_prospecto
      FROM clientes WHERE id_cliente = p_id_cliente FOR UPDATE;

    IF v_es_prospecto IS NULL OR v_es_prospecto = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se asignan prospectos';
    END IF;

    SELECT a.id_usuario, u.estado INTO v_usuario, v_estado
      FROM asesor_comercial a
      JOIN usuarios u ON u.id_usuario = a.id_usuario
     WHERE a.id_asesor = p_id_asesor;

    IF v_usuario IS NULL OR v_estado <> 'ACTIVO' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El asesor no existe o está inactivo';
    END IF;

    UPDATE clientes SET id_asesor = p_id_asesor WHERE id_cliente = p_id_cliente;

    INSERT INTO alertas (id_cliente, id_usuario_destino, mensaje)
    VALUES (p_id_cliente, v_usuario, 'Nuevo prospecto asignado a tu cartera');
    COMMIT;
END$$

-- RF-012: registrar un seguimiento solo sobre prospectos propios (RF-016).
CREATE PROCEDURE sp_registrar_seguimiento(
    IN p_id_cliente     INT,
    IN p_id_asesor      INT,
    IN p_medio          VARCHAR(20),
    IN p_observaciones  TEXT
)
BEGIN
    DECLARE v_asignado INT;

    SELECT id_asesor INTO v_asignado
      FROM clientes
     WHERE id_cliente = p_id_cliente AND es_prospecto = 1;

    IF v_asignado IS NULL OR v_asignado <> p_id_asesor THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo puedes registrar seguimientos a tus prospectos';
    END IF;

    INSERT INTO seguimientos (id_cliente, id_asesor, medio, observaciones)
    VALUES (p_id_cliente, p_id_asesor, p_medio, p_observaciones);   -- T4 actualiza el estado
END$$

-- RF-013: cambiar el estado del prospecto (solo el asesor asignado).
CREATE PROCEDURE sp_cambiar_estado_prospecto(
    IN p_id_cliente  INT,
    IN p_id_asesor   INT,
    IN p_estado      VARCHAR(20)
)
BEGIN
    DECLARE v_asignado INT;

    SELECT id_asesor INTO v_asignado
      FROM clientes
     WHERE id_cliente = p_id_cliente AND es_prospecto = 1;

    IF v_asignado IS NULL OR v_asignado <> p_id_asesor THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo puedes cambiar el estado de tus prospectos';
    END IF;

    UPDATE clientes SET estado_prospecto = p_estado WHERE id_cliente = p_id_cliente;
END$$

-- RF-011: marcar una alerta como leída (solo su destinatario).
CREATE PROCEDURE sp_marcar_alerta_leida(IN p_id_alerta INT, IN p_id_usuario INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM alertas
                    WHERE id_alerta = p_id_alerta AND id_usuario_destino = p_id_usuario) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La alerta no existe o no es tuya';
    END IF;

    UPDATE alertas SET leida = TRUE WHERE id_alerta = p_id_alerta;
END$$

-- Ventas: crear una propuesta RFP para un prospecto asignado al asesor.
CREATE PROCEDURE sp_crear_propuesta(
    IN p_id_cliente  INT,
    IN p_id_asesor   INT,
    IN p_monto       DECIMAL(12, 2)
)
BEGIN
    DECLARE v_asignado INT;
    DECLARE v_estado VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT id_asesor, estado_prospecto INTO v_asignado, v_estado
      FROM clientes
     WHERE id_cliente = p_id_cliente AND es_prospecto = 1
       FOR UPDATE;

    IF v_asignado IS NULL OR v_asignado <> p_id_asesor THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo puedes proponer a tus prospectos';
    END IF;
    IF v_estado IN ('CERRADO', 'DESCARTADO') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El prospecto ya está cerrado o descartado';
    END IF;

    INSERT INTO propuestas_rfp (id_cliente, id_asesor, monto_estimado)
    VALUES (p_id_cliente, p_id_asesor, p_monto);

    SELECT LAST_INSERT_ID() AS id_propuesta;
    COMMIT;
END$$

-- Ventas: cierre transaccional. Bloquea la propuesta, registra la venta,
-- acepta la propuesta y cierra el prospecto. Todo o nada.
CREATE PROCEDURE sp_registrar_venta(
    IN p_id_propuesta  INT,
    IN p_monto_final   DECIMAL(12, 2),
    IN p_tipo          VARCHAR(30),
    IN p_periodo       VARCHAR(20)
)
BEGIN
    DECLARE v_cliente INT;
    DECLARE v_asesor INT;
    DECLARE v_estado VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    SELECT id_cliente, id_asesor, estado INTO v_cliente, v_asesor, v_estado
      FROM propuestas_rfp
     WHERE id_propuesta = p_id_propuesta
       FOR UPDATE;

    IF v_cliente IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La propuesta no existe';
    END IF;
    IF v_estado = 'RECHAZADA' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede vender una propuesta rechazada';
    END IF;

    INSERT INTO ventas_licencias
        (id_propuesta, id_cliente, id_asesor, monto_final, tipo_licencia, periodo)
    VALUES (p_id_propuesta, v_cliente, v_asesor, p_monto_final, p_tipo, p_periodo);

    UPDATE propuestas_rfp SET estado = 'ACEPTADA' WHERE id_propuesta = p_id_propuesta;
    UPDATE clientes SET estado_prospecto = 'CERRADO' WHERE id_cliente = v_cliente;
    COMMIT;
END$$

DELIMITER ;

-- =====================================================================
-- DATOS DE PRUEBA
-- Orden: primero catálogos, luego clientes. Los triggers se disparan
-- solos al insertar actividad: 40 visitas (10 pts) + 20 descargas (40 pts)
-- llevan a 20 clientes a 50 pts, es decir, a prospectos.
-- =====================================================================

-- Roles fijos
INSERT INTO roles (id_rol, nombre) VALUES
    (1, 'ADMINISTRADOR'),
    (2, 'ASESOR'),
    (3, 'CLIENTE');

-- Administrador y 3 asesores (ids 1 a 4)
INSERT INTO usuarios (id_usuario, id_rol, nombre, email, contrasena_hash, estado) VALUES
    (1, 1, 'Admin General',  'admin@zimbra.test',        '$2b$12$PLACEHOLDER_ADMIN',  'ACTIVO'),
    (2, 2, 'Laura Méndez',   'laura.mendez@zimbra.test', '$2b$12$PLACEHOLDER_ASESOR1', 'ACTIVO'),
    (3, 2, 'Carlos Ruiz',    'carlos.ruiz@zimbra.test',  '$2b$12$PLACEHOLDER_ASESOR2', 'ACTIVO'),
    (4, 2, 'Paula Torres',   'paula.torres@zimbra.test', '$2b$12$PLACEHOLDER_ASESOR3', 'ACTIVO');

-- 40 clientes (ids 5 a 44)
INSERT INTO usuarios (id_rol, nombre, email, contrasena_hash)
SELECT 3,
       CONCAT('Cliente ', n),
       CONCAT('cliente', n, '@empresa.test'),
       CONCAT('$2b$12$PLACEHOLDER_CLIENTE_', LPAD(n, 2, '0'))
  FROM (WITH RECURSIVE nums AS (
            SELECT 1 AS n
            UNION ALL
            SELECT n + 1 FROM nums WHERE n < 40
        )
        SELECT n FROM nums) AS t;

INSERT INTO clientes (id_usuario, empresa)
SELECT id_usuario, CONCAT('Empresa ', id_usuario)
  FROM usuarios
 WHERE id_rol = 3
 ORDER BY id_usuario;

-- Ficha de asesor para los usuarios 2, 3 y 4 (ids 1, 2 y 3)
INSERT INTO asesor_comercial (id_asesor, id_usuario, meta_mensual) VALUES
    (1, 2, 50000000.00),
    (2, 3, 45000000.00),
    (3, 4, 40000000.00);

-- Actividad web (los triggers actualizan puntaje y generan alertas).
-- Se usan números generados, no la tabla clientes, para no violar la regla 1442.
-- Pasada 1: 40 visitas, 10 pts cada una
INSERT INTO actividad_marketing (id_cliente, tipo_evento, fecha_hora, url_visitada, tiempo_permanencia_seg, scoring_interes)
SELECT n, 'VISITA_WEB', NOW() - INTERVAL MOD(n, 20) DAY, '/producto/licencias', 60 + MOD(n * 13, 240), 10
  FROM (WITH RECURSIVE nums AS (
            SELECT 1 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 40)
        SELECT n FROM nums) AS t;

-- Pasada 2: descarga de prueba para los clientes 1 a 20 (40 pts cada una)
INSERT INTO actividad_marketing (id_cliente, tipo_evento, fecha_hora, url_visitada, tiempo_permanencia_seg, scoring_interes)
SELECT n, 'DESCARGA', NOW() - INTERVAL 1 DAY, '/descargas/prueba', 300, 40
  FROM (WITH RECURSIVE nums AS (
            SELECT 1 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 40)
        SELECT n FROM nums) AS t
 WHERE n <= 20;

-- Pasada 3: formulario para los clientes 21 a 30 (30 pts; quedan debajo del mínimo)
INSERT INTO actividad_marketing (id_cliente, tipo_evento, fecha_hora, url_visitada, tiempo_permanencia_seg, scoring_interes)
SELECT n, 'FORMULARIO', NOW() - INTERVAL 3 DAY, '/contacto', 120, 30
  FROM (WITH RECURSIVE nums AS (
            SELECT 1 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 40)
        SELECT n FROM nums) AS t
 WHERE n BETWEEN 21 AND 30;

-- Pruebas de descarga para los clientes 1 a 30 (el trigger calcula el vencimiento)
INSERT INTO pruebas_descarga (id_cliente, fecha_inicio, dias_prueba, fecha_vencimiento)
SELECT n, NOW() - INTERVAL MOD(n * 7, 50) DAY, 60, NOW()
  FROM (WITH RECURSIVE nums AS (
            SELECT 1 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 40)
        SELECT n FROM nums) AS t
 WHERE n <= 30;

-- Ingresos al sistema para los usuarios 1 a 10 (3 ingresos cada uno)
INSERT INTO ingresos (id_usuario, fecha_hora)
SELECT u.id_usuario, NOW() - INTERVAL x.dias DAY
  FROM usuarios u
 CROSS JOIN (SELECT 1 AS dias UNION ALL SELECT 3 UNION ALL SELECT 7) AS x
 WHERE u.id_usuario <= 10;

-- Asignación de los 20 prospectos a los asesores 1, 2 y 3 (vía procedimiento)
CALL sp_asignar_prospecto(1, 2);
CALL sp_asignar_prospecto(2, 3);
CALL sp_asignar_prospecto(3, 1);
CALL sp_asignar_prospecto(4, 2);
CALL sp_asignar_prospecto(5, 3);
CALL sp_asignar_prospecto(6, 1);
CALL sp_asignar_prospecto(7, 2);
CALL sp_asignar_prospecto(8, 3);
CALL sp_asignar_prospecto(9, 1);
CALL sp_asignar_prospecto(10, 2);
CALL sp_asignar_prospecto(11, 3);
CALL sp_asignar_prospecto(12, 1);
CALL sp_asignar_prospecto(13, 2);
CALL sp_asignar_prospecto(14, 3);
CALL sp_asignar_prospecto(15, 1);
CALL sp_asignar_prospecto(16, 2);
CALL sp_asignar_prospecto(17, 3);
CALL sp_asignar_prospecto(18, 1);
CALL sp_asignar_prospecto(19, 2);
CALL sp_asignar_prospecto(20, 3);

-- Primer seguimiento de los prospectos 1 a 20 (el asesor es 1 + MOD(id, 3))
INSERT INTO seguimientos (id_cliente, id_asesor, fecha_seguimiento, medio, observaciones)
SELECT n, 1 + MOD(n, 3), NOW() - INTERVAL n DAY,
       ELT(1 + MOD(n, 2), 'LLAMADA', 'CORREO'),
       CONCAT('Primer contacto con el prospecto ', n)
  FROM (WITH RECURSIVE nums AS (
            SELECT 1 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 40)
        SELECT n FROM nums) AS t
 WHERE n <= 20;

-- Propuestas RFP para 6 prospectos (asesor según la misma regla)
CALL sp_crear_propuesta(1, 2, 4500000.00);
CALL sp_crear_propuesta(2, 3, 8200000.00);
CALL sp_crear_propuesta(3, 1, 12500000.00);
CALL sp_crear_propuesta(4, 2, 3600000.00);
CALL sp_crear_propuesta(5, 3, 9900000.00);
CALL sp_crear_propuesta(6, 1, 15000000.00);

-- Tres ventas cerradas (cada una acepta su propuesta y cierra el prospecto)
CALL sp_registrar_venta(1, 4500000.00, 'ILIMITADA', 'ANUAL');
CALL sp_registrar_venta(2, 8200000.00, 'PAGO_POR_USO', 'MENSUAL');
CALL sp_registrar_venta(3, 12500000.00, 'ILIMITADA', 'ANUAL');