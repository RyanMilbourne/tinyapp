const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// for user login
app.post("/login", (req, res) => {
  // collect form input and assign to username
  const username = req.body.username;
  //save cookie, "Name" and "username"
  res.cookie("username", username);

  res.redirect("/urls")

})

const generateRandomString = function() {
  const char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let newString = '';

  for (let i = 0; i < 6; i++) {
    const values = Math.floor(Math.random() * char.length);
    newString += char[values];
  }

  return newString;
}

app.get("/", (req, res) => {
  res.send("hello, user!");
});

app.get("/urls.json", (req, res) => {

  res.json(urlDatabase);

});

app.get("/hello", (req, res) => {

  const templateVars = { greeting: "Hello Neo!" };

  res.render("hello_world", templateVars);
});

app.get("/urls", (req, res) => {

  const templateVals = {
    username: req.cookies["username"],
    urls: urlDatabase
  };

  res.render("urls_index", templateVals);
})

app.get("/urls/new", (req, res) => {

  const templateVals = {
    username: req.cookies["username"]
  }

  res.render("urls_new", templateVals);

});

app.get("/urls/:id", (req, res) => {

  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
})

// for generating the shortURL
app.post("/urls", (req, res) => {

  // console.log(req.body);

  const shortURL = generateRandomString();

  urlDatabase[shortURL] = req.body["longURL"];

  res.redirect(`/urls/${shortURL}`)
});

app.get("/u/:id", (req, res) => {

  const longURL = urlDatabase[req.params.id];

  res.redirect(longURL);
});

// for deleting URL
app.post("/urls/:id/delete", (req, res) => {

  delete urlDatabase[req.params.id];

  res.redirect("/urls")
})

// for updating longURL
app.post("/urls/:id", (req, res) => {

  const shortURL = req.params.id;
  const updatedURL = req.body.updatedURL;
  urlDatabase[shortURL] = updatedURL;

  res.redirect("/urls");

})

app.listen(PORT, () => {
  console.log(`app listeing on port: ${PORT}`);
});