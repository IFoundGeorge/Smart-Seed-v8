const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Historical Yield Database
const yieldDbPath = path.join(__dirname, '..', 'database', 'historical_yield.db');
const yieldDb = new sqlite3.Database(yieldDbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Error connecting to historical_yield.db:", err.message);
  } else {
    console.log("Connected to historical_yield.db.");
  }
});

// Farmers Database
const farmersDbPath = path.join(__dirname, '..', 'database', 'farmers.db');
const farmersDb = new sqlite3.Database(farmersDbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Error connecting to farmers.db:", err.message);
  } else {
    console.log("Connected to farmers.db.");
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Historical Yield API Endpoint (Read)
app.get('/api/data', (req, res) => {
    const query = "SELECT Date, Yield_kg_per_hectare FROM historical_yield ORDER BY Date DESC";
    yieldDb.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Farmers API Endpoint (Read)
// Use correct column names as defined in the table schema.
// Farmers API Endpoint (Read)
// Farmers API Endpoint (Read)
app.get('/api/farmers', (req, res) => {
    const query = "SELECT rowid as id, Name, Location, Crop_Type, Phone_Number, Farm_Size, Average_Yield, deactivated FROM farmers";
    farmersDb.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

/**
 * Add a new farmer to the database.
 * Expected JSON body:
 * {
 *   "name": "John Doe",
 *   "location": "Some Location",
 *   "crop": "Wheat",
 *   "phone_number": "123456789",
 *   "farm_size": "10.5",
 *   "average_yield": "2.5"
 * }
 */
app.post('/api/farmers', (req, res) => {
    const { name, location, crop, phone_number, farm_size, average_yield } = req.body;

    if (!name || !location || !crop || !phone_number || farm_size === undefined || average_yield === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `INSERT INTO farmers (Name, Location, Crop_Type, Phone_Number, Farm_Size, Average_Yield)
               VALUES (?, ?, ?, ?, ?, ?)`;

    farmersDb.run(query, [name, location, crop, phone_number, farm_size, average_yield], function(err) {
        if (err) {
            console.error('Error running query:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: "Farmer added successfully" });
    });
});

/**
 * Update an existing farmer's record.
 * Expected URL parameter: farmer id
 * Expected JSON body: fields to update (e.g., name, location, crop, phone_number, farm_size, average_yield)
 */
app.put('/api/farmers/:id', (req, res) => {
    const { id } = req.params;
    const {
        name, location, crop, phone_number, farm_size, average_yield, deactivated
    } = req.body;

    const fields = [];
    const values = [];

    if (name) {
        fields.push(`"Name" = ?`);
        values.push(name);
    }
    if (location) {
        fields.push(`"Location" = ?`);
        values.push(location);
    }
    if (crop) {
        fields.push(`"Crop_Type" = ?`);
        values.push(crop);
    }
    if (phone_number) {
        fields.push(`"Phone_Number" = ?`);
        values.push(phone_number);
    }
    if (farm_size !== undefined) {
        fields.push(`"Farm_Size" = ?`);
        values.push(farm_size);
    }
    if (average_yield !== undefined) {
        fields.push(`"Average_Yield" = ?`);
        values.push(average_yield);
    }
    // Handle deactivated field explicitly
    if (typeof deactivated !== "undefined") {
        fields.push(`"deactivated" = ?`);
        values.push(deactivated ? 1 : 0); // Store as 1 for true, 0 for false
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id); // Append the ID for the WHERE clause

    const query = `UPDATE farmers SET ${fields.join(', ')} WHERE rowid = ?`;
    farmersDb.run(query, values, function (err) {
        if (err) {
            console.error('Error running update query:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Farmer not found" });
        }
        res.json({ message: "Farmer updated successfully", deactivated: !!deactivated });
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
