const { errorResponse } = require('../utils/responseUtils');
const { formatDateString, isFutureDate } = require('../utils/dateUtils');

const ALLOWED_TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

function validateReadingInput(req, res, next) {
  const { reading_date, time_slot, glucose_value } = req.body;

  // RULE 1: Value is required
  if (glucose_value === undefined || glucose_value === null || glucose_value === '') {
    return errorResponse(res, 'Please enter a glucose value.', 400);
  }

  // RULE 2: Value must be a whole number between 40 and 600
  // Reject decimals, negative numbers, non-numeric values
  const numValue = Number(glucose_value);
  const isWholeNumber = Number.isInteger(numValue) && !String(glucose_value).includes('.');

  if (isNaN(numValue) || !isWholeNumber || numValue < 40 || numValue > 600) {
    return errorResponse(res, 'Value must be between 40 and 600 mg/dl.', 400);
  }

  // Time slot validation
  if (!time_slot || typeof time_slot !== 'string') {
    return errorResponse(res, 'Time slot is required.', 400);
  }

  if (!ALLOWED_TIME_SLOTS.includes(time_slot.trim())) {
    return errorResponse(
      res,
      `Invalid time slot. Allowed slots: ${ALLOWED_TIME_SLOTS.join(', ')}`,
      400
    );
  }

  // Date validation
  if (!reading_date) {
    return errorResponse(res, 'Reading date is required.', 400);
  }

  const formattedDate = formatDateString(reading_date);
  if (!formattedDate || isNaN(new Date(formattedDate).getTime())) {
    return errorResponse(res, 'Please enter a valid date in YYYY-MM-DD format.', 400);
  }

  // RULE 5: Date cannot be in the future
  if (isFutureDate(formattedDate)) {
    return errorResponse(res, 'Date cannot be in the future.', 400);
  }

  // Normalized values attached to body
  req.body.reading_date = formattedDate;
  req.body.time_slot = time_slot.trim();
  req.body.glucose_value = numValue;

  next();
}

module.exports = {
  ALLOWED_TIME_SLOTS,
  validateReadingInput
};
