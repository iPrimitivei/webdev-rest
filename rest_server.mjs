import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

const port = 8000;

let app = express();
app.use(express.json());

/********************************************************************
 ***   DATABASE FUNCTIONS                                         *** 
 ********************************************************************/
// Open SQLite3 database (in read-write mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

// Create Promise for SQLite3 database SELECT query 
function dbSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}

// Create Promise for SQLite3 database INSERT or DELETE query
function dbRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

/********************************************************************
 ***   REST REQUEST HANDLERS                                      *** 
 ********************************************************************/
// GET request handler for crime codes
app.get('/codes', (req, res) => {
    let query = `SELECT code, incident_type AS type FROM Codes`;
    
    let params = [];

    if (req.query.code) {
        const codes = req.query.code.split(',').map(c => c.trim()).filter(c => /^\d+$/.test(c));
        
        if (codes.length > 0) {
            const placeholders = codes.map(() => '?').join(',');
            query += ` WHERE code IN (${placeholders})`;
            params = codes;
        }
    }

    query += ` ORDER BY code ASC`;

    dbSelect(query, params)
    .then(rows => {
        res.status(200).json(rows);
    })
    .catch(err => {
        console.error("Error retrieving codes:", err);
        res.status(500).json({error: "Internal server error"});
    });
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    let query = `SELECT neighborhood_number AS id, neighborhood_name AS name FROM Neighborhoods`;

    let params = [];

    if (typeof req.query.id === 'string' && req.query.id.trim() !== '') {
        const ids = req.query.id.split(',').map(i => i.trim()).filter(i => /^\d+$/.test(i));

        if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            query += ` WHERE neighborhood_number IN (${placeholders})`;
            params = ids;
        }
    }

    query += ` ORDER BY id`;
    
    dbSelect(query, params)
    .then(rows => {
        res.status(200).json(rows);
    })
    .catch(err => {
        console.error("Error retrieving codes:", err);
        res.status(500).json({error: "Internal server error"});
    });
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    let query = `
        SELECT case_number,
               date(date_time) AS date,
               time(date_time) AS time,
               code,
               incident,
               police_grid,
               neighborhood_number,
               block
        FROM Incidents
        WHERE 1=1
    `;
    let params = [];
    
    //queries
    //start_date
    if (req.query.start_date) {
        query += ` AND date(date_time) >= ?`;
        params.push(req.query.start_date);
    }

    //end_date
    if (req.query.end_date) {
        query += ` AND date(date_time) <= ?`;
        params.push(req.query.end_date);
    }

    //code
    if (req.query.code) {
        const codes = req.query.code.split(',').map(c => c.trim()).filter(c => /^\d+$/.test(c));
        if (codes.length > 0) {
            const placeholders = codes.map(() => '?').join(',');
            query += ` AND code IN (${placeholders})`;
            params.push(...codes);
        }
    }

    //grid
    if (req.query.grid) {
        const grids = req.query.grid.split(',').map(g => g.trim()).filter(g => /^\d+$/.test(g));
        if (grids.length > 0) {
            const placeholders = grids.map(() => '?').join(',');
            query += ` AND police_grid IN (${placeholders})`;
            params.push(...grids);
        }
    }

    //neighborhood
    if (req.query.neighborhood) {
        const nbs = req.query.neighborhood.split(',').map(n => n.trim()).filter(n => /^\d+$/.test(n));
        if (nbs.length > 0) {
            const placeholders = nbs.map(() => '?').join(',');
            query += ` AND neighborhood_number IN (${placeholders})`;
            params.push(...nbs);
        }
    }

    //limit
    let limit = 1000;
    if (req.query.limit && /^\d+$/.test(req.query.limit)) {
        limit = parseInt(req.query.limit);
    }

    query += ` ORDER BY date_time DESC LIMIT ?`;
    params.push(limit);

    dbSelect(query, params)
        .then(rows => {
            res.status(200).json(rows);
        })
        .catch(err => {
            console.error("Error retrieving incidents:", err);
            res.status(500).json({ error: "Internal server error" });
        });
});

// PUT request handler for new crime incident
// curl -X PUT "http://localhost:8000/new-incident" -H "Content-Type: application/json" -d "{\"case_number\": \"1\", \"date_time\": \"2025-12-19T12:00:00\", \"code\": \"67\", \"incident\": \"Narcotics\", \"police_grid\": \"67\", \"neighborhood_number\": \"67\", \"block\": \"Lex X Vic\"}"

app.put('/new-incident', (req, res) => {
    console.log(req.body); // uploaded data
    let query = 'INSERT INTO incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)';
    dbRun(query, [req.body.case_number, req.body.date_time, req.body.code, req.body.incident, req.body.police_grid, req.body.neighborhood_number, req.body.block])
        .then(() => {
            res.status(200).type('txt').send('Successfully Added.');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).type('txt').send('Error, could not complete addition.');
        });
});

// DELETE request handler for new crime incident
// curl -X DELETE "http://localhost:8000/remove-incident" -H "Content-Type: application/json" -d "{\"case_number\": \"1223414\"}"

app.delete('/remove-incident', (req, res) => {
    console.log(req.body); // uploaded data
    let case_num = req.body.case_number;
    let existence_check = 'SELECT * FROM incidents WHERE case_number = ?'
    let query = 'DELETE FROM incidents WHERE case_number = ?';

    dbSelect(existence_check, [case_num])
        .then((rows) => {
            if (rows.length === 0) {
                res.status(500).type('txt').send('Error, could not complete deletion, case number does not exist.');
                return;
            }

            dbRun(query, [case_num])
                .then(() => {
                    res.status(200).type('txt').send('Successfully Deleted.');
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).type('txt').send('Error, could not complete deletion.');
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).type('txt').send('Error, could not complete deletion.');
        });
});

/********************************************************************
 ***   START SERVER                                               *** 
 ********************************************************************/
// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});