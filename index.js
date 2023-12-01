const express = require('express');
const database = require('./config/dbConnection');

const app = express();
const port = 3000;

app.use((req, res, next) => {
  req.database = database;
  next();
});

app.listen(port, () => {
  console.log(`Server is Running at http://localhost:${port}`);
});
