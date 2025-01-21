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
  if (user && !user.favorites.includes(movieId)) {
      user.favorites.push(movieId);
      saveUsers();
      return res.json({ success: true, message: "Movie added to favorites." });
  }

  res.json({ success: false, message: "Movie already in favorites or user not found." });
});

// Remove movie from favorites
app.delete("/favorites", isAuthenticated, (req, res) => {
  const { email } = req.session.user;
  const { movieId } = req.body;

  const user = users.find(user => user.email === email);
  if (user && user.favorites.includes(movieId)) {
      user.favorites = user.favorites.filter(id => id !== movieId);
      saveUsers();
      return res.json({ success: true, message: "Movie removed from favorites." });
  }

  res.json({ success: false, message: "Movie not found in favorites or user not found." });
});

// Get favorite movies for the logged-in user
app.get("/favorites", isAuthenticated, (req, res) => {
  const { email } = req.session.user; // Assuming user session contains email
  const user = users.find((user) => user.email === email);

  if (user) {
    res.json({ success: true, favorites: user.favorites });
  } else {
    res.status(404).json({ success: false, message: "User not found." });
  }
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
