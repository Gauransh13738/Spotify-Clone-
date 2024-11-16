import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 4002;
const redirectUri = 'http://localhost:4002/callback'; // Make sure this is your redirect URI in Spotify settings

app.use(cors({ origin: 'http://localhost:5173' })); // Frontend URL

app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email user-read-playback-state playlist-read-private';
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token } = response.data;
    res.redirect(`http://localhost:5173?access_token=${access_token}`); // Send access token back to frontend
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).send('Authentication failed');
  }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
