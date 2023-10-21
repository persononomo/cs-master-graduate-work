// server.ts

import express from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 8000;

// Setup PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

// Multer setup for image uploads
const storage = multer.memoryStorage(); // store the file in memory
const upload = multer({ storage: storage });

app.use(express.json());

// Endpoint to health check
app.get('/health', (req, res) => {
    return res.status(200).send("OK");
});
// Endpoint to upload image
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }

    const imageBuffer = req.file.buffer;
    const originalFilename = req.file.originalname;

    try {
        // Generate unique image ID (here, we'll use a simple timestamp for demo purposes)
        const imageId = Date.now().toString();

        // Save original and compressed image to filesystem
        const originalPath = path.join(__dirname, 'images', `${imageId}_original.jpg`);
        const compressedPath = path.join(__dirname, 'images', `${imageId}_compressed.jpg`);
        fs.writeFileSync(originalPath, imageBuffer);
        await sharp(imageBuffer).jpeg({ quality: 50 }).toFile(compressedPath);

        // Save info to PostgreSQL
        const userInfo = req.body.userInfo; // Assume user info is sent in request body
        await pool.query(
            'INSERT INTO images(image_id, user_info, filename, timestamp) VALUES($1, $2, $3, $4)',
            [imageId, userInfo, originalFilename, new Date()]
        );

        return res.status(200).json({ imageId });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error processing image");
    }
});

// Endpoint to get compressed image by ID
app.get('/image/:id', async (req, res) => {
    const imageId = req.params.id;
    const compressedPath = path.join(__dirname, 'images', `${imageId}_compressed.jpg`);

    if (!fs.existsSync(compressedPath)) {
        return res.status(404).send("Image not found");
    }

    return res.sendFile(compressedPath);
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
