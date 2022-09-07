module.exports.isLoggedIn = function (req, res, next) {
    //console.log('User is:', req.user) //passport store the user in the session
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl // redirect back to the url when the user was not authenticated (lec 519)
        req.flash('error', 'You must be signed in first')
        return res.redirect('/login')
    }
    next();
}