/**
 * Standardized API response helpers
 * Shape: { success: boolean, data?: any, message?: string, meta?: object, error?: object }
 */

const success = (res, data, message = 'Success', statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    meta
  });
};

const error = (res, message = 'Internal Server Error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      statusCode
    }
  };
  if (details) {
    response.error.details = details;
  }
  return res.status(statusCode).json(response);
};

const paginate = (res, data, page, limit, total, message = 'Success') => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.max(1, parseInt(limit, 10) || 20);
  const totalPages = Math.ceil(total / perPage) || 1;

  return success(res, data, message, 200, {
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    }
  });
};

module.exports = {
  success,
  error,
  paginate
};
