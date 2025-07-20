const { v4: uuidv4 } = require('uuid');

const generateId = (length = 32) => {
  if (length <= 32) {
    return uuidv4().replace(/-/g, '').substring(0, length);
  }
  return uuidv4().replace(/-/g, '');
};

module.exports = generateId; 