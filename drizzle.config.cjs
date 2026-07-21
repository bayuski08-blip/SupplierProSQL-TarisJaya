/** @type { import("drizzle-kit").Config } */
module.exports = {
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "T34m1tb4l1",
    database: "supplierpro",
    ssl: false,
  },
};