const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const APIFeatures = require('./../utils/apiFeatures'); // Importing the apiFeatures module

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Delete a tour by ID
    const doc = await Model.findByIdAndDelete(req.params.id, {
      strict: true,
    }); // Delete tour by ID
    if (!doc) {
      return next(new AppError('No document found with that ID', 404)); // Handle case when tour is not found
    }
    res.status(204).json({
      status: 'Success',
      data: {
        message: 'Delete Successfully', // Send success message in response
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Update a tour by ID
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }); // Update tour with request body
    if (!doc) {
      return next(new AppError('No document found with that ID', 404)); // Handle case when tour is not found
    }
    res.status(200).json({
      status: 'Success',
      data: {
        data: doc, // Send response with updated tour data
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Create a new tour
    const newDoc = await Model.create(req.body); // Create tour using request body

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc, // Send response with newly created tour
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;

    if (!doc) {
      return next(new AppError('Invalid ID: Document not found', 400));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); // Apply filtering, sorting, field limiting, and pagination
    const doc = await features.query; // Execute the query
    // const doc = await features.query.explain(); // Execute the query

    res.status(200).json({
      status: 'Success',
      results: doc.length,
      data: {
        data: doc, // Send response with tour data
      },
    });
  });
