const { v4: uuidv4 } = require('uuid');

function generateSecureGroupId() {
  const uuid = uuidv4().replace(/-/g, '');
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const groupId = (uuid.substring(0, 8) + timestamp + randomPart).toLowerCase();
  return groupId;
}

function generateUserId() {
  return uuidv4().substring(0, 8);
}

function generateGiftId() {
  return uuidv4().substring(0, 8);
}

function sendResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

function sendError(statusCode, message) {
  return sendResponse(statusCode, { error: message });
}

module.exports = {
  generateSecureGroupId,
  generateUserId,
  generateGiftId,
  sendResponse,
  sendError,
};
