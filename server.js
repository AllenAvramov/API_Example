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






// Like a link
app.post("/favorites/:movieId/links/:linkId/like", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;
  const { movieId, linkId } = req.params;

  // 1) Check that this link belongs to the correct movie and is visible to the user
  const sqlCheckLink = `
    SELECT l.id, l.favoriteId, f.userId as favOwner
    FROM links l
    JOIN favorites f ON f.id = l.favoriteId
    WHERE l.id = ? AND f.movieId = ?
  `;
  db.get(sqlCheckLink, [linkId, movieId], (err, linkRow) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!linkRow) {
      return res.status(404).json({ success: false, message: "Link not found for this movie." });
    }

    // 2) If the link is private and doesn’t belong to this user => user can’t like it
    //    Or you may allow them to like it only if they can see it. It's up to you.
    //    For simplicity, let's allow liking if the user can see the link
    //    (We already filter in the GET route if it is not visible.)

    // 3) Insert into link_likes
    const sqlInsert = `INSERT INTO link_likes (userId, linkId) VALUES (?, ?)`;
    db.run(sqlInsert, [userId, linkId], function (err2) {
      if (err2) {
        if (err2.message.includes("UNIQUE constraint")) {
          // Already liked
          return res.status(400).json({ success: false, message: "Already liked." });
        }
        return res.status(500).json({ success: false, message: err2.message });
      }
      return res.json({ success: true, message: "Link liked." });
    });
  });
});

// Unlike a link
app.delete("/favorites/:movieId/links/:linkId/like", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;
  const { movieId, linkId } = req.params;

  // Same check to see if link belongs to the movie
  const sqlCheckLink = `
    SELECT l.id
    FROM links l
    JOIN favorites f ON f.id = l.favoriteId
    WHERE l.id = ? AND f.movieId = ?
  `;
  db.get(sqlCheckLink, [linkId, movieId], (err, linkRow) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!linkRow) {
      return res.status(404).json({ success: false, message: "Link not found for this movie." });
    }

    // 2) Remove from link_likes
    const sqlDel = `DELETE FROM link_likes WHERE userId = ? AND linkId = ?`;
    db.run(sqlDel, [userId, linkId], function (err2) {
      if (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
      if (this.changes === 0) {
        return res
          .status(400)
          .json({ success: false, message: "You haven't liked this link." });
      }
      return res.json({ success: true, message: "Link unliked." });
    });
  });
});





// Remove a link from a specific movie in favorites
app.delete("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  // Extract the logged-in user's ID and NAME from the session
  const { id: userId, name: userName } = req.session.user;
  const { movieId } = req.params;
  const { name } = req.body; // unique link identifier is "name"

  // Step 1: Find the link + associated favorite
  //         (We JOIN favorites to ensure it belongs to the correct movie,
  //          and to find who the "owner" is.)
  const sqlLink = `
    SELECT links.id AS linkId,
           favorites.userId AS ownerId
    FROM links
    JOIN favorites ON favorites.id = links.favoriteId
    WHERE links.name = ?
      AND favorites.movieId = ?
  `;

  db.get(sqlLink, [name, movieId], (err, linkRow) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!linkRow) {
      // Means no link matched that (movieId + link name)
      return res.status(404).json({ success: false, message: "Link not found for this movie." });
    }

    // Step 2: Check if the current user is the "owner" OR is "ADMIN".
    if (linkRow.ownerId !== userId && userName !== "ADMIN") {
      return res.status(403).json({ success: false, message: "You are not allowed to delete this link." });
    }

    // Step 3: Perform the DELETE if authorized
    const sqlDelLink = `DELETE FROM links WHERE id = ?`;
    db.run(sqlDelLink, [linkRow.linkId], function (err2) {
      if (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: "Link not found." });
      }
      return res.json({ success: true, message: "Link removed successfully." });
    });
  });
});

// Get links for a specific movie in favorites
app.get("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  const { id: userId } = req.session.user;
  const { movieId } = req.params;

  // 1) Find all favorites for this movie
  const sqlFavAll = `SELECT * FROM favorites WHERE movieId = ?`;
  db.all(sqlFavAll, [movieId], (err, allFavorites) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!allFavorites || allFavorites.length === 0) {
      return res.json({ success: true, links: [] });
    }

    // 2) The user’s own favorite record
    const userFavorite = allFavorites.find((f) => f.userId === userId);
    const allFavIDs = allFavorites.map((f) => f.id);

    // We’ll fetch links from the links table:
    const sqlLinks = `
      SELECT
        links.*,
        (SELECT COUNT(*) FROM link_likes WHERE link_likes.linkId = links.id) AS likeCount,
        (SELECT COUNT(*) FROM link_likes WHERE link_likes.linkId = links.id AND link_likes.userId = ?) AS hasLiked
      FROM links
      WHERE favoriteId IN (${allFavIDs.map(() => "?").join(",")})
    `;

    db.all(sqlLinks, [userId, ...allFavIDs], (err2, linkRows) => {
      if (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }

      // filter out private links not belonging to the user
      const filtered = linkRows.filter(link => {
        if (link.isPublic === 1) return true;
        return userFavorite && link.favoriteId === userFavorite.id;
      });

      const linksData = filtered.map(link => ({
        id: link.id,                  // <-- we'll need this ID for "liking"
        name: link.name,
        url: link.url,
        description: link.description,
        isPublic: link.isPublic,
        likeCount: link.likeCount,
        hasLiked: link.hasLiked > 0   // 0 or 1 => boolean
      }));

      return res.json({ success: true, links: linksData });
    });
  });
});


// Edit a link for a specific movie in favorites
app.put("/favorites/:movieId/links", isAuthenticated, (req, res) => {
  // Extract user info and route params
  const { id: userId, name: userName } = req.session.user;
  const { movieId } = req.params;

  const { name, newName, newUrl, newDescription } = req.body;
  if (!name || !newName || !newUrl) {
    return res.json({ success: false, message: "All fields are required." });
  }

  // Step 1: Find the link + associated favorite (its owner)
  const sqlLink = `
    SELECT links.id AS linkId,
           favorites.userId AS ownerId
    FROM links
    JOIN favorites ON favorites.id = links.favoriteId
    WHERE links.name = ?
      AND favorites.movieId = ?
  `;

  db.get(sqlLink, [name, movieId], (err, linkRow) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!linkRow) {
      return res.status(404).json({ success: false, message: "Link not found for this movie." });
    }

    // Step 2: Check if current user is the link's owner or is ADMIN
    if (linkRow.ownerId !== userId && userName !== "ADMIN") {
      return res.status(403).json({ success: false, message: "You are not allowed to edit this link." });
    }

    // Step 3: Perform the update
    const sqlUpdate = `
      UPDATE links
      SET name = ?, url = ?, description = ?
      WHERE id = ?
    `;
    db.run(sqlUpdate, [newName, newUrl, newDescription || "", linkRow.linkId], function (err2) {
      if (err2) {
        return res.status(500).json({ success: false, message: err2.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: "Link not found to update." });
      }
      return res.json({ success: true, message: "Link updated successfully." });
    });
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








