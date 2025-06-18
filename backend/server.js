const express = require("express");
const sql = require("mssql/msnodesqlv8");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

const config = {
   server: "WETTO\\SQLEXPRESSo",
  database: "red_social",
  driver: "msnodesqlv8",
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
};

app.get("/api/publicaciones", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query("SELECT TOP 20 p.id, p.contenido, u.nombre, u.apellido, p.fecha_publicacion FROM publicaciones p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.fecha_publicacion DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener publicaciones");
  }
});

app.post("/api/publicaciones", async (req, res) => {
  const { usuario_id, contenido } = req.body;
  try {
    await sql.connect(config);
    await sql.query`INSERT INTO publicaciones (usuario_id, contenido) VALUES (${usuario_id}, ${contenido})`;
    res.status(201).send("Publicación creada");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al crear publicación");
  }
});

const port = 3000;
app.listen(port, () => console.log(`✅ Servidor funcionando en http://localhost:${port}`));
