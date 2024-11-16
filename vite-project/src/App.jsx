import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const CLIENT_ID = "4daf581a01ac42208eaebcb5e1f64fe1"; // Your Client ID
  const REDIRECT_URI = "http://localhost:5173"; // Ensure it matches your Spotify Developer Console
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";

  const [token, setToken] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);  // Track loading state

  // Token retrieval from URL or local storage
  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");

    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))
        .split("=")[1];

      window.location.hash = ""; // Clear hash from URL
      window.localStorage.setItem("token", token);
    }

    setToken(token);
  }, []);

  // Fetching the current user's Spotify data after login
  useEffect(() => {
    if (token) {
      fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => console.log('Spotify User Data:', data))
        .catch((err) => console.error('Error fetching Spotify data:', err));
    }
  }, [token]);

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  // Searching for artists based on user input
  const searchArtists = async (e) => {
    e.preventDefault();
    const { data } = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: searchKey,
        type: "artist",
      },
    });

    setArtists(data.artists.items);
  };

  // Searching for tracks based on artist
  const searchTracks = async (artistId) => {
    setLoadingTracks(true);  // Set loading state when fetching tracks
    console.log(`Fetching top tracks for artist with ID: ${artistId}`);

    try {
      const { data } = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          country: "US", // Adjust this based on the desired country
        },
      });
      console.log("Top Tracks Data:", data);
      if (data.tracks.length === 0) {
        alert("No top tracks available for this artist.");
      } else {
        setTracks(data.tracks);
      }
    } catch (error) {
      console.error("Error fetching top tracks:", error);
      alert("There was an error fetching top tracks.");
    } finally {
      setLoadingTracks(false);  // Reset loading state after tracks are fetched
    }
  };

  const playTrackInSpotify = (trackId) => {
    window.open(`https://open.spotify.com/track/${trackId}`, "_blank");
  };

  const renderArtists = () => {
    return artists.map((artist) => (
      <div key={artist.id}>
        {artist.images.length ? <img width={"100%"} src={artist.images[0].url} alt="Artist" /> : <div>No Image</div>}
        <p>{artist.name}</p>
        <button onClick={() => searchTracks(artist.id)}>Show Top Tracks</button>
      </div>
    ));
  };

  const renderTracks = () => {
    if (loadingTracks) {
      return <div>Loading top tracks...</div>;  // Show loading message while tracks are being fetched
    }

    return tracks.map((track) => (
      <div key={track.id}>
        <p>{track.name} by {track.artists.map((artist) => artist.name).join(", ")}</p>
        <button onClick={() => playTrackInSpotify(track.id)}>Play</button>
      </div>
    ));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Spotify React</h1>
        {!token ? (
          <a
            href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}
            className="login-button"
          >
            Login to Spotify
          </a>
        ) : (
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        )}

        {token && (
          <>
            <form onSubmit={searchArtists} className="search-form">
              <input
                type="text"
                placeholder="Search for an artist..."
                onChange={(e) => setSearchKey(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>

            <div className="artists-container">{renderArtists()}</div>

            <div className="tracks-container">{renderTracks()}</div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
