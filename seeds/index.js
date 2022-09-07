const { default: mongoose } = require("mongoose");
const Campground = require("../models/campground")
const cities = require("./cities")// there is 1000 cities
const { descriptors, places } = require("./seedHelpers")

main().catch(err => console.log("OH NO MONGO ERROR", err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/yelp-camp');
    console.log("MONGO CONNECTION OPEN!");
}

const sample = (array) => array[Math.floor(Math.random() * array.length)];


//array[Math.floor(Math.random() * array.length)] //pick a random element in an array
const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '6318c1dcedaca305321aeba0',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: "https://source.unsplash.com/collection/1114848",
            description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Excepturi temporibus quo saepe provident? Saepe, assumenda a autem odio laborum modi atque nobis exercitationem officia nulla asperiores consequuntur dolores! Necessitatibus, porro.",
            price
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close()
});