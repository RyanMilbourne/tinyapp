// npm innit
// npm install express cookie-parser morgan ejs

////////////////////////////////////////////////////////////////////////////////
/////////// Requires / Packages
////////////////////////////////////////////////////////////////////////////////

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { cookie } = require('request');

////////////////////////////////////////////////////////////////////////////////
/////////// Setup / Config
////////////////////////////////////////////////////////////////////////////////

const app = express();
const PORT = 8080;

////////////////////////////////////////////////////////////////////////////////
/////////// Middleware
////////////////////////////////////////////////////////////////////////////////

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

////////////////////////////////////////////////////////////////////////////////
/////////// "Database"
////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  admin: {
    id: "admin",
    email: "admin@admin.com",
    password: "admin"
  }
};

////////////////////////////////////////////////////////////////////////////////
/////////// Functions
////////////////////////////////////////////////////////////////////////////////

const generateRandomString = function() {
  const char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let newString = '';

  for (let i = 0; i < 6; i++) {
    const values = Math.floor(Math.random() * char.length);
    newString += char[values];
  }

  return newString;
};

const getUserByEmail = function(users, email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }

  return null;

};

const urlsForUser = function(id) {
  let urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
};

////////////////////////////////////////////////////////////////////////////////
/////////// Routes
////////////////////////////////////////////////////////////////////////////////

app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  if (user_id) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: null
  };

  if (user_id) {
    res.redirect('/urls')
  }

  res.render("register", templateVars);

});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("provide email/password");
  }

  if (getUserByEmail(users, email)) {
    return res.status(400).send("email already in use");
  }

  const id = generateRandomString();

  users[id] = {
    id, email, password
  };

  res.cookie("user_id", id);
  res.redirect('/urls');

});

app.get('/login', (req, res) => {
  const templateVars = {};

  const user_id = req.cookies["user_id"];

  if (user_id) {
    const user = users[user_id];
    templateVars.user = user;
  } else {
    templateVars.user = null;
  }

  if (user_id) {
    res.redirect('/urls')
  }

  res.render('login', templateVars);

});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = getUserByEmail(users, email);

  if (!user) {
    return res.status(403).send("account does not exist in our database");
  }

  if (user.password !== password) {
    return res.status(403).send("invalid password");
  }
  console.log("Testing POST /login ", user);
  res.cookie("user_id", user.id);
  res.redirect('/urls');

});

app.post("/logout", (req, res) => {

  res.clearCookie('user_id');
  res.redirect("/login");

});

app.get("/", (req, res) => {

  res.redirect(`/urls`);

});

app.get("/urls.json", (req, res) => {

  res.json(urlDatabase);

});

app.get("/hello", (req, res) => {

  const templateVars = { greeting: "Hello Neo!" };

  res.render("hello_world", templateVars);

});

app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  const userUrls = urlsForUser(user_id);

  if (!user_id) {
    return res.status(401).send("You must be logged in to create a tinyUrl");
  }

  const user = users[user_id];
  if (!user) {
    return res.status(400).send("invalid user");
  }

  const templateVals = {
    user,
    urls: userUrls
  };

  res.render("urls_index", templateVals);

});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  if (!user_id) {
    res.redirect('/login')
    return res.status(400).send("Please login");
  }

  const user = users[user_id];

  if (!user) {
    return res.status(400).send("invalid user");
  }

  const templateVals = {
    user,
    urls: urlDatabase
  };

  res.render("urls_new", templateVals);

});

app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies["user_id"];
  const userUrls = urlsForUser(user_id);
  const user = users[user_id];

  if (!user_id) {
    return res.status(400).send("Please login");
  }

  if (!user) {
    return res.status(400).send("invalid user");
  }

  if (urlDatabase[req.params.id].userID !== user_id) {
    res.status(400).send("The url does not belong to you")
  }

  const templateVars = {
    user,
    id: req.params.id,
    longURL: userUrls[req.params.id].longURL
  };

  res.render("urls_show", templateVars);

});

app.post("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];

  if (!user_id) {
    return res.status(401).send("You must be logged in to manage tinyUrls");
  }

  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL: req.body["longURL"], userID: user_id };

  res.redirect(`/urls/${shortURL}`);

});

app.get("/u/:id", (req, res) => {
  const user_id = req.cookies["user_id"];
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;

  if (!longURL) {
    return res.status(404).send("This tinyUrl does not exist");
  }

  res.redirect(longURL);

});

app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];

  if (!user_id) {
    return res.status(400).send("Please login");
  }

  if (!user) {
    return res.status(400).send("invalid user");
  }

  delete urlDatabase[req.params.id];

  res.redirect("/urls");

});

app.post("/urls/:id", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const shortURL = req.params.id;
  const updatedURL = req.body.updatedURL;
  urlDatabase[shortURL].longURL = updatedURL;

  if (!user_id) {
    return res.status(400).send("Please login");
  }

  if (!user) {
    return res.status(400).send("invalid user");
  }
  res.redirect("/urls");

});

////////////////////////////////////////////////////////////////////////////////
/////////// Listen
////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`app listeing on port: ${PORT}`);
});