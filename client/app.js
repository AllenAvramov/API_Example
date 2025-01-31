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


    // NEW: fetch the links for this movie (server-side returns only what the user can see)
    static async fetchMovieLinks(imdbID) {
        const response = await fetch(`/favorites/${imdbID}/links`, {
          method: "GET",
          credentials: "include",
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Failed to fetch links.");
        }
        // result.links is an array of { name, url, description, isPublic }
        return result.links;
      }
    
      // We modify renderMovieDetails to accept the array of links we fetched
      static renderMovieDetails(movie, links) {
        // Instead of relying on a local LINKS_MOVIES array, use the links param
        // which is the server’s filtered list of public or private links.
    
        const isLiked = LIKED_MOVIES.includes(movie.imdbID);
        const likeButtonText = isLiked ? "Unlike" : "Like";
    
        // Build HTML for each link
        const linksHTML = links.map((link, index) => {
          const likeButtonText = link.hasLiked ? "Unlike" : "Like";
          return `
            <p>
              <strong>${link.name}:</strong>
              <a href="${link.url}" target="_blank">${link.url}</a>
              <button class="btn btn-danger btn-sm ml-2" id="delete-link-${index}">Delete</button>
              <button class="btn btn-warning btn-sm ml-2" id="edit-link-${index}">Edit</button>
              ${
                link.isPublic
                  ? '<span class="badge text-success badge-success ml-2">Public</span>'
                  : '<span class="badge text-danger badge-secondary ml-2">Private</span>'
              }
              <!-- Show like button & count -->
              <button class="btn btn-info btn-sm ml-2" id="like-link-${index}">${likeButtonText}</button>
              <span class="ml-1">(Likes: ${link.likeCount})</span>
            </p>
          `;
        }).join('');
    
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
                ${
                  isLiked
                    ? `<button id="linkButton" class="btn btn-danger">Add Link</button>`
                    : ""
                }
              </div>
            </div>
          </div>
        `;
        detailsContainer.innerHTML = detailsHTML;
    
        // Attach events
        this.attachLikeHandler(movie);
        if (isLiked) {
          this.attachAddLinkHandler(movie);
        }
        this.attachDeleteAndEditHandlers(movie, links);
      }
    
      static attachDeleteAndEditHandlers(movie, links) {
        links.forEach((link, index) => {
          const deleteButton = document.getElementById(`delete-link-${index}`);
          if (deleteButton) {
            deleteButton.addEventListener("click", async () => {
              try {
                const response = await fetch(`/favorites/${movie.imdbID}/links`, {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: link.name }), // identifying link by name
                  credentials: "include"
                });
                const result = await response.json();
                if (result.success) {
                  alert("Link deleted successfully!");
                  // Refresh the list from the server:
                  const updatedLinks = await this.fetchMovieLinks(movie.imdbID);
                  this.renderMovieDetails(movie, updatedLinks);
                } else {
                  alert(result.message || "Failed to delete link");
                }
              } catch (error) {
                console.error("Error deleting link:", error);
                alert("Failed to delete link.");
              }
            });
          }
    
          const editButton = document.getElementById(`edit-link-${index}`);
          if (editButton) {
            editButton.addEventListener("click", async () => {
              const newName = prompt("Enter new name:", link.name);
              const newUrl = prompt("Enter new URL:", link.url);
              const newDescription = prompt("Enter new description:", link.description || "");
    
              if (newName && newUrl) {
                try {
                  const response = await fetch(`/favorites/${movie.imdbID}/links`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: link.name,  // the current name
                      newName,
                      newUrl,
                      newDescription,
                    }),
                    credentials: "include"
                  });
                  const result = await response.json();
                  if (result.success) {
                    alert("Link updated successfully!");
                    // Re-fetch updated links from the server
                    const updatedLinks = await this.fetchMovieLinks(movie.imdbID);
                    this.renderMovieDetails(movie, updatedLinks);
                  } else {
                    alert(result.message || "Failed to update link.");
                  }
                } catch (error) {
                  console.error("Error updating link:", error);
                  alert("Failed to update link.");
                }
              } else {
                alert("Name and URL are required to edit the link.");
              }
            });
          }
          // 4a) LIKE button
          const likeButton = document.getElementById(`like-link-${index}`);
          if (likeButton) {
            likeButton.addEventListener("click", async () => {
              try {
                if (link.hasLiked) {
                  // user wants to UNLIKE
                  const response = await fetch(`/favorites/${movie.imdbID}/links/${link.id}/like`, {
                    method: "DELETE",
                    credentials: "include",
                  });
                  const result = await response.json();
                  if (!result.success) {
                    alert(result.message || "Failed to unlike");
                    return;
                  }
                } else {
                  // user wants to LIKE
                  const response = await fetch(`/favorites/${movie.imdbID}/links/${link.id}/like`, {
                    method: "POST",
                    credentials: "include",
                  });
                  const result = await response.json();
                  if (!result.success) {
                    alert(result.message || "Failed to like");
                    return;
                  }
                }

                // re-fetch new links from the server to update like count
                const updatedLinks = await this.fetchMovieLinks(movie.imdbID);
                this.renderMovieDetails(movie, updatedLinks);
              } catch (error) {
                console.error("Error (un)liking link:", error);
              }
            });
          }
        });
      }
    
      static attachAddLinkHandler(movie) {
        const linkButton = document.getElementById("linkButton");
        if (!linkButton) return;
    
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
          linkInput.placeholder = "Enter Link (URL)";
          linkInput.className = "form-control mb-2";
    
          const nameInput = document.createElement("input");
          nameInput.type = "text";
          nameInput.placeholder = "Enter Link Name";
          nameInput.className = "form-control mb-2";
    
          const descInput = document.createElement("input");
          descInput.type = "text";
          descInput.placeholder = "Enter Description";
          descInput.className = "form-control mb-2";
    
          const submitButton = document.createElement("button");
          submitButton.textContent = "Save Link";
          submitButton.className = "btn btn-primary mr-2";
    
          const cancelButton = document.createElement("button");
          cancelButton.textContent = "Cancel";
          cancelButton.className = "btn btn-danger";
    
          form.appendChild(linkInput);
          form.appendChild(nameInput);
          form.appendChild(descInput);
          form.appendChild(submitButton);
          form.appendChild(cancelButton);
    
          linkButton.parentElement.appendChild(form);
    
          cancelButton.addEventListener("click", () => form.remove());
    
          submitButton.addEventListener("click", async () => {
            const url = linkInput.value.trim();
            const name = nameInput.value.trim();
            const description = descInput.value.trim();
            const isPublic = checkbox.checked;
    
            if (url && name) {
              try {
                const response = await fetch(`/favorites/${movie.imdbID}/links`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, url, description, isPublic }),
                  credentials: "include"
                });
                const result = await response.json();
                if (result.success) {
                  alert("Link saved successfully!");
                  form.remove();
                  // Re-fetch updated links from the server
                  const updatedLinks = await this.fetchMovieLinks(movie.imdbID);
                  this.renderMovieDetails(movie, updatedLinks);
                } else {
                  alert(result.message || "Failed to add link.");
                }
              } catch (error) {
                console.error("Error adding link:", error);
                alert("Failed to save link.");
              }
            } else {
              alert("Please fill out both the Link (URL) and the Link Name fields.");
            }
          });
        });
      }
    
      static attachLikeHandler(movie) {
        const likeButton = document.getElementById("likeButton");
        likeButton.addEventListener("click", async () => {
          try {
            if (LIKED_MOVIES.includes(movie.imdbID)) {
              // Unlike (remove from favorites)
              LIKED_MOVIES = LIKED_MOVIES.filter(id => id !== movie.imdbID);
    
              // Update server
              const response = await fetch("/favorites", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId: movie.imdbID }),
                credentials: "include"
              });
              const result = await response.json();
              if (!result.success) {
                alert("Failed to remove movie from favorites on the server.");
              }
            } else {
              // Like (add to favorites)
              LIKED_MOVIES.push(movie.imdbID);
    
              // Update server
              const response = await fetch("/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId: movie.imdbID }),
                credentials: "include"
              });
              const result = await response.json();
              if (!result.success) {
                alert("Failed to add movie to favorites on the server.");
              }
            }
            // Re-render (first fetch new links if user newly liked the movie)
            let links = [];
            if (LIKED_MOVIES.includes(movie.imdbID)) {
              links = await this.fetchMovieLinks(movie.imdbID);
            }
            this.renderMovieDetails(movie, links);
          } catch (error) {
            console.error("Error updating favorites:", error);
            alert("An error occurred while updating favorites.");
          }
        });
      }
    
}