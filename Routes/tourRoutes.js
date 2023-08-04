/* eslint-disable import/newline-after-import */

const express = require('express'); // Importing the Express framework
const tourController = require('./../controllers/tourController'); // Importing the tour controller
const router = express.Router(); // Creating a new router object from Express
const authController = require('./../controllers/authController'); // Importing the authentication controller
const reviewRouter = require('./../Routes/reviewRoutes');

router.use('/:tourId/reviews', reviewRouter);

// Route for '/api/v1/tours/top-5-cheap'
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);
// Route for '/api/v1/tours/tour-stats'
router.route('/tour-stats').get(tourController.getTourStats);
// Route for '/api/v1/tours/monthly-plan/:year'
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// The param middleware is specific to this route and will run whenever the 'id' parameter is present in the route

//................................................WRITE THE SAME CODE ABOVE IN ANOTHER AND EASIEST WAY (ROUTES)------------------------------------------------------//
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getTourWithin);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// Route for '/api/v1/tours' requests
router
  .route('/')
  .get(tourController.getAllTours) // GET request for retrieving all tours, with authentication
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createNewTour
  ); // POST request for creating a new tour

// Route for '/api/v1/tours/:id' requests
router
  .route('/:id')
  .get(tourController.getTour) // GET request for retrieving a specific tour
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  ) // PATCH request for updating a specific tour
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );
// DELETE request for deleting a specific tour, with authentication and role-based access control

//........................................................................................................................................................//
//
module.exports = router; // Exporting the router object as a module
