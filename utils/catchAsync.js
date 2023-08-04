//! Haydi el function cha8leta ta3mel catch lal error bi 7aket ek asyc fubction metel el create tour
module.exports = (fn) => {
  // Export a function that accepts another function as an argument
  return (req, res, next) => {
    // Return a new function that takes req, res, and next as parameters
    fn(req, res, next).catch(next); // Call the provided function with req, res, and next, and catch any errors
  };
};
