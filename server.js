import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join, sep } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Render exécute cette app Node telle quelle (pas de CDN/proxy qui
// compresserait à notre place) : sans ce middleware, tout était servi non
// compressé -- gzip/brotli réduit le JS/CSS transféré d'environ 3x.
app.use(compression());

// Render sert cette app sur plusieurs hôtes en parallèle : le domaine
// personnalisé (subsaver.fr) mais aussi l'URL *.onrender.com par défaut,
// qui reste active même une fois le domaine perso branché. Un visiteur (ou
// un lien indexé par Google) qui tombe sur l'URL onrender.com voit le même
// site, mais avec un localStorage (JWT) et des redirections externes
// (Powens, Stripe) qui ne sont configurées que pour subsaver.fr -- source
// de bugs "je suis déconnecté"/"je retombe au mauvais endroit". On force
// donc systématiquement le domaine canonique en production (le check est
// sauté hors production pour ne pas casser `npm start` en local).
const CANONICAL_HOST = 'subsaver.fr';
const ALLOWED_HOSTS = new Set(['subsaver.fr', 'www.subsaver.fr']);

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next();
  const host = (req.headers.host || '').split(':')[0];
  if (host && !ALLOWED_HOSTS.has(host)) {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }
  next();
});

// Servir les fichiers statiques depuis dist/. Les fichiers construits par
// Vite dans assets/ ont un hash dans leur nom (immuables entre deux builds :
// cache long terme sûr) ; tout le reste (index.html, sitemap, logos...) est
// revalidé à chaque requête pour ne jamais servir une version périmée après
// déploiement.
app.use(express.static(join(__dirname, 'frontend', 'dist'), {
  setHeaders(res, filePath) {
    if (filePath.includes(`${sep}assets${sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  },
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
