const express = require("express");
const passport = require("passport");
const router = express.Router({ mergeParams: true }); // mergeParams explained in lec 490
const User = require('../models/user')
const catchAsync = require("../utils/catchAsync")
const users = require('../controllers/users')

router.get('/register', users.renderRegister)

router.post('/register', catchAsync(users.register))

router.get('/login', users.renderLogin)

//passport give us a middleware passport.authenticate
// failureFlash will flash a message automatically by passport
router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true, }), users.login)

router.get('/logout', users.logout)


module.exports = router;
