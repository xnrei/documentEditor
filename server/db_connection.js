const mysql2 = require("mysql2");
var db = mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: "katya2905",
    port: 3306,
    database: "editordb"
});

module.exports = {
    db,
}