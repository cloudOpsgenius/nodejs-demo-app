import { createRequire } from "module";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from "express";
import { MongoClient } from 'mongodb';
import os from 'os';
import { publicIpv4 } from 'public-ip';

// MongoDB URL (Docker container ya localhost ke liye)
const mongoUrl = 'mongodb://mongo-db:27017/';  // Docker ke liye
// const mongoUrl = 'mongodb://localhost:27017/'; // Localhost ke liye

const client = new MongoClient(mongoUrl);
const db = client.db('mydatabase');
const collection = db.collection('mycollection');

// MongoDB connection function
async function connectToMongoDB() {
    try {
      await client.connect();
      console.log('Connected to MongoDB server');
    } catch (error) {
      console.error('Error connecting to MongoDB Server:', error);
    }
}
connectToMongoDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); 	

// Static files serve from 'public' directory
app.use(express.static(__dirname + '/public'));

// Home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Insert data to MongoDB
app.post('/insertData', async (req, res) => {
    const data = req.body;

    try {
        const existingData = await collection.findOne({ email: data.email });

        if (existingData) {
            return res.send('Email already exists, user adding failed!');
        }

        await collection.insertOne(data);
        res.status(200).send('Added successfully!');
    } catch (error) {
        return res.status(500).send('Error adding data');
    }
});

// Fetch data from MongoDB
app.get('/fetchData', async (req, res) => {
    const data = await collection.find({}).limit(12).sort({ _id: -1 }).toArray();
    res.json(data);
});

// Find host and ip address
app.get('/hostinfo', async (req, res) => {
    const hostname = os.hostname();
    const networkInterfaces = os.networkInterfaces();
    let privateIp = '';

    // Find private IP
    for (const iface in networkInterfaces) {
        for (let i = 0; i < networkInterfaces[iface].length; i++) {
            if (networkInterfaces[iface][i].family === 'IPv4' && !networkInterfaces[iface][i].internal) {
                privateIp = networkInterfaces[iface][i].address;
                break;
            }
        }
        if (privateIp) break;
    }

    let publicIpAddress = await publicIpv4();

    const hostinfo = {
        hostname,
        privateIp,
        publicIpAddress
    };

    res.json(hostinfo);
});

// Server listening
app.listen(PORT, () => {
    console.log('Server is running on port', PORT);
});
