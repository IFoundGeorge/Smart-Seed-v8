const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Database Paths
const yieldDbPath = path.join(__dirname, '..', 'database', 'historical_yield.db');
const farmersDbPath = path.join(__dirname, '..', 'database', 'farmers.db');

// Historical Yield Database
const yieldDb = new sqlite3.Database(yieldDbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("❌ Error connecting to historical_yield.db:", err.message);
    } else {
        console.log("✅ Connected to historical_yield.db.");
    }
});

// Farmers Database
const farmersDb = new sqlite3.Database(farmersDbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("❌ Error connecting to farmers.db:", err.message);
    } else {
        console.log("✅ Connected to farmers.db.");
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Fetch historical yield data
app.get('/api/data', (req, res) => {
    const query = "SELECT Date, Yield_kg_per_hectare FROM historical_yield ORDER BY Date DESC";
    yieldDb.all(query, [], (err, rows) => {
        if (err) {
            console.error("❌ Error fetching data:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Fetch crop distribution
app.get("/api/crop_distribution", (req, res) => {
    farmersDb.all(
        "SELECT Crop_Type AS crop_type, COUNT(*) AS count FROM farmers GROUP BY Crop_Type",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Fetch all farmers
function getFarmersFromDB() {
    return new Promise((resolve, reject) => {
        farmersDb.all("SELECT * FROM farmers WHERE deactivated = 0", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

app.get("/api/farmers", async (req, res) => {
    try {
        console.log("🔍 Fetching farmers from database...");
        const farmers = await getFarmersFromDB();
        console.log("✅ Farmers fetched:", farmers);

        if (!farmers.length) {
            console.warn("⚠️ No farmers found in the database!");
        }

        res.json(farmers);
    } catch (error) {
        console.error("❌ API Error:", error.message, error.stack);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Add a new farmer and update historical yield
app.post('/api/farmers', (req, res) => {
    const { name, location, crop, phone_number, farm_size, average_yield } = req.body;
    console.log("📥 Received data:", req.body); // Log input data

    const insertFarmer = `INSERT INTO farmers (Name, Location, Crop_Type, Phone_Number, Farm_Size, Average_Yield) VALUES (?, ?, ?, ?, ?, ?)`;

    farmersDb.run(insertFarmer, [name, location, crop, phone_number, farm_size, average_yield], function (err) {
        if (err) {
            console.error("❌ Error adding farmer:", err.message);
            return res.status(500).json({ error: err.message });
        }

        console.log("✅ Farmer inserted, ID:", this.lastID);

        farmersDb.get("SELECT SUM(Average_Yield) AS totalYield, SUM(Farm_Size) AS totalSize FROM farmers", (err, totals) => {
            if (err) {
                console.error("❌ Error calculating total yield:", err.message);
                return res.status(500).json({ error: err.message });
            }

            console.log("📊 Total Yield:", totals.totalYield, " | Total Size:", totals.totalSize);

            let yieldPerHectare = totals.totalSize ? (totals.totalYield / totals.totalSize) : 0;
            let currentDate = new Date().toISOString().split("T")[0];

            console.log("📆 Updating yield for date:", currentDate, " | Yield per hectare:", yieldPerHectare);

            const insertYield = `INSERT INTO historical_yield (Date, Yield_kg_per_hectare) VALUES (?, ?) 
                                 ON CONFLICT(Date) DO UPDATE SET Yield_kg_per_hectare = ?`;

            yieldDb.run(insertYield, [currentDate, yieldPerHectare, yieldPerHectare], function (err) {
                if (err) {
                    console.error("❌ Error updating historical yield:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                console.log("✅ Yield updated successfully");
                res.json({ message: "Farmer added and historical yield updated!" });
            });
        });
    });
});

// Update an existing farmer
app.put('/api/farmers/:id', (req, res) => {
    const { id } = req.params;
    const { name, location, crop, phone_number, farm_size, average_yield, deactivated } = req.body;
    const fields = [];
    const values = [];

    if (name) fields.push(`"Name" = ?`), values.push(name);
    if (location) fields.push(`"Location" = ?`), values.push(location);
    if (crop) fields.push(`"Crop_Type" = ?`), values.push(crop);
    if (phone_number) fields.push(`"Phone_Number" = ?`), values.push(phone_number);
    if (farm_size !== undefined) fields.push(`"Farm_Size" = ?`), values.push(farm_size);
    if (average_yield !== undefined) fields.push(`"Average_Yield" = ?`), values.push(average_yield);
    if (typeof deactivated !== "undefined") fields.push(`"deactivated" = ?`), values.push(deactivated ? 1 : 0);

    if (fields.length === 0) return res.status(400).json({ error: "⚠️ No fields to update" });
    values.push(id);

    const query = `UPDATE farmers SET ${fields.join(', ')} WHERE rowid = ?`;
    farmersDb.run(query, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "⚠️ Farmer not found" });
        res.json({ message: "✅ Farmer updated successfully", deactivated: !!deactivated });
    });
});

// Soft delete a farmer
app.delete('/api/farmers/:id', (req, res) => {
    farmersDb.run("UPDATE farmers SET deactivated = 1 WHERE rowid = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "⚠️ Farmer not found" });
        res.json({ message: "✅ Farmer deactivated successfully" });
    });
});

// Start the server
app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
