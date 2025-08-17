// utils/response.js
export const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data, // always under `data`
  });
};

export const errorResponse = (res, message, statusCode = 500, data = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data, // frontend can still read extra info if needed
  });
};
