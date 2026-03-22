const mysql = require("mysql2");

console.log("🔄 Trying DB connection...");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.MYSQLPORT
});
/*
const db = mysql.createConnection(process.env.MYSQL_PUBLIC_URL);
*/
db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("MySQL Connected");
  }
});

module.exports = db;
