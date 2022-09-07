const express = require("express");
const passport = require("passport");
const router = express.Router({ mergeParams: true }); // mergeParams explained in lec 490
const User = require('../models/user')
const catchAsync = require("../utils/catchAsync")

router.get('/register', (req, res) => {
    res.render('users/register')
})

router.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username })
        const registredUser = await User.register(user, password);
        req.login(registredUser, (err) => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp')
            res.redirect('/campgrounds')
        })

    } catch (err) {
        req.flash('error', err.message)
        res.redirect('/register')
    }
}))

router.get('/login', (req, res) => {
    res.render('users/login')
})

//passport give us a middleware passport.authenticate
// failureFlash will flash a message automatically by passport
router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true, }), (req, res) => {
    req.flash('success', 'Welcome Back');
    const redirectUrl = req.session.returnTo || '/campgrounds' //(lec 519)
    delete req.session.returnTo
    res.redirect(redirectUrl)
})

router.get('/logout', (req, res, next) => {
    req.logout(function (err) { if (err) { return next(err) } }); //logout is also a function in the request added by passport
    req.flash('success', 'See you soon')
    res.redirect('/campgrounds')
})


module.exports = router;
