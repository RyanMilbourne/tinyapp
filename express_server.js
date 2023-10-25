const express = require('express');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


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
  const templateVals = { urls: urlDatabase };
  res.render("urls_index", templateVals);
})

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: href = "#" };
  res.render("urls_show", templateVars);
})

app.listen(PORT, () => {
  console.log(`app listeing on port: ${PORT}`);
});