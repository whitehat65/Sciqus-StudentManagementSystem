const express = require('express');
const database = require('./config/dbConnection');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const router =express.Router();

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.database = database;
  next();
});

app.use(session({
  secret: '1234',
  resave: false,
  saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('views'));

//login page route
app.get('/login',(req,res)=>{
  res.sendFile(__dirname+'/views/login.html');
});

//register page route
app.get('/register',(req,res)=>{
  res.sendFile(__dirname+'/views/register.html');
});

//for checking email Availability
app.post('/check-emailAvailability', async (req, res) => {
  const { email } = req.body;

  try {
    const result = await checkEmailAvailability(email);

    if (result.length === 0) { 
      return res.status(200).json({ status:200,message: 'Email is available' });
    } else {
      return res.status(209).json({ status:209,message: `${email} already exists` });
    }
  } catch (error) {
    console.error('Error checking email availability:', error);
    return res.status(500).json({ status:500,error: 'Internal Server error' });
  }
});

async function checkEmailAvailability(email) {
  const [rows] = await database.query('SELECT * FROM students WHERE email = ?', [email]);
  return rows;
}

//for checking username Availability
app.post('/check-userNameAvailability', async (req, res) => {
  const { username } = req.body;

  try {
    const result = await checkUserNameAvailability(username);

    if (result.length === 0) {
      return res.status(200).json({ status:200,message: 'Username is available' });
    } else {
      return res.status(209).json({ status:209,message: `${username} already exists` });
    }
  } catch (error) {
    console.error('Error checking Username availability:', error);
    return res.status(500).json({ status:500,error: 'Internal Server error' });
  }
});


async function checkUserNameAvailability(username) {
  const [rows] = await database.query('SELECT * FROM students WHERE username = ?', [username]);
  return rows;
}


// route for post of register data
app.post('/register',async (req,res)=>{
  console.log('registration method from index.js called');
  const formData=req.body;
  // console.log(formData);
  try {
    const formData = req.body;

    // Insert the formData into the "students" table
    const sql = `
      INSERT INTO students (email, username, password, fname, lname, mobile, dob, gender, address, country, education)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      formData.email,
      formData.username,
      formData.password,
      formData.fname,
      formData.lname,
      formData.mobile,
      formData.dob,
      formData.gender,
      formData.address,
      formData.country,
      formData.education,
    ];

    await database.query(sql, values);

    res.status(200).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  
});

// routes for login post method
app.post('/login', async (req, res) => {
  const formData = req.body;
  let userName = formData.username;
  let password = formData.password;

  if (!userName || !password) {
    res.sendStatus(401);
  } else {
    var sql = `SELECT * FROM students WHERE username='${userName}' OR email='${userName}' AND password='${password}';`;

    try {
      const result = await database.query(sql);

      if (result.length > 0) {
        const user = result[0];
        console.log(user);

        req.session.user = {
          userId: user[0].id,
          username: user[0].username,
          fname:user[0].fname,
          lname:user[0].lname,
          email: user[0].email,
          is_admin: user[0].is_admin,
        };
        const role=user[0].is_admin;
        // console.log(role); 
        if(role==1){
          // res.send('Admin Login successful'); 
          res.render('adminDashboard',{user:req.session.user});
        }else{
          // res.send('User Login successful'); 
          res.render('userDashboard',{user:req.session.user});
        }
      } else {
        res.status(401).send('Invalid username or password');
      }
    } catch (error) {
      console.error('Error executing SQL query:', error);
      res.sendStatus(500);
    }
  }
});


//route for admin dashboard
app.get('/adminDashboard', (req, res) => {
  res.render('adminDashboard', { user: req.session.user });
});


//route for view student
app.get('/viewStudents', (req, res) => {
  res.render('viewStudents', { user: req.session.user });
});


//route for fetch all records of student
app.get('/fetchAllStudents', async (req, res) => {
  try {
      
      const [rows, fields] = await database.query('SELECT * FROM students where is_admin=0');
      res.json({ data: rows });
  } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Route for the user dashboard
app.get('/userDashboard', (req, res) => {
  res.render('userDashboard', { user: req.session.user });
});

app.listen(port, () => {
  console.log(`Server is Running at http://localhost:${port}/login`);
});
