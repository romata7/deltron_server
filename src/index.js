const express = require('express')
const moment = require('moment')
const pool = require('./db_config.js')
const cors = require('cors')

const camerasRoutes = require('./cameras/cameras.js');
const productsRoutes = require('./deltron/products.js');

const app = express()

const port = 3000

app.use(cors())
app.use(express.json())
app.use("/api", camerasRoutes);
app.use('/api/deltron', productsRoutes);

app.get('/products', async (req, res) => {
    var rows = []
    try {
        [rows] = await pool.query("SELECT * FROM products WHERE ubicacion LIKE '%Cusco%' ORDER BY soles ASC")
    } catch (error) {
        console.error(error);
    }
    res.json(rows)
})
app.get('/filters_to_add', async (req, res) => {
    try {
        const { ubicacion, tipoDeUso } = req.query
        let sql = `SELECT * FROM products WHERE ubicacion LIKE '%${ubicacion}%' AND tipoDeUso LIKE '%${tipoDeUso}%' ORDER BY soles ASC`
        const [rows,] = await pool.query(sql)
        res.json(rows)
    } catch (error) {
        console.error(error)
    }
})
app.get('/getdata', async (req, res) => {
    try {
        const { global, ...query } = req.query;

        const cleanQuery = Object
            .fromEntries(
                Object
                    .entries(query)
                    .filter(([key, value]) => value !== 'Todos' && value !== 'todos')
            );
        let sqlQuery = `SELECT * FROM products ORDER BY soles ASC`

        if (Object.keys(cleanQuery).length !== 0) {
            sqlQuery = Object
                .entries(cleanQuery)
                .map(([key, value]) => `${key} LIKE '%${value}%'`)
                .join(' AND ');

            sqlQuery = `SELECT * FROM products WHERE ${sqlQuery} ORDER BY soles ASC`
        }

        const values = global
            .split(' ')
            .filter(palabra => palabra !== '');

        const keys = ['codigo', 'minicodigo', 'marca', 'descripcion', 'detalles']

        values.forEach((value, index) => {
            let condiciones = keys
                .map(key => `${key} LIKE '%${value}%'`)
                .join(' OR ')
            sqlQuery = `SELECT * FROM (${sqlQuery}) AS table_${index} WHERE ${condiciones} `
        })
        const [rows,] = await pool.query(sqlQuery)
        res.json(rows)
    } catch (error) {
        console.error(error)
        res.json([])
    }
})
app.get('/filters', async (req, res) => {
    try {
        const { global, ubicacion, tipoDeUso, ...query } = req.query;
        if (ubicacion !== 'Todos') {
            query.ubicacion = ubicacion
        }
        // Filtrar y limpiar las palabras globales
        const palabras = global.split(' ').filter(palabra => palabra !== '');

        // Construir la consulta base
        let sql = `SELECT * FROM products WHERE tipoDeUSO = '${tipoDeUso}'`

        // Construir condiciones de palabras globales
        const condicionesGlobales = palabras.map(palabra =>
            Object.keys(query).map(key => `${key} LIKE '%${palabra}%'`).join(' OR ')
        )

        // Agregar condiciones de palabras globales a la consulta
        condicionesGlobales.forEach((condiciones, index) => {
            sql = `SELECT * FROM (${sql}) AS table_${index} WHERE ${condiciones}`
        })

        sql = `SELECT * FROM (${sql}) AS table_${palabras.length}`

        // Filtrar valores vacíos en el objeto query
        const cleanedQuery = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== ''));

        // Construir la condición para los campos individuales
        const individualConditions = Object.keys(cleanedQuery).map(key => `${key} LIKE '%${cleanedQuery[key]}%'`).join(' AND ');

        sql = [sql, individualConditions].filter(element => element !== '').join(' WHERE ')
        sql = `${sql}  ORDER BY soles ASC`

        const [rows,] = await pool.query(sql);

        res.json(rows);
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.json([]);
    }
});

app.post('/insertar', async (req, res) => {
    const datos = req.body
    var insertados = 0;
    var modificados = 0;

    for (const dato of datos) {
        var aux = dato
        aux.updated = moment().format('YYYY-MM-DD HH:mm:ss')
        try {
            if (aux.codigo && aux.codigo !== "" && aux.ubicacion && aux.ubicacion !== '' && aux.tipoDeUso && aux.tipoDeUso !== '') {
                const [result,] = await pool.query(`SELECT COUNT(*) AS count FROM products WHERE codigo='${aux.codigo}' AND ubicacion = '${aux.ubicacion}' AND tipoDeUso = '${aux.tipoDeUso}'`)
                //si es 0 no existe el código && ubicacion
                if (result[0].count === 0) {
                    const keys = Object.keys(aux).join(', ')
                    const values = Object.values(aux)
                    const [rows] = await pool.query(`INSERT INTO products (${keys}) VALUES (?)`, [values])
                    if (rows.affectedRows === 1) {
                        insertados += 1
                    }
                } else if (result[0].count > 0) {
                    const { codigo, ubicacion, tipoDeUso, ...newAux } = aux
                    const [rows] = await pool.query(`UPDATE products SET ? WHERE codigo = '${codigo}' AND ubicacion = '${ubicacion}' AND tipoDeUso = '${tipoDeUso}'`, [newAux])
                    if (rows.affectedRows === 1) {
                        modificados += 1
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            res.json({ insertados, modificados })
        }
    }
    res.status(200).json({ insertados, modificados })
})

app.get('/limpiar/:ubicacion/:tipoDeUso', async (req, res) => {
    const { ubicacion, tipoDeUso } = req.params
    try {
        const [rows, fields] = await pool.query(`DELETE FROM products WHERE ubicacion = '${ubicacion}' AND tipoDeUso = '${tipoDeUso}' `)
        res.json({ eliminados: rows.affectedRows });
    } catch (error) {
        res.json({ eliminados: 0 })
    }
});

app.get('/percent', async (req, res) => {
    try {
        let [rows] = await pool.query('SELECT * FROM porcentaje');

        if (rows.length === 0) {
            await pool.query('INSERT INTO porcentaje (id, valor) VALUES(1, 1.10)');
            [rows] = await pool.query('SELECT * FROM porcentaje');
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.put('/percent', async (req, res) => {
    const { valor } = req.body;

    if (typeof valor !== 'number') {
        return res.status(400).json({ error: 'El valor debe ser un número' });
    }

    try {
        await pool.query('UPDATE porcentaje SET valor = ? WHERE id = 1', [valor]);
        res.json({ message: 'Porcentaje actualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.delete('/products', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('TRUNCATE TABLE products');
        res.json({ eliminados: rows.affectedRows })
    } catch (error) {
        res.json({ eliminados: 0 })
    }
})



app.listen(port, () => {
    console.log(`Server on port: ${port}`)
})