import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 4000;

// Serve static files
app.use(express.static(__dirname));

// Serve the example
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'example.html'));
});

app.listen(port, () => {
  console.log(`Frontend running at http://localhost:${port}`);
  console.log('Backend should be running at http://localhost:3001');
});
