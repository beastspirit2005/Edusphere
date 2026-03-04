const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/edusphere.db', (err) => {

    if (err) {

        console.error(err.message);

    } else {

        console.log("Database connected successfully");

    }

});

module.exports = db;