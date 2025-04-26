const mongoose = require('mongoose');

// MongoDB connection logic
module.exports.connect = () => {
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

  //MongoDB Event Listeners
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected. Reconnecting...');
    mongoose.connect(process.env.MONGODB_URI);
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
};