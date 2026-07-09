import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques depuis dist/
app.use(express.static(join(__dirname, 'frontend', 'dist'), {
  // Les fichiers statiques (sitemap, robots.txt) sont servis en premier
  // sans fallback vers index.html
}));

// Servir les fichiers spécifiques sans fallback SPA
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(join(__dirname, 'frontend', 'dist', 'sitemap.xml'), {
    type: 'application/xml; charset=utf-8'
  });
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(join(__dirname, 'frontend', 'dist', 'robots.txt'), {
    type: 'text/plain; charset=utf-8'
  });
});

// Fallback SPA pour toutes les autres routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SubSaver Frontend server running on http://localhost:${PORT}`);
});
