// test-connection.js
const sql = require("mssql");

// Configuración para SQLEXPRESS
const dbConfig = {
    server: 'WETTO\\SQLEXPRESS',
    database: 'red_social',
    options: {
        trustedConnection: true,
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true
    }
};

console.log("🔄 Probando conexión a SQL Server (SQLEXPRESS)...");

async function testConnection() {
    try {
        // Crear pool de conexiones
        const pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        
        console.log("✅ Conexión exitosa!");
        
        // Prueba básica
        const result = await pool.request().query('SELECT 1 as test');
        console.log("🔍 Test básico:", result.recordset[0]);
        
        // Verificar tablas
        const tablesQuery = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `;
        const tables = await pool.request().query(tablesQuery);
        console.log("📋 Tablas encontradas:", tables.recordset.map(t => t.TABLE_NAME));
        
        // Estadísticas de datos
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM usuarios) as total_usuarios,
                (SELECT COUNT(*) FROM publicaciones) as total_publicaciones,
                (SELECT COUNT(*) FROM comentarios) as total_comentarios,
                (SELECT COUNT(*) FROM me_gusta) as total_likes
        `;
        
        const stats = await pool.request().query(statsQuery);
        console.log("📊 Estadísticas de la base de datos:");
        console.log("   Usuarios:", stats.recordset[0].total_usuarios);
        console.log("   Publicaciones:", stats.recordset[0].total_publicaciones);
        console.log("   Comentarios:", stats.recordset[0].total_comentarios);
        console.log("   Likes:", stats.recordset[0].total_likes);
        
        if (stats.recordset[0].total_usuarios === 0) {
            console.log("\n⚠️  No hay datos de ejemplo. Ejecuta el script de base de datos.");
        }
        
        await pool.close();
        console.log("🔒 Conexión cerrada correctamente");
        
    } catch (err) {
        console.error("❌ Error de conexión:", err.message);
        console.log("\n🔧 Posibles soluciones:");
        console.log("1. Verifica que SQL Server (SQLEXPRESS) esté ejecutándose");
        console.log("2. Ejecuta 'services.msc' y inicia 'SQL Server (SQLEXPRESS)'");
        console.log("3. Habilita TCP/IP en SQL Server Configuration Manager");
        console.log("4. Reinicia el servicio SQL Server después de cambios");
        console.log("5. Verifica que la base de datos 'red_social' exista");
    }
}

testConnection();