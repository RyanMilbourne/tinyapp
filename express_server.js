// npm innit
// npm install express cookie-parser morgan ejs bcryptjs cookie-session

////////////////////////////////////////////////////////////////////////////////
/////////// Requires / Packages
////////////////////////////////////////////////////////////////////////////////

const express = require('express');
const cookieSession = require('cookie-session');
// const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { cookie } = require('request');
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

// app.use(cookieParser());

app.use(cookieSession({
  name: "user_id",
  keys: ["this-is-a-secret-key"],
  maxAge: 24 * 60 * 60 * 1000
}))

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
  adminTest: {
    longURL: "admin-Long-URL",
    userID: "admin"
  }
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

// default page reroute to urls index
app.get("/", (req, res) => {

  res.redirect(`/urls`);

});

// register page
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;

  if (user_id) {
    return res.redirect("/urls");
  } else {
    const templateVars = {
      user: null
    };
    res.render("register", templateVars);
  }

});

// register submission
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email || !password) {
    return res.status(400).send("provide email/password");
  } else if (getUserByEmail(users, email)) {
    return res.status(400).send("email already in use");
  }
  const id = generateRandomString();
  const user = {
    id, email, hashedPassword
  };
  users[id] = {
    id, email, hashedPassword
  };

  req.session.user_id = user.id; // set the cookie
  res.redirect('/urls');

});

// login page
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

// login submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = getUserByEmail(users, email);

  if (!user) {
    return res.status(403).send("account does not exist in our database");
  } else {
    if (!bcrypt.compareSync(password, hashedPassword)) {
      return res.status(403).send("username or password invalid.");
    } else {
      req.session.user_id = user.id;
      res.redirect('/urls');
    }
  }
});

// logout request
app.post("/logout", (req, res) => {

  req.session.user_id = null;
  req.session = null;
  res.redirect("/login");

});


app.get("/urls.json", (req, res) => {

  res.json(urlDatabase);

});

// urls index page
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id) {
    return res.status(401).send("You must be logged in to create a tinyUrl");
  } else {
    console.log("USER ID in get urls", user_id);
    const userUrls = urlsForUser(user_id);
    const user = users[user_id];
    const templateVals = {
      user,
      urls: userUrls
    };
    res.render("urls_index", templateVals);
  }

});

// create new urls page
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];

  if (!user_id) {
    res.redirect('/login')
    return res.status(400).send("Please login");
  } else if (user.id !== req.session.user_id) {
    return res.status(400).send("invalid user");
  } else {
    const templateVals = {
      user,
      urls: urlDatabase
    };
    res.render("urls_new", templateVals);
  }
});

// shortURL page
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const userUrls = urlsForUser(user_id);
  const user = users[user_id];

  if (!user_id) {
    return res.status(400).send("Please login");
  } else if (user.id !== req.session.user_id) {
    return res.status(400).send("invalid user");
  } else if (urlDatabase[req.params.id].userID !== user_id) {
    res.status(400).send("The url does not belong to you")
  } else {
    const templateVars = {
      user,
      id: req.params.id,
      longURL: userUrls[req.params.id].longURL
    };
    res.render("urls_show", templateVars);
  }
});

// urls index manage & requests (edit / delete)
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id) {
    return res.status(401).send("You must be logged in to manage tinyUrls");
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body["longURL"], userID: user_id };
    res.redirect(`/urls/${shortURL}`);
  }

});

// shortURL link
app.get("/u/:id", (req, res) => {
  // const user_id = req.cookies["user_id"];
  const user_id = req.session.user_id;
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;

  if (!longURL) {
    return res.status(404).send("This tinyUrl does not exist");
  }

  res.redirect(longURL);

});

// shortURL delete request
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];

  if (!user_id) {
    return res.status(400).send("Please login");
  } else if (user.id !== req.session.user_id) {
    return res.status(400).send("invalid user");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }

});

// shortURL manage & requests
app.post("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  const shortURL = req.params.id;
  const updatedURL = req.body.updatedURL;
  urlDatabase[shortURL].longURL = updatedURL;

  if (user_id !== req.session.user_id) {
    return res.status(400).send("Please login");
  } else if (user.id !== req.session.user_id) {
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