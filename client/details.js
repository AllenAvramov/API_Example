document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const imdbID = params.get("imdbID");

    if (imdbID) {
        MovieDetailsAPI.fetchMovieDetails(imdbID).then(movie => {
            if (movie) {
                MovieDetailsAPI.renderMovieDetails(movie);
            } else {
                document.getElementById("movie-details").innerHTML = "<p>Movie not found or an error occurred.</p>";
            }
        });
    } else {
        document.getElementById("movie-details").innerHTML = "<p>Movie not found.</p>";
    }
});