const mongoose = require('mongoose');

// MongoDB connection logic
module.exports.connect = () => {
  mongoose.connect('mongodb+srv://agathaenriquez:Jq2X55xoXsLt2361@cluster1.nbelx.mongodb.net/EJPLDentalClinicDB')
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

  //MongoDB Event Listeners
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected. Reconnecting...');
    mongoose.connect('mongodb+srv://agathaenriquez:Jq2X55xoXsLt2361@cluster1.nbelx.mongodb.net/EJPLDentalClinicDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
};