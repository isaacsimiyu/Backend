const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const nodemailer = require("nodemailer");
const cors = require("cors");
const router = express.Router();
const bcrypt = require("bcrypt"); // Import bcrypt

const app = express();

const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: "https://tmucuweb.vercel.app", // Replace with your frontend URL
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Create a MySQL connection
const db = mysql.createConnection({
  host:process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: process.env.DB_PORT ||  "3306",
  database: process.env.DB_NAME || "tmucuwebsite",
});


db.query(
  `
  CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating admin_users table:", err);
    } else {
      console.log("Admin users table created");
    }
  }
);

// Insert the admin user data into the table
const username = "tommboyaunicu@gmail.com";
const password = "Tmucu@2024";

bcrypt.hash(password, 10, (err, hashedPassword) => {
  if (err) {
    console.error("Error hashing password:", err);
  } else {
    db.query(
      "INSERT INTO admin_users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      (err) => {
        if (err) {
          console.error("Error inserting admin user data:", err);
        } else {
          console.log("Admin user data inserted successfully");
        }
      }
    );
  }
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// Middleware for parsing JSON data in the request body
app.use(bodyParser.json());

// Create a users table if it doesn't exist
db.query(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    registrationNumber VARCHAR(255),
    phoneNumber VARCHAR(255),
    yearOfStudy VARCHAR(255),
    residenceStatus VARCHAR(255)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating users table:", err);
    } else {
      console.log("Users table created");
    }
  }
); 

// Create a 'contacts' table if it doesn't exist
db.query(
  `
  CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    message TEXT
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating 'contacts' table:", err);
    } else {
      console.log("Contacts table created");
    }
  }
);
// Create a 'newsletter' table if it doesn't exist
db.query(
  `
  CREATE TABLE IF NOT EXISTS newsletter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating 'newsletter' table:", err);
    } else {
      console.log("Newsletter table created");
    }
  }
);
// Create a 'mediausers' table if it doesn't exist
db.query(
  `
  CREATE TABLE IF NOT EXISTS mediausers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    registrationNumber VARCHAR(255),
    phoneNumber VARCHAR(255),
    yearOfStudy VARCHAR(255)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating 'mediausers' table:", err);
    } else {
      console.log("Mediausers table created");
    }
  }
);

// Define a route for user registration
app.post("/api/register", (req, res) => {
  const {
    name,
    email,
    registrationNumber,
    phoneNumber,
    yearOfStudy,
    residenceStatus,
  } = req.body;
  // Check if a user with the same email, registration number, or phone number already exists
  db.query(
    "SELECT * FROM users WHERE email = ? OR registrationNumber = ? OR phoneNumber = ?",
    [email, registrationNumber, phoneNumber],
    (err, results) => {
      if (err) {
        console.error("Error checking for duplicate values:", err);
        res.status(500).json({ message: "Registration failed" });
      } else if (results.length > 0) {
        res.status(400).json({
          message:
            "A user with the same email, phone, or registration number already exists",
        });
      } else {
        // No duplicates found, insert the user data into the database
        db.query(
          "INSERT INTO users (name, email, registrationNumber, phoneNumber, yearOfStudy, residenceStatus) VALUES (?, ?, ?, ?, ?, ?)",
          [
            name,
            email,
            registrationNumber,
            phoneNumber,
            yearOfStudy,
            residenceStatus,
          ],
          (err) => {
            if (err) {
              console.error("Error inserting data into the database:", err);
              res.status(500).json({ message: "Registration failed" });
            } else {
              console.log("User registered successfully");
              res.status(200).json({ message: "Registration successful" });

              // Send a welcome email to the user
              sendWelcomeEmail(name, email);
            }
          }
        );
      }
    }
  );
});
// Send a welcome email to the user
const sendWelcomeEmail = (name, email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tommboyaunicu@gmail.com",
      pass: "lxdfhdskpbvjquzg",
    },
  });

  const mailOptions = {
    from: "tommboyaunicu@gmail.com",
    to: email,
    subject: "Welcome to TMUCU",
    text: `Hello ${name},\n\nWelcome to TMUCU! Achieve the best from our services`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending welcome email:", error);
    } else {
      console.log("Welcome email sent:", info.response);
    }
  });
};

// Define a route for user contact messages
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;

  // Insert the user's contact message into the 'contacts' table
  db.query(
    "INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)",
    [name, email, phone, message],
    (err) => {
      if (err) {
        console.error("Error inserting data into the 'contacts' table:", err);
        res.status(500).json({ message: "Contact message submission failed" });
      } else {
        console.log("Contact message submitted successfully");

        // Send a thank-you email to the user
        sendThankYouEmail(name, email);

        res.status(200).json({
          message: "Contact message submitted successfully",
        });
      }
    }
  );
});

// Send a thank-you email to the user
const sendThankYouEmail = (name, email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tommboyaunicu@gmail.com",
      pass: "phyxvlhpzjymbrtr",
    },
  });

  const mailOptions = {
    from: "tommboyaunicu@gmail.com",
    to: email,
    subject: "Thank You for Contacting TMUCU",
    text: `Hello ${name},\n\nThank you for contacting TMUCU. We have received your message and will respond shortly.\n\nBest regards, TMUCU`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending thank-you email:", error);
    } else {
      console.log("Thank-you email sent:", info.response);
    }
  });
};

// Define a route for newsletter sign-up

app.post("/api/newsletter/signup", (req, res) => {
  const { email } = req.body; // Extract email from request body

  // Check if the email already exists in the newsletter table
  db.query(
    "SELECT * FROM newsletter WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("Error checking for duplicate email:", err);
        return res.status(500).json({ message: "Sign-up failed" });
      }

      if (results.length > 0) {
        // If email already exists, return 400 status with message
        return res.status(400).json({
          message:
            "This email address is already subscribed to the newsletter.",
        });
      }

      // No duplicate found, insert the email into the newsletter table
      db.query("INSERT INTO newsletter (email) VALUES (?)", [email], (err) => {
        if (err) {
          console.error(
            "Error inserting email into the newsletter table:",
            err
          );
          return res.status(500).json({ message: "Sign-up failed" });
        }

        console.log("Email signed up for the newsletter successfully");
        res.status(200).json({ message: "Sign-up successful" });

        // Send a welcome email to the user
        sendNewsletterEmail(email);
      });
    }
  );
});

// Function to send a welcome email to the user
const sendNewsletterEmail = (email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tommboyaunicu@gmail.com",
      pass: "lxdfhdskpbvjquzg",
    },
  });

  const mailOptions = {
    from: "tommboyaunicu@gmail.com",
    to: email,
    subject: "Welcome to TMUCU Newsletter",
    text: "Welcome to TMUCU Newsletter! You will now receive updates and news from TMUCU.",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending welcome email:", error);
    } else {
      console.log("Welcome email sent:", info.response);
    }
  });
};

// Define a route for media user registration
app.post("/api/media-registration", (req, res) => {
  const { name, email, registrationNumber, phoneNumber, yearOfStudy } =
    req.body;

  // Check if a user with the same email and registration number already exists in the users table
  db.query(
    "SELECT * FROM users WHERE email = ? AND registrationNumber = ?",
    [email, registrationNumber],
    (err, results) => {
      if (err) {
        console.error("Error checking user:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else if (results.length === 0) {
        // User doesn't exist, return an error
        res.status(400).json({ error: "You do not qualify to register." });
      } else {
        // User exists, insert data into mediausers table
        db.query(
          "INSERT INTO mediausers (name, email, registrationNumber, phoneNumber, yearOfStudy) VALUES (?, ?, ?, ?, ?)",
          [name, email, registrationNumber, phoneNumber, yearOfStudy],
          (err) => {
            if (err) {
              console.error("Error inserting data:", err);
              res.status(500).json({ error: "Internal Server Error" });
            } else {
              // Send a welcome email to the user
              sendMediaEmail(name, email);

              // Registration successful
              res.status(200).json({ message: "Registration successful" });
            }
          }
        );
      }
    }
  );
});
// Function to send a welcome email
const sendMediaEmail = (name, email) => {
  // Create a transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tommboyaunicu@gmail.com",
      pass: "lxdfhdskpbvjquzg",
    },
  });

  const mailOptions = {
    from: "tommboyaunicu@gmail.com",
    to: email,
    subject: "Welcome to TMUCU Media Registration",
    text: `Subject: Welcome to TMUCU Media Registration

Dear ${name},

We are thrilled to welcome you to the TMUCU Media Registration platform. You are now officially a member of our community.

Your registration details:
- Name: ${name}
- Email: ${email}

By becoming a TMUCU Media Member, you'll gain access to a wealth of resources, engage in exciting activities, and stay updated with the latest news and events within our community.

We look forward to having you as part of our media team. If you have any questions, feel free to reach out to our support team at tommboyaunicu@gmail.com.

Thank you for choosing TMUCU Media!

Best regards,
The TMUCU Media Team`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending welcome email:", error);
    } else {
      console.log("Welcome email sent:", info.response);
    }
  });
};

// Define a route to fetch users from the database
app.get("/api/users", (req, res) => {
  // Query to select all users from the users table
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Failed to fetch users" });
    } else {
      // Send the fetched users as a JSON response
      res.status(200).json(results);
    }
  });
});
// Define a route to handle user deletion
app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id; // Extract the user ID from the request parameters

  // Execute a SQL query to delete the user from the 'users' table
  db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else if (result.affectedRows === 0) {
      // If no user was deleted (user with the provided ID doesn't exist), return a 404 error
      res.status(404).json({ error: "User not found" });
    } else {
      // User deleted successfully
      res.status(204).send(); // Send a success response with no content
    }
  });
});

app.get("/api/contacts", (req, res) => {
  // Query to select all contact messages from the 'contacts' table
  db.query("SELECT * FROM contacts", (err, results) => {
    if (err) {
      console.error("Error fetching contact messages:", err);
      res.status(500).json({ message: "Failed to fetch contact messages" });
    } else {
      // Send the contact messages data as JSON response
      res.status(200).json(results);
    }
  });
});

app.get("/api/newsletter/subscribers", (req, res) => {
  // Query to select all subscribers from the 'newsletter' table
  db.query("SELECT * FROM newsletter", (err, results) => {
    if (err) {
      console.error("Error fetching subscribers:", err);
      res.status(500).json({ message: "Failed to fetch subscribers" });
    } else {
      // Send the subscribers data as JSON response
      res.status(200).json(results);
    }
  });
});

// Define a route to fetch the count of users
app.get("/api/user/count", (req, res) => {
  // Query to count the number of users in the 'users' table
  db.query("SELECT COUNT(*) AS count FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching user count:", err);
      res.status(500).json({ message: "Failed to fetch user count" });
    } else {
      // Send the user count as JSON response
      res.status(200).json({ count: results[0].count });
    }
  });
});

// Define a route to fetch the count of subscribers
app.get("/api/newsletter/subscribers/count", (req, res) => {
  // Query to count the number of subscribers in the 'newsletter' table
  db.query("SELECT COUNT(*) AS count FROM newsletter", (err, results) => {
    if (err) {
      console.error("Error fetching subscriber count:", err);
      res.status(500).json({ message: "Failed to fetch subscriber count" });
    } else {
      // Send the subscriber count as JSON response
      res.status(200).json({ count: results[0].count });
    }
  });
});

// Define a route to fetch the count of contacts
app.get("/api/contact/count", (req, res) => {
  // Query to count the number of contact messages in the 'contacts' table
  db.query("SELECT COUNT(*) AS count FROM contacts", (err, results) => {
    if (err) {
      console.error("Error fetching contact count:", err);
      res.status(500).json({ message: "Failed to fetch contact count" });
    } else {
      // Send the contact count as JSON response
      res.status(200).json({ count: results[0].count });
    }
  });
});

// Define a route to fetch the count of ministries
app.get("/api/ministry/count", (req, res) => {
  // Query to count the number of ministries in the 'ministries' table
  db.query("SELECT COUNT(*) AS count FROM ministries", (err, results) => {
    if (err) {
      console.error("Error fetching ministry count:", err);
      res.status(500).json({ message: "Failed to fetch ministry count" });
    } else {
      // Send the ministry count as JSON response
      res.status(200).json({ count: results[0].count });
    }
  });
});

// Define a route for user login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Query the admin_users table to find the user by email
  db.query(
    "SELECT * FROM admin_users WHERE username = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("Error checking user:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else if (results.length === 0) {
        // If no user with the provided email is found, return an error
        res.status(401).json({ error: "Invalid email or password" });
      } else {
        // Compare the hashed password with the provided password
        const hashedPassword = results[0].password;
        bcrypt.compare(password, hashedPassword, (err, result) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            res.status(500).json({ error: "Internal Server Error" });
          } else if (!result) {
            // If passwords don't match, return an error
            res.status(401).json({ error: "Invalid email or password" });
          } else {
            // If passwords match, login successful
            res.status(200).json({ message: "Login successful" });
          }
        });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
