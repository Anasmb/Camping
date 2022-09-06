const express = require("express");
const { default: mongoose } = require("mongoose");
const ejsMate = require("ejs-mate")
const path = require("path")
const session = require("express-session");
const ExpressError = require("./utils/ExpressError")
const methodOverride = require("method-override")
const flash = require('connect-flash')

const app = express();

const campground = require("./routes/campgrounds")
const reviews = require("./routes/reviews")


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
    res.locals.success = req.flash("success");
    res.locals.error = req.flash('error');
    next()
})

app.use("/campgrounds", campground);
app.use("/campgrounds/:id/reviews", reviews);

//Error Handling
app.all("*", (req, res, next) => { //for all the unmatched above requests
    next(new ExpressError("Page Not Found", 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something Went Wrong!"
    res.status(statusCode).render("error.ejs", { err })
})



