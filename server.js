const express = require('express');
const cors = require('cors');  // Import CORS
const formidable = require('formidable');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Telegram Bot Token
const BOT_TOKEN = '6748460867:AAFzQkFcCfg1kqISiV4499pGxIcPtu4qe1w';

// Function to send file to Telegram
async function sendFileToTelegram(telegramId, filePath) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
    
    const formData = new FormData();
    formData.append('chat_id', telegramId);
    formData.append('document', fs.createReadStream(filePath));

    try {
        const response = await axios.post(url, formData, {
            headers: formData.getHeaders(),
        });
        return response.data;
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

// Route for file upload and sending to Telegram
app.post('/send-to-telegram', (req, res) => {
    const form = new formidable.IncomingForm({ uploadDir: './uploads', keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ message: 'File upload failed.' });
        }

        const telegramId = fields.telegramID;
        const file = files.file;
        const filePath = path.join(__dirname, file.path);

        // Send file to Telegram
        const response = await sendFileToTelegram(telegramId, filePath);

        // Remove uploaded file after sending
        fs.unlinkSync(filePath);

        if (response.ok) {
            res.json({ message: 'File sent successfully to your Telegram!' });
        } else {
            res.status(500).json({ message: `Failed to send file. Error: ${response.error}` });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});