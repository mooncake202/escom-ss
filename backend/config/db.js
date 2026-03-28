const mysql = require("mysql2/promise")

const db = mysql.createPool({
host: "localhost",
user: "root",
password: "1234",
database: "escom_ss",
port: 3307,
charset: "utf8mb4",
waitForConnections:true,
connectionLimit:10
})

module.exports = db