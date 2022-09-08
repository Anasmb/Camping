const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync")
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware')
const campgrounds = require('../controllers/campgrounds')
const multer = require('multer')
const { storage } = require('../cloudinary') //node automatically look for index file in a folder
//const upload = multer({ dest: 'uploads/' }) this is used if we want to store locally
const upload = multer({ storage })

//another way to restructure routes is to use router.route and chain the verbs
router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))

router.get("/new", isLoggedIn, campgrounds.renderNewForm)

// if /campgrounds/new come after this, it will treat "new" as an id and it will give an error
router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground))

router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))

module.exports = router;