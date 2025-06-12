-- Crear la base de datos
-- Nota: evitar ejecutar este bloque en entornos de producción
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'red_social')
BEGIN
    PRINT 'Advertencia: Esta operación eliminaría la base de datos red_social';
     --DROP DATABASE red_social; -- Descomentar solo en desarrollo
END
GO

CREATE DATABASE red_social;
GO

USE red_social;
GO

-- =============================================
-- 1. CREACIÓN DE TABLAS

-- Tabla Usuarios
CREATE TABLE usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50) NOT NULL,
    apellido NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    ubicacion NVARCHAR(100),
    fecha_registro DATETIME2 DEFAULT GETDATE(),
    activo BIT DEFAULT 1,
    imagen_perfil NVARCHAR(255),
    biografia NVARCHAR(MAX) -- NTEXT reemplazado por NVARCHAR(MAX)
);
GO

-- Tabla Publicaciones
CREATE TABLE publicaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    contenido NVARCHAR(MAX) NOT NULL, -- NTEXT reemplazado por NVARCHAR(MAX)
    fecha_publicacion DATETIME2 DEFAULT GETDATE(),
    tipo NVARCHAR(20) DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'video')),
    url_media NVARCHAR(255),
    activa BIT DEFAULT 1,
    CONSTRAINT FK_publicaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
GO

-- Tabla Comentarios
CREATE TABLE comentarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    contenido NVARCHAR(MAX) NOT NULL, -- NTEXT reemplazado por NVARCHAR(MAX)
    fecha_comentario DATETIME2 DEFAULT GETDATE(),
    activo BIT DEFAULT 1,
    CONSTRAINT FK_comentarios_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE,
    CONSTRAINT FK_comentarios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
GO

-- Tabla Me Gusta
CREATE TABLE me_gusta (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    publicacion_id INT NOT NULL,
    fecha_like DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_me_gusta_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT FK_me_gusta_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id),
    CONSTRAINT UK_me_gusta_unique UNIQUE (usuario_id, publicacion_id)
);
GO

-- Tabla Amistades
CREATE TABLE amistades (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario1_id INT NOT NULL,
    usuario2_id INT NOT NULL,
    estado NVARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    fecha_solicitud DATETIME2 DEFAULT GETDATE(),
    fecha_respuesta DATETIME2 NULL,
    CONSTRAINT FK_amistades_usuario1 FOREIGN KEY (usuario1_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT FK_amistades_usuario2 FOREIGN KEY (usuario2_id) REFERENCES usuarios(id),
    CONSTRAINT UK_amistades_unique UNIQUE (usuario1_id, usuario2_id),
    CONSTRAINT CK_amistades_diferentes CHECK (usuario1_id != usuario2_id)
);
GO

-- Tabla Mensajes
CREATE TABLE mensajes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    emisor_id INT NOT NULL,
    receptor_id INT NOT NULL,
    contenido NVARCHAR(MAX) NOT NULL, -- NTEXT reemplazado por NVARCHAR(MAX)
    fecha_envio DATETIME2 DEFAULT GETDATE(),
    leido BIT DEFAULT 0,
    CONSTRAINT FK_mensajes_emisor FOREIGN KEY (emisor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT FK_mensajes_receptor FOREIGN KEY (receptor_id) REFERENCES usuarios(id),
    CONSTRAINT CK_mensajes_diferentes CHECK (emisor_id != receptor_id)
);
GO

-- Tabla Notificaciones
CREATE TABLE notificaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo NVARCHAR(20) NOT NULL CHECK (tipo IN ('amistad', 'like', 'comentario', 'mensaje')),
    mensaje NVARCHAR(MAX) NOT NULL, -- NTEXT reemplazado por NVARCHAR(MAX)
    leida BIT DEFAULT 0,
    fecha_creacion DATETIME2 DEFAULT GETDATE(),
    referencia_id INT,
    CONSTRAINT FK_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
GO





-- 2. VISTAS

-- Vista 1: Perfil de usuario resumido
CREATE VIEW vista_perfil_usuario AS
SELECT 
    u.id,
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
    u.email,
    u.ubicacion,
    u.biografia,
    u.fecha_registro,
    COUNT(DISTINCT p.id) AS total_publicaciones,
    COUNT(DISTINCT a1.id) + COUNT(DISTINCT a2.id) AS total_amigos,
    COUNT(DISTINCT mg.id) AS total_likes_recibidos
FROM usuarios u
LEFT JOIN publicaciones p ON u.id = p.usuario_id AND p.activa = 1
LEFT JOIN amistades a1 ON u.id = a1.usuario1_id AND a1.estado = 'aceptada'
LEFT JOIN amistades a2 ON u.id = a2.usuario2_id AND a2.estado = 'aceptada'
LEFT JOIN me_gusta mg ON p.id = mg.publicacion_id
WHERE u.activo = 1
GROUP BY u.id, u.nombre, u.apellido, u.email, u.ubicacion, u.biografia, u.fecha_registro;
GO

-- Vista 2: Muro de noticias
CREATE VIEW vista_feed_noticias AS
SELECT 
    p.id AS publicacion_id,
    CONCAT(u.nombre, ' ', u.apellido) AS autor,
    u.imagen_perfil,
    p.contenido,
    p.tipo,
    p.url_media,
    p.fecha_publicacion,
    COUNT(DISTINCT mg.id) AS total_likes,
    COUNT(DISTINCT c.id) AS total_comentarios
FROM publicaciones p
JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN me_gusta mg ON p.id = mg.publicacion_id
LEFT JOIN comentarios c ON p.id = c.publicacion_id AND c.activo = 1
WHERE p.activa = 1 AND u.activo = 1
GROUP BY p.id, u.nombre, u.apellido, u.imagen_perfil, p.contenido, p.tipo, p.url_media, p.fecha_publicacion;
GO

-- Vista 3: Estadísticas generales
CREATE VIEW vista_estadisticas_red AS
SELECT 'Usuarios Totales' AS metrica, COUNT(*) AS valor FROM usuarios WHERE activo = 1
UNION ALL
SELECT 'Usuarios Activos (últimos 30 días)', COUNT(DISTINCT usuario_id) FROM publicaciones WHERE fecha_publicacion >= DATEADD(DAY, -30, GETDATE())
UNION ALL
SELECT 'Publicaciones Totales', COUNT(*) FROM publicaciones WHERE activa = 1
UNION ALL
SELECT 'Comentarios Totales', COUNT(*) FROM comentarios WHERE activo = 1
UNION ALL
SELECT 'Me Gusta Totales', COUNT(*) FROM me_gusta
UNION ALL
SELECT 'Amistades Activas', COUNT(*) FROM amistades WHERE estado = 'aceptada'
UNION ALL
SELECT 'Mensajes Enviados', COUNT(*) FROM mensajes;
GO

-- =============================================
-- 3. PROCEDIMIENTOS ALMACENADOS

-- Procedimiento: comentarios por publicación
CREATE PROCEDURE sp_comentarios_publicacion(
    @publicacion_id INT
)
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM publicaciones WHERE id = @publicacion_id AND activa = 1)
    BEGIN
        RAISERROR('La publicación no existe o está inactiva.', 16, 1);
        RETURN;
    END

    SELECT 
        c.id AS comentario_id,
        c.contenido,
        c.fecha_comentario,
        u.id AS usuario_id,
        u.nombre,
        u.apellido,
        CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
        u.imagen_perfil
    FROM comentarios c
    JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.publicacion_id = @publicacion_id
      AND c.activo = 1
    ORDER BY c.fecha_comentario ASC;
END
GO
-- 3. PROCEDIMIENTOS ALMACENADOS (continuación)

-- Procedimiento: insertar nuevo usuario
CREATE PROCEDURE sp_insertar_usuario(
    @p_nombre NVARCHAR(50),
    @p_apellido NVARCHAR(50),
    @p_email NVARCHAR(100),
    @p_password NVARCHAR(255),
    @p_fecha_nacimiento DATE,
    @p_ubicacion NVARCHAR(100),
    @p_biografia NVARCHAR(MAX)
)
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM usuarios WHERE email = @p_email)
        BEGIN
            RAISERROR('El email ya está registrado.', 16, 1);
            RETURN;
        END

        INSERT INTO usuarios (nombre, apellido, email, password_hash, fecha_nacimiento, ubicacion, biografia)
        VALUES (@p_nombre, @p_apellido, @p_email, @p_password, @p_fecha_nacimiento, @p_ubicacion, @p_biografia);

        DECLARE @nuevo_usuario_id INT = SCOPE_IDENTITY();

        INSERT INTO notificaciones (usuario_id, tipo, mensaje)
        VALUES (@nuevo_usuario_id, 'mensaje', '¡Bienvenido a nuestra red social!');

        COMMIT TRANSACTION;
        SELECT @nuevo_usuario_id AS usuario_id, 'Usuario creado exitosamente' AS mensaje;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Procedimiento: eliminar publicación (soft delete)
CREATE PROCEDURE sp_eliminar_publicacion(
    @p_publicacion_id INT,
    @p_usuario_id INT
)
AS
BEGIN
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @v_owner_id INT;
        SELECT @v_owner_id = usuario_id FROM publicaciones WHERE id = @p_publicacion_id AND activa = 1;

        IF @v_owner_id IS NULL
        BEGIN
            RAISERROR('Publicación no encontrada.', 16, 1);
            RETURN;
        END

        IF @v_owner_id != @p_usuario_id
        BEGIN
            RAISERROR('No tienes permisos para eliminar esta publicación.', 16, 1);
            RETURN;
        END

        UPDATE publicaciones SET activa = 0 WHERE id = @p_publicacion_id;
        UPDATE comentarios SET activo = 0 WHERE publicacion_id = @p_publicacion_id;

        COMMIT TRANSACTION;
        SELECT 'Publicación eliminada exitosamente' AS mensaje;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- 4. TRIGGERS

-- Trigger: notificación por like
CREATE TRIGGER tr_notificar_like
ON me_gusta
AFTER INSERT
AS
BEGIN
    DECLARE @v_autor INT, @v_usuario INT, @v_publicacion INT, @v_nombre NVARCHAR(101);
    SELECT @v_usuario = usuario_id, @v_publicacion = publicacion_id FROM inserted;

    SELECT @v_autor = usuario_id FROM publicaciones WHERE id = @v_publicacion;
    SELECT @v_nombre = CONCAT(nombre, ' ', apellido) FROM usuarios WHERE id = @v_usuario;

    IF @v_autor != @v_usuario
    BEGIN
        INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id)
        VALUES (@v_autor, 'like', CONCAT(@v_nombre, ' le gustó tu publicación'), @v_publicacion);
    END
END
GO

-- Trigger: notificación por comentario
CREATE TRIGGER tr_notificar_comentario
ON comentarios
AFTER INSERT
AS
BEGIN
    DECLARE @v_autor INT, @v_usuario INT, @v_publicacion INT, @v_nombre NVARCHAR(101);
    SELECT @v_usuario = usuario_id, @v_publicacion = publicacion_id FROM inserted;

    SELECT @v_autor = usuario_id FROM publicaciones WHERE id = @v_publicacion;
    SELECT @v_nombre = CONCAT(nombre, ' ', apellido) FROM usuarios WHERE id = @v_usuario;

    IF @v_autor != @v_usuario
    BEGIN
        INSERT INTO notificaciones (usuario_id, tipo, mensaje, referencia_id)
        VALUES (@v_autor, 'comentario', CONCAT(@v_nombre, ' comentó tu publicación'), @v_publicacion);
    END
END
GO

-- (Contenido anterior incluido)
-- =============================================
-- 6. DATOS DE EJEMPLO

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre, apellido, email, password_hash, fecha_nacimiento, ubicacion, imagen_perfil, biografia) VALUES
('Juan', 'Pérez', 'juan.perez@email.com', 'hash1', '1990-05-15', 'Madrid', 'url_juan', 'Desarrollador'),
('María', 'García', 'maria.garcia@email.com', 'hash2', '1992-08-22', 'Barcelona', 'url_maria', 'Diseñadora'),
('Carlos', 'López', 'carlos.lopez@email.com', 'hash3', '1988-12-10', 'Valencia', 'url_carlos', 'Emprendedor');
GO

-- Insertar publicaciones
INSERT INTO publicaciones (usuario_id, contenido, tipo, url_media) VALUES
(1, 'Mi primera publicación', 'texto', NULL),
(2, 'Diseño en progreso', 'imagen', 'img_url'),
(3, 'Buenos días!', 'texto', NULL);
GO

-- Insertar comentarios
INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES
(1, 2, '¡Qué bien!'),
(2, 1, 'Muy bonito!');
GO

-- Insertar me gusta
INSERT INTO me_gusta (usuario_id, publicacion_id) VALUES
(2, 1), (3, 1), (1, 2);
GO

-- Insertar amistades
INSERT INTO amistades (usuario1_id, usuario2_id, estado, fecha_respuesta) VALUES
(1, 2, 'aceptada', GETDATE()),
(2, 3, 'aceptada', GETDATE());
GO

-- Insertar mensajes
INSERT INTO mensajes (emisor_id, receptor_id, contenido) VALUES
(1, 2, 'Hola María!'),
(2, 1, 'Hola Juan!');
GO

-- =============================================
-- 7. CONSULTAS SOLICITADAS

-- 1. Obtener información de un usuario específico
SELECT * FROM usuarios WHERE id = 1;

-- 2. Listar amigos de un usuario
SELECT u.*
FROM usuarios u
JOIN amistades a ON (u.id = a.usuario1_id OR u.id = a.usuario2_id)
WHERE (a.usuario1_id = 1 OR a.usuario2_id = 1) AND a.estado = 'aceptada' AND u.id != 1;

-- 3. Buscar usuarios por nombre o apellido
SELECT * FROM usuarios WHERE nombre LIKE '%Ma%' OR apellido LIKE '%Ma%';

-- 4. Publicaciones más recientes
SELECT TOP 5 * FROM publicaciones WHERE activa = 1 ORDER BY fecha_publicacion DESC;

-- 5. Contar likes de una publicación
SELECT publicacion_id, COUNT(*) AS total_likes FROM me_gusta WHERE publicacion_id = 1 GROUP BY publicacion_id;

-- 6. Listar comentarios de una publicación
SELECT * FROM comentarios WHERE publicacion_id = 1 AND activo = 1;

-- 7. Usuarios mayores de 30 años
SELECT * FROM usuarios WHERE DATEDIFF(YEAR, fecha_nacimiento, GETDATE()) > 30;

-- 8. Usuarios de Barcelona
SELECT * FROM usuarios WHERE ubicacion = 'Barcelona';

-- 9. Publicaciones por día
SELECT CAST(fecha_publicacion AS DATE) AS dia, COUNT(*) AS total FROM publicaciones GROUP BY CAST(fecha_publicacion AS DATE);

-- 10. Estadísticas de usuarios activos
SELECT COUNT(*) AS total_activos FROM usuarios WHERE activo = 1;
GO

-- =============================================
-- Consideraciones finales:
-- - Contraseñas deben almacenarse con hash seguro (ej. bcrypt).
-- - Índices ya incluidos mejoran rendimiento.
-- - Estructura está normalizada hasta 3FN.
-- - Sistema escalable con claves foráneas y control de estados.
GO
