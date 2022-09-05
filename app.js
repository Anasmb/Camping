const express = require("express");
const { default: mongoose } = require("mongoose");
const ejsMate = require("ejs-mate")
const path = require("path")
const methodOverride = require("method-override")
const Campground = require("./models/campground")

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


app.listen(3000, () => {
    console.log("Serving on port 3000");
})

app.get("/", (req, res) => {

})

app.get("/campgrounds", async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render("campgrounds/index.ejs", { campgrounds })
})

app.get("/campgrounds/new", (req, res) => {
    res.render("campgrounds/new.ejs")
})

app.post("/campgrounds", async (req, res) => {
    console.log(req.body)
    const campground = new Campground(req.body.campground)
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
})

// if /campgrounds/new come after this, it will treat "new" as an id and it will give an error
app.get("/campgrounds/:id", async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render("campgrounds/show.ejs", { campground })
})

app.get("/campgrounds/:id/edit", async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render("campgrounds/edit.ejs", { campground })
})

app.put("/campgrounds/:id", async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground })
    //console.log(campground)
    res.redirect(`/campgrounds/${campground._id}`);
})

app.delete("/campgrounds/:id", async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id)
    res.redirect("/campgrounds");
})



