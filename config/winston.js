const winston = require("winston");
const StatsD = require('node-statsd');
const statsdClient = new StatsD();

const logger = winston.createLogger({

  format: winston.format.json(),

  transports: [new winston.transports.File({
    filename: 'csye6225.log'
  })],

});

module.exports = {
  logger,
  statsdClient
};