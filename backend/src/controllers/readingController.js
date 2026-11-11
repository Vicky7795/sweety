const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
} = require('../services/readingService');
const { successResponse } = require('../utils/responseUtils');

async function create(req, res, next) {
  try {
    const reading = await createReading(req.user.id, req.body);
    return successResponse(
      res,
      'Glucose reading created successfully',
      reading,
      201
    );
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { page, limit, date } = req.query;
    const result = await getReadings(req.user.id, { page, limit, date });
    return successResponse(
      res,
      'Glucose readings retrieved successfully',
      result,
      200
    );
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const readingId = parseInt(req.params.id, 10);
    if (isNaN(readingId)) {
      const err = new Error('Invalid reading ID.');
      err.statusCode = 400;
      throw err;
    }
    const reading = await getReadingById(req.user.id, readingId);
    return successResponse(
      res,
      'Glucose reading retrieved successfully',
      reading,
      200
    );
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const readingId = parseInt(req.params.id, 10);
    if (isNaN(readingId)) {
      const err = new Error('Invalid reading ID.');
      err.statusCode = 400;
      throw err;
    }
    const updated = await updateReading(req.user.id, readingId, req.body);
    return successResponse(
      res,
      'Glucose reading updated successfully',
      updated,
      200
    );
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const readingId = parseInt(req.params.id, 10);
    if (isNaN(readingId)) {
      const err = new Error('Invalid reading ID.');
      err.statusCode = 400;
      throw err;
    }
    const deleted = await deleteReading(req.user.id, readingId);
    return successResponse(
      res,
      'Glucose reading deleted successfully',
      deleted,
      200
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove
};
