document.addEventListener("DOMContentLoaded", function () {
    const searchInputElement = document.getElementById('search');
    const containerMoviesDiv = document.getElementById("movies-container");
    

    // To stay with the last input
    const lastSearch = localStorage.getItem('lastSearch');
    if (lastSearch) {
        searchInputElement.value = lastSearch;
        MovieAPI.fetchMovies(lastSearch).then(movies => {
            MovieAPI.RenderMoviesCard(movies, containerMoviesDiv);
        });
    }

    searchInputElement.addEventListener("input", function () {
        const query = searchInputElement.value;
        localStorage.setItem('lastSearch', query); // saving the last input in local storage
        if (query.length > 0) {
            MovieAPI.fetchMovies(query).then(movies => {
                MovieAPI.RenderMoviesCard(movies, containerMoviesDiv);
            });
        } else {
            containerMoviesDiv.innerHTML = "";
        }
    });
});
