import { Admin, Consumer, Producer, ProducerConfig, Partitioners, ConsumerConfig, CompressionTypes } from "kafkajs";
import * as Kafka from "../kafka_client";
import { v4 as uuidv4 } from "uuid";

const TOPIC_NAME = "test-topic-1";
const MESSAGE = {
  value: "Sample massage",
};

const PRODUCER_CONFIG: ProducerConfig = {
  createPartitioner: Partitioners.DefaultPartitioner,
};

const CONSUMER_GROUP_ID = "test-group";
const CONSUMER_CONFIG: ConsumerConfig = {
  groupId: CONSUMER_GROUP_ID,
};

describe("Kafka basic commands.", () => {
  let admin: Admin;
  let producer: Producer;
  let consumer: Consumer;

  beforeAll(async () => {
    const client = Kafka.getClient();
    admin = client.admin();
    await admin.connect();

    producer = client.producer(PRODUCER_CONFIG);
    await producer.connect();

    consumer = client.consumer(CONSUMER_CONFIG);
    await consumer.connect();
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

    const response = await admin.createTopics(createTopicsConfig);

    expect(response).toBeTruthy();
  });

  it("Should send a single message.", async () => {
    const response = await producer.send({
      topic: TOPIC_NAME,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: uuidv4(),
          ...MESSAGE,
        },
      ],
    });

    expect(response).toBeTruthy();
  });

  it("Should send messages in batch.", async () => {
    const topicMessages = [];
    for (let i = 1; i <= 10; ++i) {
      topicMessages.push({
        topic: TOPIC_NAME,
        messages: [
          {
            key: uuidv4(),
            ...MESSAGE,
          },
        ],
      });
    }
    const response = await producer.sendBatch({
      topicMessages: topicMessages,
    });

    expect(response).toBeTruthy();
  });

  it("Should consume messages.", async () => {
    await consumer.subscribe({
      topic: TOPIC_NAME,
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        expect(topic).toBe(TOPIC_NAME);
        expect(partition).toBeTruthy();

        const content = message.value;
        expect(content).toBeTruthy();
      },
    });
  });
});
