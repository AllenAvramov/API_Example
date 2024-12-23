const LIKED_MOVIES =JSON.parse(localStorage.getItem("LIKED_MOVIES")) || [];
const likedMoviesDetails = []; // Will store detailed movie objects

      // Fetch detailed movie data for all liked movies
      async function fetchLikedMovies() {
        const API_KEY = "c0d87c58";
        const BASE_URL = "http://www.omdbapi.com/";
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
        });

        // Generate movie cards
        sortedMovies.forEach((movie) => {
          const movieCard = `
                    <div class="card movie-card">
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

      // Add event listener for sorting
      document.getElementById("sortBy").addEventListener("change", (e) => {
        renderMovies(e.target.value);
      });

      // Fetch and display movies on page load
      fetchLikedMovies();