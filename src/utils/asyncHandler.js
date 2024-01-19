// First Approach using Try Catch

// const asyncHandler = (requestHandler) => async (req, res, next) => {
//   try {
//     requestHandler(req, res, next);
//   } catch (error) {
//     res.status(err.status || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// Second Approach Using Promises

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
