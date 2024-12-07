const spotifyClientId = 'f1e2af643e9d4853a2c98c792e76ed22';
const spotifyClientSecret = '6d743e43435d4598817f5c2acbccea79';
const lyricsApiUrl = 'https://api.lyrics.ovh/v1/';
const spotifyTokenUrl = 'https://accounts.spotify.com/api/token';
const spotifySearchUrl = 'https://api.spotify.com/v1/search';
const youtubeSearchUrl = 'https://www.googleapis.com/youtube/v3/search';
const youtubeApiKey = 'AIzaSyAGdbvH7_mx2IXAZ5XJd0G3HnztCQ6cWhI';

// Fetch Spotify Token
async function getSpotifyToken() {
  try {
    const response = await fetch(spotifyTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error fetching Spotify token:', error);
    return null;
  }
}

// Fetch Songs (Genre from Spotify)
async function fetchSongsByGenre(genre, token) {
  try {
    const response = await fetch(`${spotifySearchUrl}?q=genre:${genre}&type=track&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.tracks.items.length > 0) {
      return data.tracks.items.map((track) => ({
        artist: track.artists[0].name,
        title: track.name,
        spotifyUrl: track.external_urls.spotify,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching songs by genre:', error);
    return [];
  }
}

// Fetch Lyrics (Song)
async function fetchLyrics(artist, title) {
  try {
    const response = await fetch(`${lyricsApiUrl}${artist}/${title}`);
    const data = await response.json();
    return data.lyrics ? data.lyrics.split('\n') : null;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return null;
  }
}

// Fetch YouTube Video
async function fetchYouTubeVideo(query) {
  try {
    const response = await fetch(
      `${youtubeSearchUrl}?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${youtubeApiKey}&maxResults=1`
    );
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
    }
    return null;
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    return null;
  }
}

// Response intros
function getRandomResponse() {
  const responses = [
    "Hmm... This reminds me of something profound in music. Here's what I found:",
    "Thinking about your question, this line comes to mind:",
    "Interesting! Here's what the music world might say:"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Poem intros
function getPoemIntro() {
  const intros = [
    "Thinking of what confuses or inspires you, perhaps this poem offers a little guidance:",
    "Sometimes a mix of words can reveal more clarity. Here's a poetic take:",
    "Combining your favorite song and what resonates, this poem might say it all:"
  ];
  return intros[Math.floor(Math.random() * intros.length)];
}

// Responses (Unavailable)
function getFallbackResponse() {
  const fallbackResponses = [
    "Perhaps the answer is already within you. Trust yourself.",
    "Sometimes, the silence holds the key you seek.",
    "It seems you already know the answer. Follow your heart."
  ];
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

// Shuffling words (Poem)
function generatePoem(lyrics1, lyrics2) {
  if (!lyrics1 || !lyrics2) return null;

  const allWords = [...lyrics1.join(' ').split(/\s+/), ...lyrics2.join(' ').split(/\s+/)];
  const shuffledWords = allWords.sort(() => Math.random() - 0.5);
  const poemWords = shuffledWords.slice(0, 30); 

  let formattedPoem = '';
  const wordsPerLine = 5;
  for (let i = 0; i < poemWords.length; i += wordsPerLine) {
    formattedPoem += poemWords.slice(i, i + wordsPerLine).join(' ') + '<br>';
  }
  return formattedPoem;
}

// Main Functionality
async function generateResponse() {
  const question = document.getElementById('question').value || 'life';
  const genre = document.getElementById('genre').value;

  // Fetch Spotify Token
  const token = await getSpotifyToken();
  if (!token) {
    document.getElementById('output').innerHTML = "Failed to connect to Spotify. Please try again later.";
    return;
  }

  // Random Song (Genre)
  const songs = await fetchSongsByGenre(genre, token);
  if (songs.length === 0) {
    document.getElementById('output').innerHTML = "Couldn't find songs for this genre. Try another!";
    return;
  }
  const randomSong = songs[Math.floor(Math.random() * songs.length)];

  // Fetch Lyrics
  const randomSongLyrics = await fetchLyrics(randomSong.artist, randomSong.title);
  const youtubeLink = await fetchYouTubeVideo(`${randomSong.title} ${randomSong.artist}`) || "https://www.youtube.com";

  // Missing Lyrics
  if (!randomSongLyrics) {
    document.getElementById('output').innerHTML = `
      <p>${getRandomResponse()}</p>
      <p>${getFallbackResponse()}</p>
    `;
    return;
  }

  // Gen Poem
  const poem = generatePoem(randomSongLyrics, randomSongLyrics);

  // Output
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = `
    <p>${getRandomResponse()}</p>
    <p>🎵 "${randomSongLyrics[0]}" — <strong>${randomSong.title}</strong> by ${randomSong.artist}</p>
    <a href="${randomSong.spotifyUrl}" target="_blank">▶️ Listen on Spotify</a><br>
    <a href="${youtubeLink}" target="_blank">▶️ Watch on YouTube</a><br><br>
    ${poem ? `<p>${getPoemIntro()}</p><p>${poem}</p>` : `<p>${getFallbackResponse()}</p>`}
  `;
}

document.getElementById('generate').addEventListener('click', generateResponse);
