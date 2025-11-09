const express = require('express');
const pool = require('../db_config.js');
const router = express.Router();

router.get('/products', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('SELECT * FROM products ORDER BY soles ASC');
        res.status(200).json({ products: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ products: [] });
    }
});

module.exports = router;