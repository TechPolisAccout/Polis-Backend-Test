const mongoose = require('mongoose');
const logger = require('pino')();

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);

  logger.info(`MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
module.exports.logger = logger;
