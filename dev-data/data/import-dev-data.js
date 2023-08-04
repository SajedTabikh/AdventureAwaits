// Importing the necessary modules
const fs = require('fs'); // File system module for file operations
const mongoose = require('mongoose'); // MongoDB ODM library
const dotenv = require('dotenv'); // Environment variable module

// Loading environment variables from the config.env file
dotenv.config({ path: './config.env' });

// Importing the Tour model from the tourModel.js file
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

// Constructing the database connection URL with the password from environment variables
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// Connecting to the MongoDB database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('Db Connection Established');
  });

// Reading the content of the tours-simple.json file and parsing it as JSON
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// Function to import data into the database
const importData = async () => {
  try {
    await Tour.create(tours); // Creating tour documents in the database
    await User.create(users, { validateBeforeSave: false }); // Creating tour documents in the database
    await Review.create(reviews); // Creating tour documents in the database
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

// Function to delete all data from the database
const deleteData = async () => {
  try {
    await Tour.deleteMany(); // Deleting all tour documents from the database
    await User.deleteMany(); // Deleting all tour documents from the database
    await Review.deleteMany(); // Deleting all tour documents from the database
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

// Checking command line arguments to decide whether to import or delete data
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// Outputting the command line arguments
console.log(process.argv);
