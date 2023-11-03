const getUserByEmail = function(database, email) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }

  return null;

};

module.exports = { getUserByEmail };