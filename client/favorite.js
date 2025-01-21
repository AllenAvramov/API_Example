let likedMoviesDetails = []; // Will store detailed movie objects

// Fetch the current user's favorite movie IDs from the backend
async function fetchCurrentUserFavorites() {
  try {
    const response = await fetch("/favorites"); // Endpoint to get the current user's favorites
    const data = await response.json();
    if (data.success) {
      return data.favorites; // List of IMDb IDs for the user's favorite movies
    } else {
      console.error("Failed to fetch user favorites:", data.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    return [];
  }
}

// Fetch detailed movie data for the user's liked movies
async function fetchLikedMovies() {
  const API_KEY = "c0d87c58";
  const BASE_URL = "http://www.omdbapi.com/";
  
  // Fetch the current user's favorites
  const LIKED_MOVIES = await fetchCurrentUserFavorites();
  likedMoviesDetails = []; // Clear previous data

  // Fetch details for each liked movie
  for (const imdbID of LIKED_MOVIES) {
    const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}`);
    const movie = await response.json();
    if (movie.Response === "True") {
      likedMoviesDetails.push({
        name: movie.Title,
        year: parseInt(movie.Year),
        rating: parseFloat(movie.imdbRating),
        poster: movie.Poster,
        imdbID: movie.imdbID,
      });
    }
  }

  renderMovies(); // Render movies after fetching details
}

// Render the liked movies
function renderMovies(sortBy = "name") {
  const container = document.getElementById("likedMoviesContainer");
  container.innerHTML = "";

  // Sort movies based on the selected criteria
  const sortedMovies = [...likedMoviesDetails].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "year") return a.year - b.year;
    if (sortBy === "rating") return b.rating - a.rating; // Descending order
    return 0;
  });

  // Generate movie cards
  if (sortedMovies.length === 0) {
    container.innerHTML = "<p>No liked movies found.</p>";
  } else {
    sortedMovies.forEach((movie) => {
      const movieCard = `
        <div class="card movie-card mb-4" style="width: 18rem;">
          <img src="${movie.poster}" class="card-img-top" alt="${movie.name}">
          <div class="card-body">
            <h5 class="card-title">${movie.name}</h5>
            <p class="card-text"><strong>Year:</strong> ${movie.year}</p>
            <p class="card-text"><strong>IMDb Rating:</strong> ${movie.rating}</p>
            <a href="https://www.imdb.com/title/${movie.imdbID}" target="_blank" class="btn btn-primary">View on IMDb</a>
          </div>
        </div>
      `;
      container.innerHTML += movieCard;
    });
  }
}

// Add event listener for sorting
document.getElementById("sortBy").addEventListener("change", (e) => {
  renderMovies(e.target.value);
});

// Fetch and display movies on page load
fetchLikedMovies();
