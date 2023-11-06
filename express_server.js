// npm init
// npm install express ejs bcryptjs cookie-session mocha chai

////////////////////////////////////////////////////////////////////////////////
/////////// Requires / Packages
////////////////////////////////////////////////////////////////////////////////

const express = require('express');
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');
const bcrypt = require('bcryptjs');

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

app.use(cookieSession({
  name: "user_id",
  keys: ["this-is-a-not-so-secret-key"],
  maxAge: 24 * 60 * 60 * 1000
}));

////////////////////////////////////////////////////////////////////////////////
/////////// "Database"
////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {};

const database = {};

////////////////////////////////////////////////////////////////////////////////
/////////// Routes
////////////////////////////////////////////////////////////////////////////////

/*
 default page reroute to urls index
 * */
app.get("/", (req, res) => {

  res.redirect(`/login`);

});

/*
 register page
 */
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;

  if (user_id) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: null
  };

  res.render("register", templateVars);

});

/*
 register submission
 */
app.post("/register", (req, res) => {
  const email = req.body.email;
  const inputedPassword = req.body.password;

  if (!inputedPassword) {
    return res.status(400).send("provide a password");
  }

  const password = bcrypt.hashSync(inputedPassword, 10);

  if (!email || !password) {
    return res.status(400).send("provide email/password");
  } else if (getUserByEmail(database, email)) {
    return res.status(400).send("email already in use");
  }

  const id = generateRandomString();

  const user = {
    id, email, password
  };

  database[id] = user;

  req.session.user_id = user.id;
  res.redirect('/urls');

});

/*
 login page
 */
app.get('/login', (req, res) => {
  const templateVars = {};
  const user_id = req.session.user_id;

  if (user_id) {
    res.redirect("/urls");
  } else {
    templateVars.user = null;
    res.render('login', templateVars);
  }

});

/*
 login submission
 */
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("please enter a valid username & password");
  }

  const user = getUserByEmail(database, email);

  if (!user) {
    return res.status(403).send("account does not exist in our database");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("username or password invalid.");
  }

  req.session.user_id = user.id;
  res.redirect('/urls');

});

/*
 logout request
 */
app.post("/logout", (req, res) => {

  req.session.user_id = null;
  req.session = null;
  res.redirect("/login");

});

/*
urls index page
 */
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.status(401).send("You must be logged in to create a tinyUrl");
  }

  const user = database[user_id];
  if (!user) {
    return res.status(403).send("Access denied");
  }

  const userUrls = urlsForUser(user_id, urlDatabase);

  const templateVals = {
    user,
    urls: userUrls
  };

  res.render("urls_index", templateVals);

});

/*
 create new urls page
 */
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.redirect('/login');
  }

  const user = database[user_id];
  if (!user) {
    return res.status(403).send("Access denied");
  }

  if (user.id !== req.session.user_id) {
    return res.status(400).send("invalid user");
  }

  const templateVals = {
    user,
    urls: urlDatabase
  };

  res.render("urls_new", templateVals);

});

/*
 shortURL page
 */
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.status(400).send("Please login");
  }

  const user = database[user_id];
  if (!user) {
    return res.status(403).send("Access denied");
  }

  const id = req.params.id;
  if (!id) {
    return res.status(404).send("This tinyUrl does not exist");
  }

  const userUrls = urlsForUser(user_id, urlDatabase);
  if (!userUrls[id]) {
    return res.status(404).send("tinyURL does not exist");
  }

  const longURL = userUrls[id].longURL;
  if (!urlDatabase[id].longURL) {
    return res.status(403).send("Access denied");
  }

  if (user.id !== user_id || urlDatabase[id].userID !== user_id) {
    return res.status(403).send("Access denied");
  }

  const templateVars = {
    user,
    id,
    longURL
  };

  res.render("urls_show", templateVars);

});

/*
urls index manage & requests (edit / delete)
 */
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.status(401).send("You must be logged in to manage tinyUrls");
  }

  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL: req.body["longURL"], userID: user_id };

  res.redirect(`/urls`);

});

/*
 shortURL link
 */
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!shortURL || !urlDatabase[shortURL]) {
    return res.status(404).send("This tinyUrl does not exist");
  }

  const longURL = urlDatabase[shortURL].longURL;
  if (!longURL) {
    return res.status(404).send("This tinyUrl does not exist");
  }

  res.redirect(longURL);

});

/*
shortURL delete request
 */
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.status(400).send("Please login");
  }

  const id = req.params.id;
  if (!id) {
    return res.status(404).send("This tinyUrl does not exist");
  }

  const user = database[user_id];
  if (!user) {
    return res.status(403).send("Access denied");
  }

  if (user.id !== user_id) {
    return res.status(400).send("invalid user");
  }

  delete urlDatabase[id];

  res.redirect("/urls");

});

/*
 shortURL manage & requests
 */
app.post("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.status(400).send("Please login");
  }

  const user = database[user_id];
  if (!user) {
    return res.status(403).send("Access denied");
  }

  if (user.id !== user_id) {
    return res.status(400).send("invalid user");
  }

  const shortURL = req.params.id;
  const updatedURL = req.body.updatedURL;

  urlDatabase[shortURL].longURL = updatedURL;

  res.redirect("/urls");

});

////////////////////////////////////////////////////////////////////////////////
/////////// Listen
////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`app listeing on port: ${PORT}`);
});