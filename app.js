const express = require("express");
const { Pool } = require("pg");
const path=require("path");
const bodyParser = require('body-parser');

const app = express();
const port = 1818;

app.use(express.static(path.join(__dirname, 'public')));app.use(bodyParser.json());
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Event_Management",
  password: "1234",
  port: 5432,
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

pool.connect((err) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("connected");
});

app.post("/register", async (req, res) => {
  const { user_name, name, email, phone, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE user_name = $1", [user_name]);
    if (existingUser.rows.length > 0) 
      {
      const notificationHTML = `
      <div class="notification-container" id="notificationContainer">
        <div class="notification-icon">
          <span class="wrong-icon">&times;</span>
        </div>
        <div class="notification-content">
          User name already exists
        </div>
        <div class="close-icon" id="closeButton">
          <span>&times;</span>
        </div>
      </div>`;
     res.send(notificationHTML);    
    }

    await pool.query("INSERT INTO users (user_name, name, email, phone, password) VALUES ($1, $2, $3, $4, $5)", [user_name, name, email, phone, password]);

    // Redirect to login page with success message
    res.redirect("/login_success.html");
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Error registering user");
  }
});


app.get("/user", (req, res) => {
  res.sendFile(__dirname + "/user.html");
});

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/admin.html");
});

app.get("/book", (req, res) => {
  res.sendFile(__dirname + "/book.html");
});

app.post('/loginuser', async (req, res) => {
  const { user_name, password } = req.body;
  console.log({ user_name, password });
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_name = $1 and password=$2', [user_name, password]);
    if (result.rows.length > 0)
      {
      res.redirect('/user');
      }
    else {
      const notificationHTML = `
      <div class="notification-container" id="notificationContainer">
        <div class="notification-icon">
          <span class="wrong-icon">&times;</span>
        </div>
        <div class="notification-content">
          Invalid credentials
        </div>
        <div class="close-icon" id="closeButton">
          <span>&times;</span>
        </div>
      </div>`;
    res.send(notificationHTML);
    }
  }

  catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error checking credentials');
  }
});

app.post('/loginadmin', async (req, res) => {
  const { user_name, password } = req.body;
  console.log({ user_name, password });
  try {
    const result = await pool.query('SELECT * FROM admin WHERE user_name = $1 and password=$2', [user_name, password]);
    if (result.rows.length > 0)
      // Redirect to success page for admin
      res.redirect('/login_success.html');
    else
    {
    const notificationHTML = `
    <div class="notification-container" id="notificationContainer">
      <div class="notification-icon">
        <span class="wrong-icon">&times;</span>
      </div>
      <div class="notification-content">
        Invalid credentials admin
      </div>
      <div class="close-icon" id="closeButton">
        <span>&times;</span>
      </div>
    </div>`;
  res.send(notificationHTML);
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error checking credentials');
  }
});

app.post('/bookevent', async (req, res) => {
  const { user_name, admin_name, event_name, venue_name, catering_name, studio_name, event_date } = req.body;

  try {
    // Retrieve IDs based on the names
    const venue_id = await pool.query("SELECT venue_id FROM venues WHERE venue_name = $1", [venue_name]);
    const catering_id = await pool.query("SELECT catering_id FROM catering WHERE catering_name = $1", [catering_name]);
    const studio_id = await pool.query("SELECT studio_id FROM studio WHERE studio_name = $1", [studio_name]);



    // Insert into events table
    await pool.query(
      "INSERT INTO events (user_name, admin_name, event_name, venue_id, catering_id, studio_id, event_date) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [user_name, admin_name, event_name, venue_id, catering_id, studio_id, event_date]
    );

    res.send('Event booked successfully!');
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error booking event');
  }
});


app.get("/venues", async (req, res) => {
  try {
    const venues = await pool.query('SELECT * FROM venue');
    res.json(venues.rows);
    console.log(venues.rows);
  } catch (err) {
    console.error("Error fetching venues", err.stack);
    res.status(500).json({ error: "Error fetching venues" });
  }
});

app.get("/catering", async (req, res) => {
  try {
    const catering = await pool.query('SELECT * FROM catering');
    res.json(catering.rows);
    console.log(catering.rows);
  } catch (err) {
    console.error("Error fetching venues", err.stack);
    res.status(500).json({ error: "Error fetching venues" });
  }
});

app.get("/studio", async (req, res) => {
  try {
    const studio = await pool.query('SELECT * FROM studio');
    res.json(studio.rows);
    console.log(studio.rows);
  } catch (err) {
    console.error("Error fetching venues", err.stack);
    res.status(500).json({ error: "Error fetching venues" });
  }
});
