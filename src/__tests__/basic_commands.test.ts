import { Admin, Consumer, Producer } from "kafkajs";
import * as Kafka from "../kafka_client";

const TOPIC_NAME = "test-topic-1";
const MESSAGE = {
  value: "Sample massage",
};
const CONSUMER_NAME = "test-group";

describe("Kafka basic commands.", () => {
  let admin: Admin;
  let producer: Producer;
  let consumer: Consumer;

  beforeAll(() => {
    const client = Kafka.getClient();
    admin = client.admin();
    producer = client.producer();
    consumer = client.consumer({ groupId: CONSUMER_NAME });
  });
  
  afterAll(async () => {
    await admin.disconnect();
    await producer.disconnect();
    await consumer.disconnect();
  });

  it("Should create a topic.", async () => {
    const topicsMetadata = await admin.fetchTopicMetadata({ topics: [TOPIC_NAME] });
    if (topicsMetadata.topics.length !== 0) return;

    const createTopicsConfig = {
      validateOnly: false,
      waitForLeaders: true,
      topics: [
        {
          topic: TOPIC_NAME,
          numPartitions: 1,
          replicationFactor: 1,
        },
      ],
    };

    await admin.connect();
    const response = await admin.createTopics(createTopicsConfig);

    expect(response).toBeTruthy();
  });

  it("Should create a producer and send a message.", async () => {
    await producer.connect();

    const response = await producer.send({
      topic: TOPIC_NAME,
      messages: [MESSAGE],
    });

    expect(response).toBeTruthy();
  });

  it("Should consume messages.", async () => {
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
