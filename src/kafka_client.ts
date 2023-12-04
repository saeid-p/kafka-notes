// https://kafka.js.org/docs/getting-started
import { Kafka } from "kafkajs";
import { readEnvironmentVariable } from "./config";

/** Client-id is a logical grouping of clients with a meaningful name chosen by the client application.
 * The tuple (user, client-id) defines a secure logical group of clients that share both user principal and client-id.
 * Quotas can be applied to (user, client-id), user or client-id groups.
 */
const clientId = readEnvironmentVariable("KAFKA_CLIENT_ID") || "test-app-1";
const brokers = readEnvironmentVariable("KAFKA_BROKERS") || "127.0.0.1:9092";

const getClient = () => {
  const kafka: Kafka = new Kafka({
    clientId: clientId,
    brokers: brokers?.split(",") ?? [],
  });

  return kafka;
};

export { getClient };
