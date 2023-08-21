const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSantize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const reviewRouter = require('./Routes/reviewRoutes');
const bookingRouter = require('./Routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./Routes/viewRoutes');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

//Start express app
const app = express();

// Trust the proxy
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//! Global Middleware

//0) Implemet CORS
//Access-control-allow-origin header to everything(*)
app.use(
  cors({
    origin: 'https://checkout.stripe.com',
  })
);

app.options('*', cors());

//1) Security Http Headers
app.use(helmet()); // Using Helmet middleware to set secure HTTP headers

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'connect-src': [
        "'self'",
        'https://api.mapbox.com',
        'https://events.mapbox.com',
        'https://unpkg.com', // Add this line to allow Ionicons script
      ],
      'script-src': [
        "'self'",
        'https://api.mapbox.com',
        'https://cdnjs.cloudflare.com',
        'https://js.stripe.com',
        'https://unpkg.com', // Add this line to allow Ionicons script
        'https://kit.fontawesome.com', // Add this line for Font Awesome
        'https://events.mapbox.com',
      ],
      'worker-src': ["'self'", 'blob:'],
      'img-src': ["'self'", 'data:', 'blob:'],
      'frame-src': ["'self'", 'unsafe-inline', 'https://js.stripe.com/'],
    },
  })
);

//2) Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//3) Limit request for same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

//4) Body Parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data Sanitization against NoSQL query injection
app.use(mongoSantize());

// Data Sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//5) Serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(compression());

// Custom middleware that runs for all routes

app.use((req, res, next) => {
  // console.log('Custom Middleware Executed');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

//! ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Catch-all route handler for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//! BUILD A GLOBAL ERROR HANDLING MIDDLEWARE WITH EXPRESS
// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
