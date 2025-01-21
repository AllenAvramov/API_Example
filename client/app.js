const API_KEY = 'c0d87c58'
const BASE_URL = 'http://www.omdbapi.com/';
let LIKED_MOVIES = JSON.parse(localStorage.getItem("LIKED_MOVIES")) || [];
let LINKS_MOVIES = JSON.parse(localStorage.getItem("LINKS_MOVIES")) || [];

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
            <div class="col-md-4 mb-9">
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
                    ${isLiked ? '<button id="addLinkButton" class="btn btn-danger">Add Link</button>' : ''}
                </div>
            </div>
        </div>
      `;
        detailsContainer.innerHTML = detailsHTML;


        
            // Add event listeners for Delete and Edit buttons
        movieLinks.forEach((link, index) => {
            const deleteButton = document.getElementById(`delete-link-${index}`);
            if (deleteButton) {
                deleteButton.addEventListener("click", () => {
                    // Find the actual index in LINKS_MOVIES
                    const actualIndex = LINKS_MOVIES.findIndex(l => l.imdbID === link.imdbID && l.name === link.name && l.link === link.link);
        
                    if (actualIndex !== -1) {
                        LINKS_MOVIES.splice(actualIndex, 1); // Remove the link
                        localStorage.setItem("LINKS_MOVIES", JSON.stringify(LINKS_MOVIES));
                        alert("Link deleted successfully!");
                        this.renderMovieDetails(movie); // Re-render the details view
                    }
                });
            }

            const editButton = document.getElementById(`edit-link-${index}`);
            if (editButton) {
                editButton.addEventListener("click", () => {
                    // Prompt for new values
                    const newName = prompt("Enter new name:", link.name);
                    const newLink = prompt("Enter new link:", link.link);
        
                    if (newName && newLink) {
                        // Find the actual index in LINKS_MOVIES
                        const actualIndex = LINKS_MOVIES.findIndex(l => l.imdbID === link.imdbID && l.name === link.name && l.link === link.link);
        
                        if (actualIndex !== -1) {
                            // Update the actual link in LINKS_MOVIES
                            LINKS_MOVIES[actualIndex].name = newName;
                            LINKS_MOVIES[actualIndex].link = newLink;
                            localStorage.setItem("LINKS_MOVIES", JSON.stringify(LINKS_MOVIES));
                            alert("Link updated successfully!");
                            this.renderMovieDetails(movie); // Re-render the details view
                        }
                    } else {
                        alert("Both fields are required to edit the link.");
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

        document.getElementById("addLinkButton")?.addEventListener("click", () => {
            const form = document.createElement("div");
            form.className = "mt-3";
          
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.placeholder = "Link Name";
            nameInput.className = "form-control mb-2";
          
            const urlInput = document.createElement("input");
            urlInput.type = "text";
            urlInput.placeholder = "Link URL";
            urlInput.className = "form-control mb-2";
          
            const descriptionInput = document.createElement("textarea");
            descriptionInput.placeholder = "Description";
            descriptionInput.className = "form-control mb-2";
          
            const saveButton = document.createElement("button");
            saveButton.textContent = "Save";
            saveButton.className = "btn btn-primary me-2";
          
            const cancelButton = document.createElement("button");
            cancelButton.textContent = "Cancel";
            cancelButton.className = "btn btn-danger";
          
            form.append(nameInput, urlInput, descriptionInput, saveButton, cancelButton);
            document.querySelector(".card-body").appendChild(form);
          
            cancelButton.addEventListener("click", () => form.remove());
          
            saveButton.addEventListener("click", async () => {
              const name = nameInput.value;
              const url = urlInput.value;
              const description = descriptionInput.value;
          
              if (name && url) {
                try {
                  const response = await fetch("/add-link", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imdbID: movie.imdbID, name, url, description }),
                  });
                  const result = await response.json();
          
                  if (result.success) {
                    alert("Link added successfully!");
                    form.remove();
                    // Optionally refresh the links
                  } else {
                    alert("Failed to add link: " + result.message);
                  }
                } catch (error) {
                  console.error("Error adding link:", error);
                }
              } else {
                alert("Please fill out all fields.");
              }
                });
            });
        }
    }
