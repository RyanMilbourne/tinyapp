const getUserByEmail = function(database, email) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }

  return null;

};

const generateRandomString = function() {
  const char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let newString = '';

  for (let i = 0; i < 6; i++) {
    const values = Math.floor(Math.random() * char.length);
    newString += char[values];
  }

  return newString;
};


module.exports = { getUserByEmail, generateRandomString };