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
const mongoSanitize = require('express-mongo-sanitize');
const passport = require('passport')
const localStrategy = require('passport-local')
const User = require('./models/user')
const helmet = require('helmet')

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
app.use(mongoSanitize()) //PREVENT query injection

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dd0fm7vwf/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);// helmets help to secure express apps by setting variuos http headers

//session data by default are stored in memory, so when the server restart the data is gone :(
const sessionConfig = {
    name: "fast_loader", //lec 569, this will change the default name, it is better to change it so hacker wont know that this thing is session id and they try to steal it from the users
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, //for security reasons, (by default it is set to true)
        // secure: true, // this will only work with HTTPS, otherwise it will cause issues with not HTTPS
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

app.get('/', (req, res) => {
    res.render('home')
})

//Error Handling
app.all("*", (req, res, next) => { //for all the unmatched above requests
    next(new ExpressError("Page Not Found", 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something Went Wrong!"
    res.status(statusCode).render("error.ejs", { err })
})



