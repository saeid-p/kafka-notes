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
      /**	Control the number of required acks.
        -1 = all insync replicas must acknowledge (default)
        0 = no acknowledgments
        1 = only waits for the leader to acknowledge */
      acks: 1,
      // The time to await a response in ms
      timeout: 4000,
      messages: [
        {
          // Used for partitioning. See: https://kafka.js.org/docs/producing#message-key
          key: uuidv4(),
          partition: 0,
          ...MESSAGE,
          headers: {
            "correlation-id": uuidv4(),
            "system-id": "my-system-name",
          },
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
            partition: i % 2 == 0 ? 0 : 1,
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

  const testTimeout = 5000; // 60 secs for debugging.
  it(
    "Should consume messages.",
    async () => {
      /** Consumer groups allow a group of machines or processes to coordinate access to a list of topics, distributing the load among the consumers.
       * When a consumer fails the load is automatically distributed to other members of the group. */
      // Read more: https://kafka.js.org/docs/consuming
      await consumer.subscribe({
        topic: TOPIC_NAME, // you can subscribe to any topic that matches a regular expression.
        // Indicated whether to process the messages from the top of the topic.
        // fromBeginning: true,
      });

      await consumer.run({
        /** The eachMessage handler provides a convenient and easy to use API, feeding your function one message at a time.
         * It is implemented on top of eachBatch, and it will automatically commit your offsets and heartbeat at the configured interval for you.
         * Be aware that the eachMessage handler should not block for longer than the configured session timeout or else the consumer will be removed from the group.
         * If your workload involves very slow processing times for individual messages then you should either increase the session timeout or make periodic use of
         * the heartbeat function exposed in the handler payload. The pause function is a convenience for consumer.pause({ topic, partitions: [partition] }).
         * It will pause the current topic-partition and returns a function that allows you to resume consuming later. */
        eachMessage: async ({ topic, partition, message }) => {
          expect(topic).toBe(TOPIC_NAME);
          expect(partition).toBeGreaterThanOrEqual(0);

          const key = message.key?.toString();
          key ? expect(key).toBeTruthy() : expect(key).toBeFalsy();
          const content = message.value?.toString();
          expect(content).toBeTruthy();
        },
      });

      await new Promise((resolve) => setTimeout(resolve, testTimeout));
    },
    testTimeout * 2
  );
});
