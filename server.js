const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");

const db = require("./database");
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


// Register
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  // Perform validations 
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

  // Insert into SQLite database
  const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
  db.run(sql, [name, email, password], function (err) {
    if (err) {
      // If the email is already taken or some other error
      if (err.message.includes("UNIQUE constraint")) {
        return res.json({ success: false, message: "Email already registered." });
      }
      return res.json({ success: false, message: "Database error: " + err.message });
    }

    // If successful:
    return res.json({ success: true, userId: this.lastID });
  });
});








// Add movie to favorites
app.post("/favorites", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user; // user.id from the session
  const { movieId } = req.body;

  // Check if favorite already exists
  const sqlCheck = `SELECT id FROM favorites WHERE userId = ? AND movieId = ?`;
  db.get(sqlCheck, [userId, movieId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (row) {
      // Already in favorites
      return res.json({ success: false, message: "Movie already in favorites." });
    }

    // Insert into favorites
    const sqlInsert = `INSERT INTO favorites (userId, movieId) VALUES (?, ?)`;
    db.run(sqlInsert, [userId, movieId], function (err2) {
      if (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
      return res.json({ success: true, message: "Movie added to favorites." });
    });
  });
});

// Remove movie from favorites
app.delete("/favorites", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;
  const { movieId } = req.body;

  const sql = `DELETE FROM favorites WHERE userId = ? AND movieId = ?`;
  db.run(sql, [userId, movieId], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      // No rows deleted
      return res.status(404).json({ success: false, message: "Movie not found in favorites." });
    }
    return res.json({ success: true, message: "Movie removed from favorites." });
  });
});

// Get favorite movies for the logged-in user
app.get("/favorites", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;

  const sql = `SELECT movieId FROM favorites WHERE userId = ?`;
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    // rows is an array of objects: [ { movieId: '...' }, { movieId: '...' }, ... ]
    const favoriteMovieIDs = rows.map(row => row.movieId);
    res.json({ success: true, favorites: favoriteMovieIDs });
  });
});









// Add a link to a specific movie in favorites
app.post("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;
  const { movieId } = req.params;
  const { name, url, description, isPublic } = req.body; // <-- include isPublic
  
  if (!name || !url) {
    return res.json({ success: false, message: "Name and URL are required." });
  }
  
  // First find the favorite record
  const sqlFav = `SELECT id FROM favorites WHERE userId = ? AND movieId = ?`;
  db.get(sqlFav, [userId, movieId], (err, favorite) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!favorite) {
      return res.status(404).json({ success: false, message: "Movie not found in favorites." });
    }

    // Insert a link
    const sqlInsertLink = `
      INSERT INTO links (favoriteId, name, url, description, isPublic)
      VALUES (?, ?, ?, ?, ?)
    `;
    // Convert isPublic to an integer 0 or 1
    const isPublicValue = isPublic ? 1 : 0;

    db.run(sqlInsertLink, [favorite.id, name, url, description || "", isPublicValue], function (err2) {
      if (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
      res.json({ success: true, message: "Link added successfully." });
    });
  });
});




// Remove a link from a specific movie in favorites
app.delete("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;
  const { movieId } = req.params;
  const { name } = req.body; // the link 'name' as the unique identifier

  const sqlFav = `SELECT id FROM favorites WHERE userId = ? AND movieId = ?`;
  db.get(sqlFav, [userId, movieId], (err, favorite) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!favorite) {
      return res.status(404).json({ success: false, message: "Movie not found in favorites." });
    }

    const sqlDelLink = `DELETE FROM links WHERE favoriteId = ? AND name = ?`;
    db.run(sqlDelLink, [favorite.id, name], function (err2) {
      if (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: "Link not found." });
      }
      res.json({ success: true, message: "Link removed successfully." });
    });
  });
});

// Get links for a specific movie in favorites
app.get("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;
  const { movieId } = req.params;

  // 1) Find all favorites (i.e., all userIDs who favorited this movie).
  const sqlFavAll = `SELECT * FROM favorites WHERE movieId = ?`;
  db.all(sqlFavAll, [movieId], (err, allFavorites) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!allFavorites || allFavorites.length === 0) {
      // no one favorited this movie => no links
      return res.json({ success: true, links: [] });
    }

    // Let’s find the user's own favoriteId for the movie
    const userFavorite = allFavorites.find(f => f.userId === userId);
    // userFavorite could be undefined if this user didn't favorite the movie.

    // 2) We'll collect all public links from ALL favoriteIds
    const allFavIDs = allFavorites.map(f => f.id);

    const sqlLinks = `
      SELECT * FROM links
      WHERE favoriteId IN (${allFavIDs.map(() => '?').join(',')})
    `;

    db.all(sqlLinks, allFavIDs, (err2, linkRows) => {
      if (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }

      // 3) Filter: keep all public links + keep private links if they belong to this user
      const filtered = linkRows.filter(link => {
        // We'll assume 1 = public, 0 = private
        if (link.isPublic === 1) {
          return true; // show to everyone
        }
        // else if link is private => show only if it's user’s link
        return userFavorite && link.favoriteId === userFavorite.id;
      });

      // 4) Return only the needed fields
      const linksData = filtered.map(link => ({
        name: link.name,
        url: link.url,
        description: link.description,
        isPublic: link.isPublic,
      }));

      return res.json({ success: true, links: linksData });
    });
  });
});


// Edit a link for a specific movie in favorites
app.put("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;
  const { movieId } = req.params;
  const { name, newName, newUrl, newDescription } = req.body;

  if (!name || !newName || !newUrl) {
    return res.json({ success: false, message: "All fields are required." });
  }

  const sqlFav = `SELECT id FROM favorites WHERE userId = ? AND movieId = ?`;
  db.get(sqlFav, [userId, movieId], (err, favorite) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!favorite) {
      return res.status(404).json({ success: false, message: "Movie not found in favorites." });
    }

    const sqlUpdate = `
      UPDATE links
      SET name = ?, url = ?, description = ?
      WHERE favoriteId = ? AND name = ?
    `;
    db.run(
      sqlUpdate,
      [newName, newUrl, newDescription || "", favorite.id, name],
      function (err2) {
        if (err2) {
          return res.status(500).json({ success: false, message: err2.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ success: false, message: "Link not found to update." });
        }
        res.json({ success: true, message: "Link updated successfully." });
      }
    );
  });
});










// Login
app.post("/login.html", (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT id, name, email FROM users WHERE email = ? AND password = ?`;
  db.get(sql, [email, password], (err, row) => {
    if (err) {
      return res.json({ success: false, message: "Database error: " + err.message });
    }
    if (row) {
      // Found a user
      req.session.user = { id: row.id, name: row.name, email: row.email };
      return res.json({ success: true });
    } else {
      // No user found
      return res.json({ success: false, message: "Invalid email or password." });
    }
  });
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
  db.all("SELECT * FROM movies", [], (err, rows) => {
    if (err) {
      return res.status(500).send("Database error: " + err.message);
    }
    res.json(rows);
  });
});

app.get("/api/movies/:id", (req, res) => {
  db.get("SELECT * FROM movies WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).send("Database error: " + err.message);
    }
    if (row) {
      return res.json(row);
    } else {
      return res.status(404).send("Movie not found");
    }
  });
});

// Protect access to main pages
app.get("/index", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

app.get("/details", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "client", "details.html"));
});

app.get("/favorite", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "client", "favorite.html"));
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








