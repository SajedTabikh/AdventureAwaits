const Tour = require('./../models/tourModel'); // Importing the tourModel module
const catchAsync = require('../utils/catchAsync'); // Importing the catchAsync module
const AppError = require('../utils/AppError'); // Importing the AppError module
const factory = require('./handlerFactory'); // Importing the factory
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(new AppError('Not an image, please upload only images!!!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  // 1) Proccessing cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Other Images
  req.body.images = await Promise.all(
    req.files.images.map(async (file, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      return filename;
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  // Middleware function to modify query parameters for fetching top tours
  req.query.limit = '5'; // Set query limit to 5
  req.query.sort = '-ratingsAverage,price'; // Sort by ratingsAverage (descending) and price
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty'; // Select specific fields
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.createNewTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  // Get tour statistics
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, // Match tours with ratingsAverage greater than or equal to 4.5
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // Group tours by difficulty
        numTours: { $sum: 1 }, // Count the number of tours in each group
        numRatings: { $sum: '$ratingsQuantity' }, // Calculate the sum of ratingsQuantity in each group
        avgRating: { $avg: '$ratingsAverage' }, // Calculate the average ratingsAverage in each group
        avgPrice: { $avg: '$price' }, // Calculate the average price in each group
        minPrice: { $min: '$price' }, // Get the minimum price in each group
        maxPrice: { $max: '$price' }, // Get the maximum price in each group
      },
    },
    {
      $sort: { avgPrice: 1 }, // Sort the result by average price in ascending order
    },
  ]); // Perform aggregation on tours to get statistics

  res.status(200).json({
    status: 'Success',
    data: {
      stats: stats, // Send response with the tour statistics
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // Get monthly plan
  const year = parseInt(req.params.year, 10); // Parse the year from the request parameters
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // Unwind the startDates array to get each start date as a separate document
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), // Match startDates greater than or equal to the start of the year
          $lte: new Date(`${year}-12-31`), // Match startDates less than or equal to the end of the year
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // Group tours by month based on the startDates
        numTourStarts: { $sum: 1 }, // Count the number of tour starts
        tours: { $push: '$name' }, // Collect the names of tours in an array
      },
    },
    {
      $addFields: { month: '$_id' }, // Add a new field 'month' with the value of '_id'
    },
    {
      $project: { _id: 0 }, // Remove the '_id' field from the projection
    },
    {
      $sort: { numTourStarts: -1 }, // Sort the result based on the number of tour starts in descending order
    },
  ]); // Aggregate the tours to get the monthly plan

  res.status(200).json({
    status: 'Success',
    data: {
      plan: plan, // Send response with the monthly plan
    },
  });
});

exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng'), 400);
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'Success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng'), 400);
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      data: distances,
    },
  });
});
