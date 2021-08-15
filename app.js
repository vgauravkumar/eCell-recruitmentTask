//jshint esversion:6
require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie:{maxAge: 24 * 60 * 60 * 1000 * 28}
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/eCellUserDB", {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  rollNumber: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/memberPage", function(req, res){
  if (req.isAuthenticated()){
    User.findOne({username: req.user.username}, function(err, foundUser) {
    if(foundUser) {
      res.render("memberPage", {name: foundUser.name, rollNumber: foundUser.rollNumber});
    } else {
      res.send("Error!!")
    }
  });
  } else {
    res.redirect("/login");
  }
});

app.post("/memberPage", function(req, res){
  if (req.isAuthenticated()){
    User.updateOne(
    {_id: req.user._id},
    {$set: {username: req.body.username, name: req.body.name, rollNumber: req.body.rollNumber}},
    function(err){
      if(!err){
        User.findOne({username: req.body.username}, function(err, foundUser) {
        if(foundUser) {
          res.render("memberPage", {name: foundUser.name, rollNumber: foundUser.rollNumber});
        } else {
          res.send({"updateSuccess": false});
          // res.send("Error!!")
        }
      });
      } else {
        res.send("Failed to update.");
        console.log(err);
      }
    }
  );
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})

app.post("/register", function(req, res){


  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
          User.updateOne(
            {_id: req.user._id},
            {$set: {username: req.body.username, name: req.body.name, rollNumber: req.body.rollNumber}},
            function(err){
              if(!err){
                res.send({
                  "success": true,
                  "message": {
                    "name": req.body.name,
                    "email": req.body.username,
                    "rollNumber": req.body.rollNumber
                  }
                })
                // res.redirect("/memberPage");
              } else {
                res.send({"success": false});
              }});
      });
    }
  });
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  req.login(user, function(err){
    if (err) {
      res.send({"success": false});
    } else {
      passport.authenticate("local")(req, res, function(){
        User.findOne({username: req.body.username}, function(err, foundUser) {
          if(foundUser) {
          res.send({
            "success": true,
            "message": {
              "name": foundUser.name,
              "email": foundUser.username,
              "rollNumber": foundUser.rollNumber
            }
          });
          } else {
            // console.log(err);
            res.send({"success": false});
          }
        });
        // res.redirect("/memberPage");
      });
    }
  })

});

app.get("/log", function(req, res){
  console.log();
})





app.listen(3000, function() {
  console.log("Server started at port 3000.");
})
