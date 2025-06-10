import ampq from "amqplib";
import logger from "./logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "socialmedia_exchange";

export const connectToRabbitMQ = async () => {
  try {
    connection = await ampq.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", {
      durable: false,
    });
    logger.info("Connected to RabbitMQ");

    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
};

export async function publishEvent(routingKey, message) {
  try {
    if (!channel) {
      await connectToRabbitMQ();
    }
    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message))
    );
    logger.info(`Event published with routing key: ${routingKey}`);
  } catch (error) {
    logger.error("Error publishing event:", error);
    throw error;
  }
}

export async function consumeEvent(routing, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  const queue = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(queue.queue, EXCHANGE_NAME, routing);
  channel.consume(queue.queue, (msg) => {
    if (msg !== null) {
      const message = JSON.parse(msg.content.toString());
      callback(message);
      channel.ack(msg);
    }
  });
  logger.info(`Started consuming events with routing key: ${routing}`);
}
