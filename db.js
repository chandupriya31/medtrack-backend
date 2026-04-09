const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  },
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, done) => {
      conn.query("SET TIME ZONE 'Asia/Kolkata';", (err) => {
        done(err, conn);
      });
    },
  },
});

db.raw("SELECT 1")
  .then(() => {
    console.log("✅ PostgreSQL connected via Knex");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });

if (process.env.NODE_ENV !== "production") {
  db.on("query", (queryData) => {
    console.log("SQL:", queryData.sql);
  });
}

module.exports = db;