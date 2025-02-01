// 1) Fetch user info to display "Welcome, userName"
      fetch("/user-info")
        .then((response) => response.json())
        .then((data) => {
          if (data && data.name) {
            document.getElementById(
              "userName"
            ).textContent = `Welcome, ${data.name}`;
          } else {
            window.location.href = "/login"; // Redirect if not logged in
          }
        })
        .catch((error) => console.error("Error /user-info:", error));

      const OMDB_API_KEY = "c0d87c58";
      fetch("/api/movies-with-links?ts=${Date.now()}", {
        credentials: "include",
        cache: "no-cache", // extra precaution
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) {
            alert(data.message || "Failed to load data.");
            return;
          }

          const moviesWithLinks = data.data; // array of { movieId, topLink {...} }

          if (!moviesWithLinks || moviesWithLinks.length === 0) {
            document.getElementById("moviesBody").innerHTML =
              "<tr><td colspan='5'>No movies with links found.</td></tr>";
            return;
          }

          // For each movieId, fetch from OMDb to get Poster + Title
          const fetches = moviesWithLinks.map((item) => {
            const imdbID = item.movieId; // e.g. "tt0372784"
            return fetch(
              `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}`
            )
              .then((r) => r.json())
              .then((omdbData) => {
                if (omdbData.Response === "True") {
                  // We have .Title and .Poster
                  return {
                    ...item,
                    movieTitle: omdbData.Title,
                    moviePoster: omdbData.Poster, // can be "N/A"
                  };
                } else {
                  // fallback
                  return {
                    ...item,
                    movieTitle: imdbID,
                    moviePoster: "N/A",
                  };
                }
              })
              .catch((err) => {
                console.error("OMDb error for:", imdbID, err);
                return {
                  ...item,
                  movieTitle: imdbID,
                  moviePoster: "N/A",
                };
              });
          });

          // Wait for all fetches
          Promise.all(fetches).then((fullData) => {
            const tableBody = document.getElementById("moviesBody");
            tableBody.innerHTML = ""; // clear

            fullData.forEach((movieItem) => {
              const { linkName, linkUrl, linkDescription, likeCount, username } =
                movieItem.topLink;

              const tr = document.createElement("tr");

              // Poster cell
              const tdPoster = document.createElement("td");
              tdPoster.style.width = "60px";
              if (movieItem.moviePoster && movieItem.moviePoster !== "N/A") {
                tdPoster.innerHTML = `
                  <img 
                    src="${movieItem.moviePoster}" 
                    alt="Poster" 
                    style="width:60px;"
                  />
                `;
              } else {
                tdPoster.textContent = "No Poster";
              }

              // Title cell
              const tdTitle = document.createElement("td");
              tdTitle.style.textAlign = "center";
              tdTitle.textContent = movieItem.movieTitle;

              // Top Link cell
              const tdTopLink = document.createElement("td");
              tdTopLink.style.textAlign = "center";
              tdTopLink.innerHTML = `
                <strong>${linkName}</strong><br/>
                <a href="${linkUrl}" target="_blank">${linkUrl}</a>
                ${linkDescription ? `<br/><em>${linkDescription}</em>` : ""}
              `;

              // Likes cell
              const tdLikes = document.createElement("td");
              tdLikes.style.textAlign = "center";
              tdLikes.textContent = likeCount;

              // Users cell
              const tdAddedBy = document.createElement("td");
              tdAddedBy.style.textAlign = "center";
              tdAddedBy.innerHTML = `<strong>${username}</strong>`

              // Details cell
              const tdDetails = document.createElement("td");
              tdDetails.style.textAlign = "center";
              tdDetails.innerHTML = `
                <a href="/details?imdbID=${movieItem.movieId}" 
                   class="btn btn-primary btn-sm">
                  <i class="fa fa-info-circle" aria-hidden="true"></i>
                </a>
              `;

              tr.appendChild(tdPoster);
              tr.appendChild(tdTitle);
              tr.appendChild(tdTopLink);
              tr.appendChild(tdLikes);
              tr.appendChild(tdAddedBy);
              tr.appendChild(tdDetails);

              tableBody.appendChild(tr);
            });
          });
        })
        .catch((err) => {
          console.error("Error fetching /api/movies-with-links:", err);
          alert("Error loading data.");
        });