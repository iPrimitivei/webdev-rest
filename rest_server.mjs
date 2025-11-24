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
    dbSelect(
        `SELECT code, incident_type AS type
        FROM Codes
        ORDER BY code ASC`,
        []
    )
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
    dbSelect(
        `SELECT neighborhood_number AS id, neighborhood_name AS name
        FROM Neighborhoods
        ORDER by id`,
        []
    )
    .then(rows => {
        res.status(200).json(rows);
    })
    .catch(err => {
        console.error("Error retrieving codes:", err);
        res.status(500).json({error: "Internal server error"});
    });
});

// GET request handler for crime incidents
//basic checked
app.get('/incidents', (req, res) => {
    console.log(req.query);  // query object (key-value pairs after the ? in the url)
    dbSelect(
    `SELECT case_number, 
    date(date_time) AS date, --"YYYY-MM-DD"
    time(date_time) AS time, --"HH:MM:SS"
    code, incident, police_grid, neighborhood_number, block
    FROM Incidents
    Order BY date_time DESC
    LIMIT 3`, //testing limit
    []
    )
    .then(rows => {
        res.status(200).json(rows);
    })
    .catch(err =>{
        console.error("Eror retrieving codes:", err);
        res.status(500).json({error: "Internal server error"});
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