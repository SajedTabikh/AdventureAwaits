const mongoose = require('mongoose'); // Importing Mongoose library
const slugify = require('slugify'); // Importing slugify library
// const User = require('./userModel');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must be created'], // Required field for the tour name
      unique: true, // The tour name must be unique
      trim: true, // Trim whitespace from the beginning and end of the name
      maxlength: [40, 'The name must be less than 40 characters'], // Maximum length for the name
      minlength: [10, 'The name must have at least 10 characters'], // Minimum length for the name
    },
    slug: String, // Slugified version of the tour name

    duration: {
      type: Number,
      required: [true, 'A tour must have duration'], // Required field for the tour duration
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'], // Required field for the maximum group size
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'], // Required field for the tour difficulty
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A tour must be either easy, medium, or difficult', // Enum values for difficulty
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5, // Default value for average ratings
      min: [1, 'Average must be more or equal to 1'], // Minimum value for average ratings
      max: [5, 'Average must be less or equal to 5'], // Maximum value for average ratings
      set: function (val) {
        return parseFloat(val.toFixed(1));
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0, // Default value for ratings quantity
    },
    price: {
      type: Number,
      required: [true, 'A price must be created'], // Required field for the tour price
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price; // Custom validator to check if the discount is less than the price
        },
        message: 'The discount ({VALUE}) must be less than the price', // Error message for the validation
      },
    },
    summary: {
      type: String,
      trim: true, // Trim whitespace from the beginning and end of the summary
    },
    description: {
      type: String,
      trim: true, // Trim whitespace from the beginning and end of the description
      required: [false, 'A description must be created'], // Optional field for the tour description
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'], // Required field for the tour cover image
    },
    images: [String], // Array of strings for additional images
    createdAt: {
      type: Date,
      default: Date.now(), // Default value for the creation date
      select: false, // Exclude this field from query results
    },
    startDates: [Date], // Array of dates for tour start dates

    secretTour: {
      type: Boolean,
      default: false, // Default value for secret tour status
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], //ref:User mean a refference to another Model
  },
  {
    toJSON: { virtuals: true }, // Include virtual properties in JSON output
    toObject: { virtuals: true }, // Include virtual properties in regular object output
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; // Calculate duration in weeks using a virtual property
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document middleware - runs before .save() and .create() calls
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // Generate a slug from the tour name
  next();
});

// Query middleware - runs before 'find' operations
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // Exclude secret tours from queries

  this.start = Date.now(); // Track the start time of the query
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // Exclude secret tours from aggregations

//   console.log(this.pipeline()); // Log the aggregation pipeline
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema); // Create the Tour model

module.exports = Tour; // Export the Tour model as a module
