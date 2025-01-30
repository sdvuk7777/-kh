const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS

const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Pre-defined URLs
const urls = [
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=26&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=28&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=34&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=3501&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=3511&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=350&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=351&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=365&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=364&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=363&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=362&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=361&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-10th/?topic_id=37&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-9th/?topic_id=32&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-9th/?topic_id=31&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-9th/?topic_id=27&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-9th/?topic_id=38&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-9th/?topic_id=39&type=live-class",
  "https://alphanetwork.fun/next-topper/abhay-9th/?topic_id=40&type=live-class"
];

// Helper function to fetch and save HTML
async function fetchAndSaveHTML(url, filename) {
  try {
    const { data: html } = await axios.get(url);
    fs.writeFileSync(path.join(DATA_DIR, `${filename}.html`), html, 'utf-8');
    console.log(`Saved: ${filename}.html`);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
  }
}

// Function to download all pages
async function downloadAllPages() {
  console.log('Downloading pages...');
  for (const url of urls) {
    const topicId = new URL(url).searchParams.get('topic_id');
    const batch = url.includes('abhay-10th') ? 'abhay-10th' : 'abhay-9th';
    const filename = `${batch}${topicId}`;
    await fetchAndSaveHTML(url, filename);
  }
  console.log('All pages downloaded.');
}

// Extract data from HTML
function extractDataFromHTML(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  const result = [];

  $('.video-card').each((_, element) => {
    const lessonUrl = $(element).attr('data-lesson-url');
    const videoTitle = $(element).find('img').attr('alt');
    if (lessonUrl && videoTitle) {
      result.push({ title: videoTitle, url: lessonUrl });
    }
  });

  return result;
}

// Schedule task to delete old files and download new ones at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Deleting old files and downloading new ones...');
  
  // Delete old files
  fs.readdirSync(DATA_DIR).forEach(file => {
    fs.unlinkSync(path.join(DATA_DIR, file));
  });

  // Download new files
  await downloadAllPages();
});

// List all downloaded files
app.get('/home', (req, res) => {
  const files = fs.readdirSync(DATA_DIR).map(file => file.replace('.html', ''));
  res.json({ files });
});

// Serve data from a specific HTML file
app.get('/page-data/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DATA_DIR, `${filename}.html`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const data = extractDataFromHTML(filePath);
  res.json({ data });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
  // Initial download on server start
  downloadAllPages();
});