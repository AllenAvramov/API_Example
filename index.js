document.addEventListener("DOMContentLoaded", function () {
    const searchInputElement = document.getElementById('search');
    const containerMoviesDiv = document.getElementById("movies-container");

    searchInputElement.addEventListener("input", function () {
        const query = searchInputElement.value;
        if (query.length >= 3) {
            MovieAPI.fetchMovies(query).then(movies => {
                MovieAPI.RenderMoviesCard(movies, containerMoviesDiv);
            });
        } else {
            containerMoviesDiv.innerHTML = "";
        }
    });
});