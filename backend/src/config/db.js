// config/db.js
const mongoose = require('mongoose');
const debug = require('debug')('gn:db');

async function connect(uri) {
  if (!uri) throw new Error('MONGODB_URI not set');
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  debug('MongoDB connected');
  return mongoose.connection;
}

module.exports = { connect };
