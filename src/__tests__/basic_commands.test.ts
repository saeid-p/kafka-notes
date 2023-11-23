import * as Kafka from "../kafka_client";

const TOPIC_NAME = "test-topic-1";
const MESSAGE = {
  value: "Sample massage",
};
const CONSUMER_NAME = "test-group";

describe("Kafka basic commands.", () => {
  const client = Kafka.getClient();

  it("Should create a producer and send a message.", async () => {
    const producer = client.producer();
    await producer.connect();

    const response = await producer.send({
      topic: TOPIC_NAME,
      messages: [MESSAGE],
    });

    expect(response).toBeTruthy();
  });

  it("Should consume messages.", async () => {
    const consumer = client.consumer({ groupId: CONSUMER_NAME });

    await consumer.connect();
    await consumer.subscribe({
      topic: TOPIC_NAME,
      fromBeginning: true,
    });

    const response = await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        expect(topic).toBe(TOPIC_NAME);
        expect(partition).toBeTruthy();

        const content = message.value;
        expect(content).toBeTruthy();
      },
    });

    expect(response).toBeTruthy();
  });
});
