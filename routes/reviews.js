const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams explained in lec 490
const catchAsync = require("../utils/catchAsync")
const Campground = require("../models/campground")
const Review = require("../models/review")
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware')


router.post("/", isLoggedIn, validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash("success", "Created new review!")
    res.redirect(`/campgrounds/${campground._id}`)
}))

router.delete("/:reviewid", isLoggedIn, isReviewAuthor, catchAsync(async (req, res) => {
    const { id, reviewid } = req.params
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewid } })
    await Review.findByIdAndDelete(reviewid)
    req.flash("success", "Review deleted successfully")
    res.redirect(`/campgrounds/${id}`)
}))

module.exports = router;