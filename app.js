const express = require("express");
const { default: mongoose } = require("mongoose");
const ejsMate = require("ejs-mate")
const { campgroundSchema, reviewSchema } = require("./schemasValidation")
const path = require("path")
const catchAsync = require("./utils/catchAsync")
const ExpressError = require("./utils/ExpressError")
const methodOverride = require("method-override")
const Campground = require("./models/campground")
const Review = require("./models/review")

main().catch(err => console.log("OH NO MONGO ERROR", err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/yelp-camp');
    console.log("MONGO CONNECTION OPEN!");
}

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.urlencoded({ extended: true })); //THIS IS IMPORTANT FOR FORM POST to parse the body
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate)

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

app.listen(3000, () => {
    console.log("Serving on port 3000");
})

app.get("/", (req, res) => {

})

app.get("/campgrounds", catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render("campgrounds/index.ejs", { campgrounds })
}))

app.get("/campgrounds/new", (req, res) => {
    res.render("campgrounds/new.ejs")
})

app.post("/campgrounds", validateCampground, catchAsync(async (req, res) => {
    // console.log(req.body)
    // if (!req.body.campground) throw new ExpressError("Invalid Campground Data", 400)
    const campground = new Campground(req.body.campground)
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}))

// if /campgrounds/new come after this, it will treat "new" as an id and it will give an error
app.get("/campgrounds/:id", catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate("reviews")
    res.render("campgrounds/show.ejs", { campground })
}))

app.get("/campgrounds/:id/edit", catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render("campgrounds/edit.ejs", { campground })
}))

app.put("/campgrounds/:id", validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground })
    //console.log(campground)
    res.redirect(`/campgrounds/${campground._id}`);
}))

app.delete("/campgrounds/:id", catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id)
    res.redirect("/campgrounds");
}))

app.post("/campgrounds/:id/reviews", validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`)
}))

app.delete("/campgrounds/:id/reviews/:reviewid", catchAsync(async (req, res) => {
    const { id, reviewid } = req.params
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewid } })
    await Review.findByIdAndDelete(reviewid)
    res.redirect(`/campgrounds/${id}`)
}))


//Error Handling
app.all("*", (req, res, next) => { //for all the unmatched above requests
    next(new ExpressError("Page Not Found", 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something Went Wrong!"
    res.status(statusCode).render("error.ejs", { err })
})



