const express = require("express");
const sql = require("msnodesqlv8");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.get('/publicaciones', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/publicaciones.html'));
});

const connectionString = "server=localhost;Database=red_social;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0};";

// Obtener publicaciones
app.get("/api/publicaciones", (req, res) => {
  const query = `
    SELECT TOP 20 p.id, p.contenido, u.nombre, u.apellido, p.fecha_publicacion
    FROM publicaciones p
    JOIN usuarios u ON p.usuario_id = u.id
    ORDER BY p.fecha_publicacion DESC
  `;

  sql.query(connectionString, query, (err, rows) => {
    if (err) {
      console.error("Error al obtener publicaciones:", err);
      return res.status(500).send("Error en la base de datos");
    }
    res.json(rows);
  });
});

// Obtener comentarios de una publicación
app.get("/api/publicaciones/:publicacion_id/comentarios", (req, res) => {
  const { publicacion_id } = req.params;
  const query = `
    SELECT c.id, c.contenido, c.fecha_comentario, u.nombre, u.apellido
    FROM comentarios c
    JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.publicacion_id = ?
    ORDER BY c.fecha_comentario DESC
  `;

  sql.query(connectionString, query, [publicacion_id], (err, rows) => {
    if (err) {
      console.error("Error al obtener comentarios:", err);
      return res.status(500).send("Error en la base de datos al obtener comentarios");
    }
    res.json(rows);
  });
});

// Obtener likes de una publicación
app.get("/api/publicaciones/:publicacion_id/likes", (req, res) => {
  const { publicacion_id } = req.params;
  const query = `
    SELECT u.id AS usuario_id, u.nombre, u.apellido
    FROM me_gusta mg
    JOIN usuarios u ON mg.usuario_id = u.id
    WHERE mg.publicacion_id = ?
  `;

  sql.query(connectionString, query, [publicacion_id], (err, users_liked) => {
    if (err) {
      console.error("Error al obtener likes:", err);
      return res.status(500).send("Error en la base de datos al obtener likes");
    }
    res.json({
      like_count: users_liked.length,
      users_liked: users_liked
    });
  });
});

// Crear nueva publicación
app.post("/api/publicaciones", (req, res) => {
  const { usuario_id, contenido } = req.body;
  const insertQuery = `INSERT INTO publicaciones (usuario_id, contenido) VALUES (?, ?)`;

  sql.query(connectionString, insertQuery, [usuario_id, contenido], (err) => {
    if (err) {
      console.error("Error al insertar publicación:", err);
      return res.status(500).send("Error al crear publicación");
    }
    res.status(201).send("Publicación creada");
  });
});


// Ruta: Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  const query = `
    SELECT id, nombre, apellido, email
    FROM usuarios
    WHERE email = ? AND password_hash = ? AND activo = 1
  `;
  sql.query(connectionString, query, [email, hash], (err, rows) => {
    if (err) return res.status(500).send("Error en la base de datos");
    if (rows.length === 0) return res.status(401).send("Correo o contraseña incorrectos");
    res.json(rows[0]); // usuario autenticado
  });
});

// Ruta: Registro
app.post("/api/registro", async (req, res) => {
  const { nombre, apellido, email, password } = req.body;
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  const query = `
    INSERT INTO usuarios (nombre, apellido, email, password_hash)
    VALUES (?, ?, ?, ?)
  `;
  sql.query(connectionString, query, [nombre, apellido, email, hash], (err) => {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).send("El correo ya está registrado");
      }
      return res.status(500).send("Error al registrar usuario");
    }
    res.status(201).send("Usuario creado");
  });
});

// Ruta: Crear comentario
app.post("/api/comentarios", (req, res) => {
  const { publicacion_id, usuario_id, contenido } = req.body;
  const query = `
    INSERT INTO comentarios (publicacion_id, usuario_id, contenido)
    VALUES (?, ?, ?)
  `;
  sql.query(connectionString, query, [publicacion_id, usuario_id, contenido], (err) => {
    if (err) return res.status(500).send("Error al guardar comentario");
    res.status(201).send("Comentario guardado");
  });
});

// Ruta: Like
app.post("/api/likes", (req, res) => {
  const { usuario_id, publicacion_id } = req.body;
  const query = `
    IF NOT EXISTS (
      SELECT 1 FROM me_gusta WHERE usuario_id = ? AND publicacion_id = ?
    )
    INSERT INTO me_gusta (usuario_id, publicacion_id) VALUES (?, ?)
  `;
  sql.query(connectionString, query, [usuario_id, publicacion_id, usuario_id, publicacion_id], (err) => {
    if (err) return res.status(500).send("Error al dar like");
    res.status(201).send("Like registrado");
  });
});


const port = 3000;
app.listen(port, () => console.log(`✅ Servidor corriendo en http://localhost:${port}`));
