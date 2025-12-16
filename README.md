# RESTful Crime Data Server

## Overview

This project is a RESTful web server created for **Assignment 3** of my Web Development class. It provides access to St. Paul crime data stored in a SQLite3 database via structured JSON APIs. The server is implemented using **Node.js** and **Express.js**, enabling clients to query, add, or remove crime incidents.

The server serves as the backend foundation for a frontend interface and demonstrates the creation of a RESTful API with database integration, query parameters, and error handling.

---

## Installation Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/iPrimitivei/webdev-rest
   cd webdev-rest
   ```

2. **Install dependencies**
   Ensure Node.js and npm are installed, then run:
   ```bash
   npm install
   ```

3. **Verify database setup**
   - Ensure `stpaul_crime.sqlite3` exists in the `db` directory.  
   - The database contains the following tables:  
     - `Codes`  
     - `Neighborhoods`  
     - `Incidents`  

4. **Start the server**
   ```bash
   npm start
   ```
   or  
   ```bash
   node rest_server.mjs
   ```

5. **Access the API**
   - By default, the server runs on `http://localhost:8000`

---

## Usage Instructions

All endpoints return JSON responses, except PUT/DELETE which return plain text success or error messages.

### GET Routes

#### `/codes`
Returns all crime codes and their incident types.  
- Optional query parameter: `?code=110,700`

#### `/neighborhoods`
Returns all neighborhood IDs and names.  
- Optional query parameter: `?id=11,14`

#### `/incidents`
Returns crime incidents ordered by date/time (most recent first). Supports optional query parameters:  
- `start_date` and `end_date` (YYYY-MM-DD)  
- `code` (comma-separated list)  
- `grid` (comma-separated list of police grids)  
- `neighborhood` (comma-separated list)  
- `limit` (max number of results, default 1000)

### PUT Route

#### `/new-incident`
Adds a new crime incident.  
- Required fields in JSON body: `case_number`, `date_time`, `code`, `incident`, `police_grid`, `neighborhood_number`, `block`  
- Returns status 500 if `case_number` already exists.

### DELETE Route

#### `/remove-incident`
Deletes an incident.  
- Required field in JSON body: `case_number`  
- Returns status 500 if `case_number` does not exist.

---

## Database Schema

### Codes
- `code` (INTEGER)  
- `incident_type` (TEXT)

### Neighborhoods
- `neighborhood_number` (INTEGER)  
- `neighborhood_name` (TEXT)

### Incidents
- `case_number` (TEXT)  
- `date_time` (DATETIME)  
- `code` (INTEGER)  
- `incident` (TEXT)  
- `police_grid` (INTEGER)  
- `neighborhood_number` (INTEGER)  
- `block` (TEXT)

---

## Technologies Used

- Node.js  
- Express.js  
- SQLite3  
- npm

---

## Repository

Project code is available at: [https://github.com/iPrimitivei/webdev-rest](https://github.com/iPrimitivei/webdev-rest)

