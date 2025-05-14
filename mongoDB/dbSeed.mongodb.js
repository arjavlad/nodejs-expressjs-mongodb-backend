// MongoDB Playground to Seed the Database for the Admin

require('dotenv').config();
const bcrypt = require('bcrypt');
// The current database to use.
use('mydb');

db.admins.insertOne({
  email: 'admin@mydb.com',
  password: bcrypt.hashSync('Test@1234', 10),
});
console.log('Admin seeded successfully');

// const mongoose = require('mongoose');
// const fs = require('fs');
// const countries = require('./seedData/countries.json');
// const seedCountries = async () => {
//   await db.countries.insertMany(
//     countries.map((country) => {
//       country._id = new mongoose.Types.ObjectId(country._id);
//       delete country.countryId;
//       country.isDeleted = false;
//       country.deletedAt = null;
//       country.createdAt = new Date();
//       country.updatedAt = new Date();
//       return country;
//     }),
//   );
// };
// seedCountries();

// const states = require('./seedData/states.json');
// const seedStates = async () => {
//   await db.states.insertMany(
//     states.map((state) => {
//       state._id = new mongoose.Types.ObjectId(state._id);
//       state.country = new mongoose.Types.ObjectId(state.country);
//       state.createdAt = new Date();
//       state.updatedAt = new Date();
//       state.isDeleted = false;
//       state.deletedAt = null;
//       return state;
//     }),
//   );
// };
// seedStates();

// const cities = require('./seedData/cities.json');
// const seedCities = async () => {
//   await db.cities.insertMany(
//     cities.map((city) => {
//       city._id = new mongoose.Types.ObjectId(city._id);
//       city.state = new mongoose.Types.ObjectId(city.state);
//       city.country = new mongoose.Types.ObjectId(city.country);
//       city.createdAt = new Date();
//       city.updatedAt = new Date();
//       city.isDeleted = false;
//       city.deletedAt = null;
//       return city;
//     }),
//   );
// };
// seedCities();
