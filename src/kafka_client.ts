// https://kafka.js.org/docs/getting-started
import { Kafka } from "kafkajs";
import { readEnvironmentVariable } from "./config";

const clientId = readEnvironmentVariable("KAFKA_CLIENT_ID") || "test-app-1";
const brokers = readEnvironmentVariable("KAFKA_BROKERS") || "localhost:9092";

const getClient = () => {
  const kafka: Kafka = new Kafka({
    clientId: clientId,
    brokers: brokers?.split(",") ?? [],
  });

  return kafka;
};

export { getClient };
