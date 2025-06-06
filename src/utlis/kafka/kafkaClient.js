const { Kafka, logLevel } = require('kafkajs');

// Custom silent logger (disables KafkaJS internal logs)
const silentLogger = () => () => {};

const kafka = new Kafka({
  clientId: 'scs-backend',
  brokers: ['localhost:9092'],
  logLevel: logLevel.ERROR,     // Required but ignored due to logCreator
  logCreator: silentLogger
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'scs-group' });

// Connect and log once
(async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer connected 😉 ');
    await producer.disconnect(); // Optional: remove if you don't want to disconnect immediately
  } catch (err) {
    console.error('Kafka Producer failed to connect:', err.message);
  }
})();

module.exports = { kafka, producer, consumer };
