const { producer } = require('../kafka/kafkaClient');

const produceEvent = async (topic, message) => {
  try {
    await producer.connect();

    if (!message) {
      throw new Error("produceEvent called with undefined payload!");
    }

    console.log("Producing Kafka event for:", message);

    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });

    await producer.disconnect();
  } catch (error) {
    console.error("Kafka produce error:", error);
  }
};

module.exports = { produceEvent };
