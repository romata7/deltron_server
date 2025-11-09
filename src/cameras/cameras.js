const express = require('express');
const pool = require('../db_config.js');
const router = express.Router();

router.post("/cameras", async (req, res) => {
    const data = req.body;
    try {
        const keys = Object.keys(data).join(', ');
        const values = Object.values(data)

        const [rows, fields] = await pool.query(`INSERT INTO cameras (${keys}) VALUES(?)`, [values]);
        res.json(rows.insertId);
    } catch (error) {
        console.error(error.sqlMessage);
        res.json(null);
    }
});
router.get("/cameras", async (req, res) => {
    console.log("hi")
    try {
        const [rows, fields] = await pool.query('SELECT * FROM cameras');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.json(null);
    }
})
module.exports = router;