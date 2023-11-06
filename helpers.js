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

const urlsForUser = function(id, urlDatabase) {
  let urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };