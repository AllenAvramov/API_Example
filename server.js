const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "client")));
app.use(
  session({
    secret: "key", // Replace with a secure key
    resave: false,
    saveUninitialized: true,
  })
);

// File paths
const usersFilePath = path.join(__dirname, "users.json");

// Load users
let users = [];
if (fs.existsSync(usersFilePath)) {
  users = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));
} else {
  fs.writeFileSync(usersFilePath, JSON.stringify([]));
}



// Helper: Save users to file
const saveUsers = () => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next(); // Proceed if authenticated
  } else {
    res.redirect("/login");
  }
}

// Routes
// Register
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || name.length > 50) {
    return res.json({ success: false, message: "Name must be less than 50 characters." });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.json({ success: false, message: "Invalid email format." });
  }
  if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,15}$/.test(password)) {
    return res.json({
      success: false,
      message: "Password must be 6-15 characters long, with uppercase, lowercase, and a number.",
    });
  }
  if (users.some(user => user.email === email)) {
    return res.json({ success: false, message: "Email already registered." });
  }

  // Save user
  users.push({ name, email, password, favorites: [] });
  saveUsers();
  res.json({ success: true });
});








// Add movie to favorites
app.post("/favorites", isAuthenticated, (req, res) => {
  const { email } = req.session.user;
  const { movieId } = req.body;

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Check if movie already exists in favorites
  const existingMovie = user.favorites.find(fav => fav.movieId === movieId);
  if (existingMovie) {
    return res.json({ success: false, message: "Movie already in favorites." });
  }

  // Add the movie as an object with a movieId and an empty links array
  user.favorites.push({ movieId, links: [] });
  saveUsers();

  res.json({ success: true, message: "Movie added to favorites." });
});

// Remove movie from favorites
app.delete("/favorites", isAuthenticated, (req, res) => {
  const { email } = req.session.user; // Logged-in user's email
  const { movieId } = req.body; // Movie ID to remove

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Find the movie in the user's favorites
  const initialLength = user.favorites.length;
  user.favorites = user.favorites.filter(fav => fav.movieId !== movieId);

  // Check if a movie was actually removed
  if (user.favorites.length === initialLength) {
    return res.status(404).json({ success: false, message: "Movie not found in favorites." });
  }

  saveUsers(); // Save updated data
  res.json({ success: true, message: "Movie removed from favorites." });
});

// Get favorite movies for the logged-in user
app.get("/favorites", isAuthenticated, (req, res) => {
  const { email } = req.session.user;

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Extract movie IDs from the user's favorites
  const favoriteMovieIDs = user.favorites.map(fav => fav.movieId);

  res.json({ success: true, favorites: favoriteMovieIDs });
});









// Add a link to a specific movie in favorites
app.post("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { email } = req.session.user;
  const { movieId } = req.params;
  const { name, url, description } = req.body;

  if (!name || !url) {
    return res.json({ success: false, message: "Name and URL are required." });
  }

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const movie = user.favorites.find(fav => fav.movieId === movieId);
  if (!movie) {
    return res.status(404).json({ success: false, message: "Movie not found in favorites." });
  }

  // Add the link to the movie's links array
  movie.links.push({ name, url, description });
  saveUsers();

  res.json({ success: true, message: "Link added successfully." });
});



// Remove a link from a specific movie in favorites
app.delete("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { email } = req.session.user;
  const { movieId } = req.params;
  const { name } = req.body; // Assuming the link name is sent in the body to identify it

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Find the movie in the user's favorites
  const movie = user.favorites.find(fav => fav.movieId === movieId);
  if (!movie) {
    return res.status(404).json({ success: false, message: "Movie not found in favorites." });
  }

  // Find and remove the link by name
  const initialLength = movie.links.length;
  movie.links = movie.links.filter(link => link.name !== name);

  // Check if the link was actually removed
  if (movie.links.length === initialLength) {
    return res.status(404).json({ success: false, message: "Link not found." });
  }

  // Save the updated user data
  saveUsers();

  res.json({ success: true, message: "Link removed successfully." });
});

// Get links for a specific movie in favorites
app.get("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { email } = req.session.user;
  const { movieId } = req.params;

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const movie = user.favorites.find(fav => fav.movieId === movieId);
  if (!movie || !movie.links) {
    return res.json({ success: true, links: [] }); // No links yet
  }

  res.json({ success: true, links: movie.links });
});


// Edit a link for a specific movie in favorites
app.put("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { email } = req.session.user;
  const { movieId } = req.params;
  const { name, newName, newUrl, newDescription } = req.body;

  if (!name || !newName || !newUrl) {
    return res.json({ success: false, message: "All fields are required." });
  }

  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Find the movie in the user's favorites
  const movie = user.favorites.find(fav => fav.movieId === movieId);
  if (!movie) {
    return res.status(404).json({ success: false, message: "Movie not found in favorites." });
  }

  // Find the link to update
  const link = movie.links.find(link => link.name === name);
  if (!link) {
    return res.status(404).json({ success: false, message: "Link not found." });
  }

  // Update the link details
  link.name = newName;
  link.url = newUrl;
  link.description = newDescription || link.description; // Optional field

  // Save the updated user data
  saveUsers();

  res.json({ success: true, message: "Link updated successfully." });
});










// Login
app.post("/login.html", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(user => user.email === email && user.password === password);
  if (user) {
    req.session.user = { name: user.name, email: user.email };
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid email or password." });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send("Could not log out.");
    }
    res.redirect("/login");
  });
});

// Get user info
app.get("/user-info", (req, res) => {
  if (req.session && req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// Movies API
app.get("/api/movies", (req, res) => {
  res.json(movies);
});

app.get("/api/movies/:id", (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).send("Movie not found");
  }
});

// Protect access to main pages
app.get("/index", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

app.get("/details", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "client", "details.html"));
});

// Serve login and register pages
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "register.html"));
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
