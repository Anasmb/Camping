if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}
const express = require("express");
const { default: mongoose } = require("mongoose");
const ejsMate = require("ejs-mate")
const path = require("path")
const session = require("express-session");
const ExpressError = require("./utils/ExpressError")
const methodOverride = require("method-override")
const flash = require('connect-flash')
const passport = require('passport')
const localStrategy = require('passport-local')
const User = require('./models/user')

const app = express();

const userRoutes = require("./routes/users")
const campgroundRoutes = require("./routes/campgrounds")
const reviewsRoutes = require("./routes/reviews");
const { equal } = require("assert");


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.urlencoded({ extended: true })); //THIS IS IMPORTANT FOR FORM POST to parse the body
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public"))) //public is the name of the directory
app.engine("ejs", ejsMate)


//session data by default are stored in memory, so when the server restart the data is gone :(
const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, //for security reasons, (by default it is set to true)
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // this means it will expire within a week (in milliseconds)
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash()) //flash depend on sessions

app.use(passport.initialize());
app.use(passport.session()) //session MUST BE used before passport session
passport.use(new localStrategy(User.authenticate())) // authenticate static added automatically by passport
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

main().catch(err => console.log("OH NO MONGO ERROR", err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/yelp-camp');
    console.log("MONGO CONNECTION OPEN!");
}

app.listen(3000, () => {
    console.log("Serving on port 3000");
})

//to use flash in a middleware it should be before route handlers
app.use((req, res, next) => {
    res.locals.currentUser = req.user; //passport store the user in the session, we add it here to be able to access it on all templates
    res.locals.success = req.flash("success");
    res.locals.error = req.flash('error');
    next()
})

app.use('/', userRoutes)
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewsRoutes);

//Error Handling
app.all("*", (req, res, next) => { //for all the unmatched above requests
    next(new ExpressError("Page Not Found", 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something Went Wrong!"
    res.status(statusCode).render("error.ejs", { err })
})



