function sendSuccess(res, message = 'OK', data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...data
  });
}

function sendError(res, message = 'Request failed', statusCode = 500, data = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    data
  });
}

module.exports = { sendSuccess, sendError };
