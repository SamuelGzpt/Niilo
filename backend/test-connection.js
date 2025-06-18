// test-connection.js
// Guarda este archivo como test-connection.js en tu carpeta backend

const sql = require("msnodesqlv8");

const connectionString = "server=localhost;Database=red_social;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0};";

console.log("🔄 Probando conexión a la base de datos...");

// Prueba básica de conexión
sql.query(connectionString, "SELECT 1 as test", (err, rows) => {
    if (err) {
        console.error("❌ Error de conexión:", err.message);
        console.log("\n🔧 Posibles soluciones:");
        console.log("1. Verifica que SQL Server esté ejecutándose");
        console.log("2. Confirma el nombre de la instancia (puede ser localhost\\SQLEXPRESS)");
        console.log("3. Instala SQL Server Native Client 11.0");
        console.log("4. Habilita TCP/IP en SQL Server Configuration Manager");
        return;
    }
    
    console.log("✅ Conexión exitosa!");
    
    // Prueba de consulta real
    const testQuery = `
        SELECT 
            (SELECT COUNT(*) FROM usuarios) as total_usuarios,
            (SELECT COUNT(*) FROM publicaciones) as total_publicaciones,
            (SELECT COUNT(*) FROM comentarios) as total_comentarios
    `;
    
    sql.query(connectionString, testQuery, (err, results) => {
        if (err) {
            console.error("❌ Error al consultar datos:", err.message);
            return;
        }
        
        console.log("📊 Estadísticas de la base de datos:");
        console.log("   Usuarios:", results[0].total_usuarios);
        console.log("   Publicaciones:", results[0].total_publicaciones);
        console.log("   Comentarios:", results[0].total_comentarios);
        
        if (results[0].total_usuarios === 0) {
            console.log("\n⚠️  No hay datos de ejemplo. Ejecuta el script basedatos.sql completo.");
        }
    });
});

// Información del sistema
console.log("📝 Información de conexión:");
console.log("   String:", connectionString);
console.log("   Driver requerido: SQL Server Native Client 11.0");