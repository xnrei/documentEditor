const mysql2 = require("mysql2");
var db = mysql2.createConnection({
    host: "localhost",
    user: "newuser",
    password: "password",
    port: 3306,
    database: "editordb"
});

module.exports = {
    db,
}