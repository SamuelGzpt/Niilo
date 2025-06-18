const express = require("express");
const sql = require("mssql");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.get('/publicaciones', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/publicaciones.html'));
});

// Configuración de conexión con Windows Authentication
const dbConfig = {
    server: 'localhost', // o 'localhost\\SQLEXPRESS' si usas instancia nombrada
    database: 'red_social',
    options: {
        trustedConnection: true, // Windows Authentication
        encrypt: false, // Para conexiones locales
        enableArithAbort: true
    }
};

// Pool de conexiones global
let poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ Conectado a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error de conexión a la base de datos:', err);
        process.exit(1);
    });

// Obtener publicaciones
app.get("/api/publicaciones", async (req, res) => {
    try {
        const pool = await poolPromise;
        const query = `
            SELECT TOP 20 p.id, p.contenido, u.nombre, u.apellido, p.fecha_publicacion
            FROM publicaciones p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.activa = 1 AND u.activo = 1
            ORDER BY p.fecha_publicacion DESC
        `;
        
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error al obtener publicaciones:", err);
        res.status(500).json({ error: "Error en la base de datos" });
    }
});

// Obtener comentarios de una publicación
app.get("/api/publicaciones/:publicacion_id/comentarios", async (req, res) => {
    try {
        const { publicacion_id } = req.params;
        const pool = await poolPromise;
        const query = `
            SELECT c.id, c.contenido, c.fecha_comentario, u.nombre, u.apellido
            FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.publicacion_id = @publicacion_id AND c.activo = 1
            ORDER BY c.fecha_comentario DESC
        `;
        
        const result = await pool.request()
            .input('publicacion_id', sql.Int, publicacion_id)
            .query(query);
            
        res.json(result.recordset);
    } catch (err) {
        console.error("Error al obtener comentarios:", err);
        res.status(500).json({ error: "Error en la base de datos al obtener comentarios" });
    }
});

// Obtener likes de una publicación
app.get("/api/publicaciones/:publicacion_id/likes", async (req, res) => {
    try {
        const { publicacion_id } = req.params;
        const pool = await poolPromise;
        const query = `
            SELECT u.id AS usuario_id, u.nombre, u.apellido
            FROM me_gusta mg
            JOIN usuarios u ON mg.usuario_id = u.id
            WHERE mg.publicacion_id = @publicacion_id
        `;
        
        const result = await pool.request()
            .input('publicacion_id', sql.Int, publicacion_id)
            .query(query);
            
        res.json({
            like_count: result.recordset.length,
            users_liked: result.recordset
        });
    } catch (err) {
        console.error("Error al obtener likes:", err);
        res.status(500).json({ error: "Error en la base de datos al obtener likes" });
    }
});

// Crear nueva publicación
app.post("/api/publicaciones", async (req, res) => {
    try {
        const { usuario_id, contenido } = req.body;
        
        if (!usuario_id || !contenido) {
            return res.status(400).json({ error: "Usuario ID y contenido son requeridos" });
        }
        
        const pool = await poolPromise;
        const query = `INSERT INTO publicaciones (usuario_id, contenido) VALUES (@usuario_id, @contenido)`;
        
        await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .input('contenido', sql.NVarChar(sql.MAX), contenido)
            .query(query);
            
        res.status(201).json({ message: "Publicación creada exitosamente" });
    } catch (err) {
        console.error("Error al insertar publicación:", err);
        res.status(500).json({ error: "Error al crear publicación" });
    }
});

// Ruta: Login
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son requeridos" });
        }
        
        const hash = crypto.createHash("sha256").update(password).digest("hex");
        const pool = await poolPromise;
        const query = `
            SELECT id, nombre, apellido, email
            FROM usuarios
            WHERE email = @email AND password_hash = @password_hash AND activo = 1
        `;
        
        const result = await pool.request()
            .input('email', sql.NVarChar(100), email)
            .input('password_hash', sql.NVarChar(255), hash)
            .query(query);
            
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("Error en login:", err);
        res.status(500).json({ error: "Error en la base de datos" });
    }
});

// Ruta: Registro
app.post("/api/registro", async (req, res) => {
    try {
        const { nombre, apellido, email, password } = req.body;
        
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({ error: "Todos los campos son requeridos" });
        }
        
        const hash = crypto.createHash("sha256").update(password).digest("hex");
        const pool = await poolPromise;
        
        // Verificar si el email ya existe
        const checkQuery = `SELECT COUNT(*) as count FROM usuarios WHERE email = @email`;
        const checkResult = await pool.request()
            .input('email', sql.NVarChar(100), email)
            .query(checkQuery);
            
        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }
        
        // Insertar nuevo usuario
        const insertQuery = `
            INSERT INTO usuarios (nombre, apellido, email, password_hash)
            VALUES (@nombre, @apellido, @email, @password_hash)
        `;
        
        await pool.request()
            .input('nombre', sql.NVarChar(50), nombre)
            .input('apellido', sql.NVarChar(50), apellido)
            .input('email', sql.NVarChar(100), email)
            .input('password_hash', sql.NVarChar(255), hash)
            .query(insertQuery);
            
        res.status(201).json({ message: "Usuario creado exitosamente" });
    } catch (err) {
        console.error("Error al registrar usuario:", err);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

// Ruta: Crear comentario
app.post("/api/comentarios", async (req, res) => {
    try {
        const { publicacion_id, usuario_id, contenido } = req.body;
        
        if (!publicacion_id || !usuario_id || !contenido) {
            return res.status(400).json({ error: "Todos los campos son requeridos" });
        }
        
        const pool = await poolPromise;
        const query = `
            INSERT INTO comentarios (publicacion_id, usuario_id, contenido)
            VALUES (@publicacion_id, @usuario_id, @contenido)
        `;
        
        await pool.request()
            .input('publicacion_id', sql.Int, publicacion_id)
            .input('usuario_id', sql.Int, usuario_id)
            .input('contenido', sql.NVarChar(sql.MAX), contenido)
            .query(query);
            
        res.status(201).json({ message: "Comentario guardado exitosamente" });
    } catch (err) {
        console.error("Error al guardar comentario:", err);
        res.status(500).json({ error: "Error al guardar comentario" });
    }
});

// Ruta: Like
app.post("/api/likes", async (req, res) => {
    try {
        const { usuario_id, publicacion_id } = req.body;
        
        if (!usuario_id || !publicacion_id) {
            return res.status(400).json({ error: "Usuario ID y Publicación ID son requeridos" });
        }
        
        const pool = await poolPromise;
        const query = `
            IF NOT EXISTS (
                SELECT 1 FROM me_gusta WHERE usuario_id = @usuario_id AND publicacion_id = @publicacion_id
            )
            INSERT INTO me_gusta (usuario_id, publicacion_id) VALUES (@usuario_id, @publicacion_id)
        `;
        
        await pool.request()
            .input('usuario_id', sql.Int, usuario_id)
            .input('publicacion_id', sql.Int, publicacion_id)
            .query(query);
            
        res.status(201).json({ message: "Like registrado exitosamente" });
    } catch (err) {
        console.error("Error al dar like:", err);
        res.status(500).json({ error: "Error al dar like" });
    }
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('🔄 Cerrando conexiones...');
    try {
        const pool = await poolPromise;
        await pool.close();
        console.log('✅ Conexiones cerradas');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al cerrar conexiones:', err);
        process.exit(1);
    }
});

const port = 3000;
app.listen(port, () => console.log(`✅ Servidor corriendo en http://localhost:${port}`));