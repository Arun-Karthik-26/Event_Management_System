const express = require("express");
const { Pool } = require("pg");
const path=require("path");
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');

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
  const { user_name, event_name, event_date, admin_name, venue_name, catering_name, studio_name, decoration, floralArrangements, lighting, furnitureSeating } = req.body;

  let totalBill = 0;
  let billDescription = [];

  try {
    // Retrieve venue details and calculate its rate
    const venueResult = await pool.query("SELECT * FROM venue WHERE venue_name = $1", [venue_name]);
    if (venueResult.rows.length === 0) {
      console.error('Venue not found for name:', venue_name);
      return res.status(404).send('Venue not found');
    }
    const venue_rate = venueResult.rows[0].price;
    totalBill += venue_rate;
    billDescription.push(`Venue: ${venue_name} - $${venue_rate}`);

    // Retrieve studio details and calculate its rate
    const studioResult = await pool.query("SELECT * FROM studio WHERE studio_name = $1", [studio_name]);
    if (studioResult.rows.length === 0) {
      console.error('Studio not found for name:', studio_name);
      return res.status(404).send('Studio not found');
    }
    const studio_rate = studioResult.rows[0].price;
    totalBill += studio_rate;
    billDescription.push(`Studio: ${studio_name} - $${studio_rate}`);

    // Additional components with fixed rates
    if (decoration) {
      totalBill += 10000;
      billDescription.push(`Decoration - $10000`);
    }
    if (floralArrangements) {
      totalBill += 5000;
      billDescription.push(`Floral Arrangements - $5000`);
    }
    if (lighting) {
      totalBill += 20000;
      billDescription.push(`Lighting - $20000`);
    }
    if (furnitureSeating) {
      totalBill += 40000;
      billDescription.push(`Furniture & Seating - $40000`);
    }

    // Concatenate bill descriptions into a single string
    const combinedDescription = billDescription.join(', ');

    // Insert into bill table
    const billInsertResult = await pool.query(
      "INSERT INTO bill (bill_description, total, bill_date) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING bill_id",
      [combinedDescription, totalBill]
    );
    const bill_id = billInsertResult.rows[0].bill_id;

    // Retrieve catering details and get catering_id
    const cateringResult = await pool.query("SELECT catering_id FROM catering WHERE catering_name = $1", [catering_name]);
    if (cateringResult.rows.length === 0) {
      console.error('Catering not found for name:', catering_name);
      return res.status(404).send('Catering not found');
    }
    const catering_id = cateringResult.rows[0].catering_id;

    // Retrieve venue_id and studio_id
    const venue_id = venueResult.rows[0].venue_id;
    const studio_id = studioResult.rows[0].studio_id;

    // Insert into events table with retrieved bill_id
    const eventInsertResult = await pool.query(
      "INSERT INTO events (user_name, admin_name, event_name, venue_id, catering_id, studio_id, event_date, bill_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [user_name, admin_name, event_name, venue_id, catering_id, studio_id, event_date, bill_id]
    );

    const notificationHTML = `
      <div class="notification-container" id="notificationContainer">
        <div class="notification-content">
          Event Booked Successfully
        </div>
        <div class="btn">
        <button ><a href="/generatebill/${bill_id}">Generate bill</a></button>
        </div>
      </div>`;
    res.send(notificationHTML);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error booking event');
  }
});


const pdfDirectory = path.join(__dirname, 'public');

app.get('/generatebill/:bill_id', async (req, res) => {
  const billId = req.params.bill_id;

  try {
    // Fetch bill details from the database
    const query = {
      text: `
        SELECT b.bill_id, b.bill_description, b.total, b.bill_date,
               e.user_name, e.event_name, e.event_date
        FROM bill b
        JOIN events e ON b.bill_id = e.bill_id
        WHERE b.bill_id = $1
      `,
      values: [billId],
    };

    const result = await pool.query(query);
    if (result.rows.length === 0) {
      console.error('Bill not found');
      return res.status(404).send('Bill not found');
    }

    const billData = result.rows[0];

    // Create a new PDF document
    const doc = new PDFDocument();

    // Buffer to store PDF content
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);

      // Set HTTP headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bill_${billId}.pdf"`);
      res.setHeader('Content-Length', pdfData.length);

      // Send PDF data to client
      res.end(pdfData);
    });

    // Add content to the PDF document
    doc.fontSize(24).text('Bill Details', { align: 'center' }).moveDown();

    // Add bill details to the PDF
    doc.font('Helvetica-Bold').fontSize(14)
      .text(`Bill ID: ${billData.bill_id}`)
      .text(`Bill Description: ${billData.bill_description}`)
      .text(`Total: $${billData.total}`)
      .text(`Bill Date: ${billData.bill_date.toDateString()}`)
      .moveDown()
      .text('Event Details')
      .text(`User: ${billData.user_name}`)
      .text(`Event Name: ${billData.event_name}`)
      .text(`Event Date: ${billData.event_date.toDateString()}`)
      .moveDown();

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
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