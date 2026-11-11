const {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport
} = require('../services/reportService');
const { successResponse } = require('../utils/responseUtils');

async function daily(req, res, next) {
  try {
    const { date } = req.query;
    const report = await getDailyReport(req.user.id, date);
    return successResponse(
      res,
      'Daily glucose report retrieved successfully',
      report,
      200
    );
  } catch (err) {
    next(err);
  }
}

async function monthToDate(req, res, next) {
  try {
    const { date } = req.query;
    const report = await getMonthToDateReport(req.user.id, date);
    return successResponse(
      res,
      'Month-to-date glucose report retrieved successfully',
      report,
      200
    );
  } catch (err) {
    next(err);
  }
}

async function monthly(req, res, next) {
  try {
    const { date } = req.query;
    const report = await getMonthlyReport(req.user.id, date);
    return successResponse(
      res,
      'Previous month glucose report retrieved successfully',
      report,
      200
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  daily,
  monthToDate,
  monthly
};
