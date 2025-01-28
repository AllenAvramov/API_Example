const API_KEY = 'c0d87c58'
const BASE_URL = 'http://www.omdbapi.com/';
let LINKS_MOVIES = JSON.parse(localStorage.getItem("LINKS_MOVIES")) || [];
let LIKED_MOVIES = [];

fetch('/favorites', { method: 'GET', credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      LIKED_MOVIES = data.favorites; 
      // render your UI with the correct "like" states
    }
  });

  fetch('/favorites', { method: 'GET', credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      LIKED_MOVIES = data.favorites; // e.g. array of imdbIDs
    }
  });
 


class Movie{
    constructor(id,title,year,plot,imdbid,poster){
        this.id = id;
        this.title = title;
        this.year = year;
        this.plot = plot; 
        this.imdbid = imdbid;
        this.poster = poster;
        this.links = [];
    }

    addLink(name, url, description){
        this.links.push({name, url, description});
    }

    removeLink(name){
        this.links = this.links.filter(link => link.name!== name);
    }

    updateLink(name, url, description){
        
    }

}

/* example of fetch
   {
  "Search": [
    {
      "Title": "Batman Begins",
      "Year": "2005",
      "imdbID": "tt0372784",
      "Type": "movie",
      "Poster": "https://someurl.com/batmanbegins.jpg"
    },
    {
      "Title": "The Dark Knight",
      "Year": "2008",
      "imdbID": "tt0468569",
      "Type": "movie",
      "Poster": "https://someurl.com/thedarkknight.jpg"
    }
  ],
  "totalResults": "2",
  "Response": "True"
}
*/ 


class MovieAPI {
    static async fetchMovies(query) {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${query}`);
        const data = await response.json();
        if (data.Response === "True") {
            return data.Search.map(movie => new Movie(
                movie.imdbID,
                movie.Title,
                movie.Year,
                "",
                movie.imdbID,
                movie.Poster
            ));
        }
        return [];
    }

    static RenderMoviesCard(movies, container) {
        const cards = movies.map(movie => `
            <div class="animate__animated animate__zoomIn col-md-4 mb-9">
                <div class="card row" style="width: 18rem;">
                    <img src="${movie.poster}" class="card-img-top" alt="${movie.title}">
                    <div class="card-body">
                        <h5 class="card-title">${movie.title}</h5>
                        <p class="card-text">${movie.year}</p>
                        <a href="details.html?imdbID=${movie.imdbid}" class="btn btn-primary">Details</a>
                    </div>
                </div>
            </div>
        `).join('');
        container.innerHTML = cards;
    }
}


class MovieDetails{
    constructor(imdbID,title, poster, year, genre, director, actors, plot, imdbRating){
        this.imdbID = imdbID
        this.title = title;
        this.poster = poster;
        this.year = year;
        this.genre = genre;
        this.director = director;
        this.actors = actors;
        this.plot = plot;
        this.imdbRating = imdbRating;
       
    }
}

/* example of Details from fetch
{"Title":"Game of Thrones","Year":"2011–2019","Rated":"TV-MA","Released":"17 Apr 2011",
 "Runtime":"57 min","Genre":"Action, Adventure, Drama","Director":"N/A",
 "Writer":"David Benioff, D.B. Weiss","Actors":"Emilia Clarke, Peter Dinklage, Kit Harington",
 "Plot":"Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.",
 "Language":"English","Country":"United States, United Kingdom","Awards":"Won 59 Primetime Emmys. 397 wins & 655 nominations total",
 "Poster":"https://m.media-amazon.com/images/M/MV5BMTNhMDJmNmYtNDQ5OS00ODdlLWE0ZDAtZTgyYTIwNDY3OTU3XkEyXkFqcGc@._V1_SX300.jpg",
 "Ratings":[{"Source":"Internet Movie Database","Value":"9.2/10"}],"Metascore":"N/A","imdbRating":"9.2","imdbVotes":"2,370,839",
 "imdbID":"tt0944947","Type":"series","totalSeasons":"8","Response":"True"}
*/

class MovieDetailsAPI {
    static async fetchMovieDetails(imdbID) {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}`);
        const data = await response.json();
        if (data.Response === 'True') {
            return new MovieDetails(
                data.imdbID,
                data.Title,
                data.Poster,
                data.Year,
                data.Genre,
                data.Director,
                data.Actors,
                data.Plot,
                data.imdbRating
            );
        }
        return null;
    }

    static renderMovieDetails(movie) {
        const isLiked = LIKED_MOVIES.includes(movie.imdbID);
        const likeButtonText = isLiked ? "Unlike" : "Like";

        // Retrieve links for this movie
        const movieLinks = LINKS_MOVIES.filter(link => link.imdbID === movie.imdbID);
        const linksHTML = movieLinks.map((link,index) => `
            <p>
                <strong>${link.name}:</strong> 
                <a href="${link.link}" target="_blank">${link.link}</a>
                <button class="btn btn-danger btn-sm ml-2" id="delete-link-${index}">Delete</button>
                <button class="btn btn-warning btn-sm ml-2" id="edit-link-${index}">Edit</button>
            </p>
        `).join('');

        

        const detailsContainer = document.getElementById("movie-details");
        const detailsHTML = `
        <div class="row justify-content-center">
            <div class="card" style="width: 29rem;">
                <img src="${movie.poster}" class="img-fluid" alt="${movie.title}">
                <div class="card-body">
                    <h5 class="card-title">${movie.title}</h5>
                    <p class="card-text"><strong>Year:</strong> ${movie.year}</p>
                    <p class="card-text"><strong>Genre:</strong> ${movie.genre}</p>
                    <p class="card-text"><strong>Director:</strong> ${movie.director}</p>
                    <p class="card-text"><strong>Actors:</strong> ${movie.actors}</p>
                    <p class="card-text"><strong>Plot:</strong> ${movie.plot}</p>
                    <p class="card-text"><strong>IMDb Rating:</strong> ${movie.imdbRating}</p>
                    <h1 class="display-4">Links:</h1>
                    ${linksHTML || "<p>No links added yet.</p>"}
                    <a href="https://www.imdb.com/title/${movie.imdbID}" target="_blank" class="btn btn-warning">Visit IMDb</a>
                    <a href="index.html" class="btn btn-info">to Search</a>
                    <button id="likeButton" class="btn btn-success">${likeButtonText}</button>
                    ${isLiked ? '<button id="linkButton" class="btn btn-danger">Add Link</button>' : ''}
                </div>
            </div>
        </div>
        `;
        detailsContainer.innerHTML = detailsHTML;


        
            // Add event listeners for Delete and Edit buttons
        movieLinks.forEach((link, index) => {
            const deleteButton = document.getElementById(`delete-link-${index}`);
            if (deleteButton) {
            deleteButton.addEventListener("click", async () => {
                try {
                const response = await fetch(`/favorites/${movie.imdbID}/links`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: link.name }), // Pass the link name
                });
                const result = await response.json();
                if (result.success) {
                    alert("Link deleted successfully!");
                    LINKS_MOVIES = LINKS_MOVIES.filter(l => l.name !== link.name || l.imdbID !== movie.imdbID);
                    localStorage.setItem("LINKS_MOVIES", JSON.stringify(LINKS_MOVIES));
                    MovieDetailsAPI.renderMovieDetails(movie); // Refresh UI
                } else {
                    alert(result.message);
                }
                } catch (error) {
                console.error("Error deleting link:", error);
                alert("Failed to delete link.");
                }
            });
            }

            const editButton = document.getElementById(`edit-link-${index}`);
  if (editButton) {
    editButton.addEventListener("click", () => {
      // Show a prompt to edit the link details
      const newName = prompt("Enter new name:", link.name);
      const newUrl = prompt("Enter new URL:", link.url);
      const newDescription = prompt("Enter new description:", link.description || "");

      if (newName && newUrl) {
        // Send the updated data to the server
        fetch(`/favorites/${movie.imdbID}/links`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: link.name, // Current name to identify the link
            newName,
            newUrl,
            newDescription,
          }),
        })
          .then(response => response.json())
          .then(result => {
            if (result.success) {
              alert("Link updated successfully!");
              // Update the local storage
              const actualIndex = LINKS_MOVIES.findIndex(
                l => l.imdbID === movie.imdbID && l.name === link.name && l.link === link.link
              );
              if (actualIndex !== -1) {
                LINKS_MOVIES[actualIndex].name = newName;
                LINKS_MOVIES[actualIndex].link = newUrl;
                LINKS_MOVIES[actualIndex].description = newDescription;
                localStorage.setItem("LINKS_MOVIES", JSON.stringify(LINKS_MOVIES));
              }
              // Re-render the movie details to show the updated link
              MovieDetailsAPI.renderMovieDetails(movie);
            } else {
              alert(result.message);
            }
          })
          .catch(error => {
            console.error("Error updating link:", error);
            alert("Failed to update link.");
          });
      } else {
        alert("Name and URL are required to edit the link.");
      }
                });
            }
        });



        // Handle "Like" button
        const likeButton = document.getElementById("likeButton");
        likeButton.addEventListener("click", async () => {
            try {
                if (LIKED_MOVIES.includes(movie.imdbID)) {
                    // Remove movie from local favorites
                    LIKED_MOVIES = LIKED_MOVIES.filter(id => id !== movie.imdbID);
                    LINKS_MOVIES = LINKS_MOVIES.filter(link => link.imdbID !== movie.imdbID);

                    // Update local storage
                    localStorage.setItem("LIKED_MOVIES", JSON.stringify(LIKED_MOVIES));
                    localStorage.setItem("LINKS_MOVIES", JSON.stringify(LINKS_MOVIES));

                    // Update server-side favorites
                    const response = await fetch("/favorites", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ movieId: movie.imdbID }),
                    });

                    const result = await response.json();
                    if (!result.success) {
                        alert("Failed to remove movie from favorites on the server.");
                    }
                } else {
                    // Add movie to local favorites
                    LIKED_MOVIES.push(movie.imdbID);

                    // Update local storage
                    localStorage.setItem("LIKED_MOVIES", JSON.stringify(LIKED_MOVIES));

                    // Update server-side favorites
                    const response = await fetch("/favorites", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ movieId: movie.imdbID }),
                    });

                    const result = await response.json();
                    if (!result.success) {
                        alert("Failed to add movie to favorites on the server.");
                    }
                }

                // Re-render to update UI
                this.renderMovieDetails(movie);
            } catch (error) {
                console.error("Error updating favorites:", error);
                alert("An error occurred while updating favorites.");
            }
        });

        // Handle "Add Link" button
        const linkButton = document.getElementById("linkButton");
        if (linkButton) {
            linkButton.addEventListener("click", () => {
                const form = document.createElement("div");
                form.id = "linkForm";
                form.className = "mt-3";



                const checkboxLabel = document.createElement("label");
                checkboxLabel.textContent = "Make link public? ";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "mb-2 ml-2";

                checkboxLabel.appendChild(checkbox);
                form.appendChild(checkboxLabel);


                const linkInput = document.createElement("input");
                linkInput.type = "text";
                linkInput.placeholder = "Enter Link";
                linkInput.className = "form-control mb-2";

                const nameInput = document.createElement("input");
                nameInput.type = "text";
                nameInput.placeholder = "Enter Name";
                nameInput.className = "form-control mb-2";

                const submitButton = document.createElement("button");
                submitButton.textContent = "Save Link";
                submitButton.className = "btn btn-primary";

                const cancelButton = document.createElement("button");
                cancelButton.textContent = "Cancel";
                cancelButton.className = "btn btn-danger";

                form.appendChild(linkInput);
                form.appendChild(nameInput);
                form.appendChild(submitButton);
                form.appendChild(cancelButton);

                linkButton.parentElement.appendChild(form);

                cancelButton.addEventListener("click", () => form.remove());

                submitButton.addEventListener("click", async () => {
                    const link = linkInput.value;
                    const name = nameInput.value;
                    const description = "Custom description"; // You can allow user input if needed
                    const isPublic = checkbox.checked;
                    if (link && name) {
                        try {
                            const response = await fetch(`/favorites/${movie.imdbID}/links`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name, url: link, description, isPublic  }),
                            });
                            const result = await response.json();
                            if (result.success) {
                                alert("Link saved successfully!");
                                LINKS_MOVIES.push({ imdbID: movie.imdbID, name, link });
                                localStorage.setItem("LINKS_MOVIES", JSON.stringify(LINKS_MOVIES));
                                form.remove();
                                MovieDetailsAPI.renderMovieDetails(movie); // Refresh UI
                            } else {
                                alert(result.message);
                            }
                        } catch (error) {
                            console.error("Error adding link:", error);
                            alert("Failed to save link.");
                        }
                    } else {
                        alert("Please fill out both fields.");
                    }
                });
            });
        }
    }
}