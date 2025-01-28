document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const imdbID = params.get("imdbID");
  
    if (imdbID) {
      MovieDetailsAPI.fetchMovieDetails(imdbID).then(movie => {
        if (movie) {
          // Instead of calling renderMovieDetails() directly,
          // we first fetch links from the server, then render.
          MovieDetailsAPI.fetchMovieLinks(imdbID)
            .then(links => {
              MovieDetailsAPI.renderMovieDetails(movie, links);
            })
            .catch(err => {
              console.error("Error fetching links:", err);
              document.getElementById("movie-details").innerHTML =
                "<p>Movie found, but error occurred when fetching links.</p>";
            });
        } else {
          document.getElementById("movie-details").innerHTML =
            "<p>Movie not found or an error occurred.</p>";
        }
      });
    } else {
      document.getElementById("movie-details").innerHTML = "<p>Movie not found.</p>";
    }
  });
  