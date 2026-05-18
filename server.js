import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_SUPABASE_URL = 'https://hanakyjpeihakljdsiim.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_ONXtudvZ4j6pi3GYRoRxGA__EOFk9jc';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/config.js', (_req, res) => {
  const config = {
    SUPABASE_URL: process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
    SUPABASE_RANKING_TABLE: process.env.SUPABASE_RANKING_TABLE || 'rankings',
    SUPABASE_PROFILE_TABLE: process.env.SUPABASE_PROFILE_TABLE || 'profiles',
  };

  res.type('application/javascript').send(`window.DAINAGON_CONFIG = ${JSON.stringify(config)};`);
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.use('/phaser', express.static(path.join(__dirname, 'node_modules/phaser/dist')));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
