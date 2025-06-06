const { consumer } = require('./kafkaClient');

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'file-events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Kafka Message received on ${topic}:`, message.value.toString());
    },
  });
};

module.exports = { startConsumer };
