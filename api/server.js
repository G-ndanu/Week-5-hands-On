const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Initializing app to start working
app.use(express.json());
app.use(cors());
dotenv.config();

app.get('/', (req, res) => {
   res.send("Hello, World!");
});

const db = mysql.createConnection({
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD
});

db.connect((err) => {
   if (err) return console.error("Error connecting to MySQL:", err.message);

   console.log("Successfully connected to MySQL: ", db.threadId);

   // Create a database
   db.query(`CREATE DATABASE IF NOT EXISTS expense_tracker`, (err, result) => {
      if (err) return console.error("Error creating database:", err.message);

      console.log("Database expense_tracker created/checked");

      // Use the database
      db.query(`USE expense_tracker`, (err) => {
         if (err) return console.error("Error selecting database:", err.message);

         // Create users table
         const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
               id INT AUTO_INCREMENT PRIMARY KEY,
               email VARCHAR(100) NOT NULL UNIQUE,
               username VARCHAR(50) NOT NULL,
               password VARCHAR(255) NOT NULL
            )
         `;

         db.query(createUsersTable, (err, result) => {
            if (err) return console.error("Error creating table:", err.message);

            console.log("Users table checked/created");
         });
      });
   });
});

//user registration route
app.post('/api/register', async(req, res) => {
   try{
      const users = `SELECT * FROM users WHERE email = ?`

      db.query(users, [req.body.email], (err, data) => {
         if(data.length) return res.status(409).json("User already exists")
         
         const salt = bcrypt.genSaltSync(10);
         const hashedPassword = bcrypt.hashSync(req.body.password, salt)
      
         const createUser = `INSERT INTO users(email, username, password) VALUES (?)`
         value = [
            req.body.email,
            req.body.username,
            hashedPassword
         ]

         //insert user in db
         db.query(createUser, [value], (err, data) => {
            if(err) res.status(500).json("Something went wrong")

            return res.status(200).json("User created successfully");
         })
      })

      
   } catch(err) {
      res.status(500).json("Internal Server Error")
   }
})


//user login route
app.post('/api/login', async(req, res) => {
   try {
      const users = `SELECT * FROM users WHERE email = ?`

      db.query(users, [req.body.email], (err, data) => {
         if(data.length === 0) return res.status(404).json("User not found")

         //check if password is valid
         const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password)

         if(!isPasswordValid) return res.status(400).json("Invalid email or password")

         return res.status(200).json("Login successful")
      })
      
   } catch (err) {
      res.status(500).json("Internal Server Error")
      
   }
})




// Ensuring back-end is running
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

 