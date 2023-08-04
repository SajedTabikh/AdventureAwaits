// Import the required modules
const mongoose = require('mongoose'); // Object modeling tool for MongoDB
const dotenv = require('dotenv'); // Load environment variables

//! npm i dotenv

// Load environment variables from the config.env file
dotenv.config({ path: './config.env' });

// console.log(process.env.NODE_ENV);
// Import the app module
const app = require('./app');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT REJECTION ERROR');
  console.log(err.name, err.message);
});

// Build the database connection string using environment variables
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// Connect to the MongoDB database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('Db Connection Established');
  });

//! START THE SERVER

// Get the port from environment variables
const port = process.env.PORT;

// Start the server and listen on the specified port
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION ERROR');
  console.log(err.name, err.message);

  // Close the server and exit the process with an error code
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED SHUTTING DOWN ');
  server.close(() => {
    console.log('Process terminated');
  });
});
