const sql = require('msnodesqlv8');

const connectionString = "server=localhost\\SQLEXPRESS;Database=TuNombreDeBaseDeDatos;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

const query = (sqlQuery, callback) => {
  sql.query(connectionString, sqlQuery, (err, rows) => {
    if (err) return callback(err, null);
    callback(null, rows);
  });
};

module.exports = query;
