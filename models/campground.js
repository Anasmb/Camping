const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review")

const ImageSchema = new Schema({
    url: String,
    filename: String
})

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
})

//by default, mongoose does not include virtuals when you convert a document to JSON
const opt = { toJSON: { virtuals: true } }

const CampgroundSchema = new Schema({
    title: String,
    price: Number,
    images: [ImageSchema],
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ]
}, opt)

CampgroundSchema.virtual('properties.popUpMarkup').get(function () { //explained in lec 558
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>`
})


CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model("Campground", CampgroundSchema);