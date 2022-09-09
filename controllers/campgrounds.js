const Campground = require("../models/campground")
const { cloudinary } = require('../cloudinary')
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken })

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render("campgrounds/index.ejs", { campgrounds })
}

//isAuthenticated() methods is added automatically to the request by passport
module.exports.renderNewForm = (req, res) => {
    // if (!req.isAuthenticated()) { //this authenticated is moved to be a middleware
    //     req.flash('error', 'You must be signed in')
    //     return res.redirect('/login')
    // }
    res.render("campgrounds/new.ejs")
}

module.exports.createCampground = async (req, res) => {
    // console.log(req.body)
    // if (!req.body.campground) throw new ExpressError("Invalid Campground Data", 400)
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body.campground)
    campground.geometry = geoData.body.features[0].geometry;
    campground.author = req.user._id
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await campground.save();
    console.log(campground)
    req.flash('success', 'Successfully made a new campground!')
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.showCampground = async (req, res) => {
    //the nested populate for the reviews is explained in lec 525
    const campground = await Campground.findById(req.params.id).populate({ path: "reviews", populate: { path: 'author' } }).populate('author')
    if (!campground) {
        req.flash("error", "Campground not found!")
        return res.redirect("/campgrounds")
    }
    res.render("campgrounds/show.ejs", { campground })
}

module.exports.renderEditForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    if (!campground) {
        req.flash("error", "Campground not found!")
        return res.redirect("/campgrounds")
    }
    res.render("campgrounds/edit.ejs", { campground })
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    //for authorizing we want find the author first to check authorization before update, 
    //so we need to break this line by using a middleware
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground })
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }))
    campground.images.push(...imgs);
    await campground.save()
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash("success", "Successfully updated campground")
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id)
    req.flash("success", "Campground deleted successfully")
    res.redirect("/campgrounds");
}