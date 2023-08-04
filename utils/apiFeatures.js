class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // The Mongoose query object
    this.queryString = queryString; // The query string from Express (req.query)
  }

  filter() {
    const queryObj = { ...this.queryString }; // Creating a copy of the query string object
    const excludedFields = ['page', 'sort', 'limit', 'fields']; // Fields to exclude from the query filtering
    excludedFields.forEach((el) => delete queryObj[el]); // Deleting excluded fields from the query object

    //* Advanced Filtering
    let queryStr = JSON.stringify(queryObj); // Converting the query object to a JSON string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // Replacing the comparison operators with MongoDB operators

    this.query = this.query.find(JSON.parse(queryStr)); // Modifying the query object to filter based on the JSON-parsed query string

    return this; // Returning the modified APIFeatures object
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); // Parsing the 'sort' field from the query string and joining with a space
      this.query = this.query.sort(sortBy); // Sorting the query based on the parsed 'sort' field
    } else {
      this.query = this.query.sort('-createdAt'); // Sorting the query by the 'createdAt' field in descending order by default
    }
    return this; // Returning the modified APIFeatures object
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' '); // Parsing the 'fields' field from the query string and joining with a space
      this.query = this.query.select(fields); // Selecting only the specified fields in the query
    } else {
      this.query = this.query.select('-__v'); // Excluding the '__v' field from the query by default
    }
    return this; // Returning the modified APIFeatures object
  }

  paginate() {
    const page = parseInt(this.queryString.page) || 1; // Parsing the 'page' field from the query string, defaulting to 1 if not provided
    const limit = parseInt(this.queryString.limit); // Parsing the 'limit' field from the query string
    const skip = (page - 1) * limit; // Calculating the number of documents to skip based on the page and limit

    this.query = this.query.skip(skip).limit(limit); // Applying skip and limit to the query

    return this; // Returning the modified APIFeatures object
  }
}

module.exports = APIFeatures; // Exporting the APIFeatures class as a module
