const amqp = require('amqplib');

let channel = null;
let connection = null;

const connectRabbitMQ = async () => {
  try {
    const amqpServer = 'amqp://127.0.0.1';
    connection = await amqp.connect(amqpServer);

    // Handle Connection Errors
    connection.on('error', (err) => {
      console.error('RabbitMQ Connection Error:', err);
    });

    connection.on('close', () => {
      console.log('RabbitMQ Connection Closed. Reconnecting...');
      setTimeout(connectRabbitMQ, 5000); // Retry after 5s
    });
  
    channel = await connection.createChannel();

    // Handle Channel Errors
    channel.on('error', (err) => {
      console.error('RabbitMQ Channel Error:', err);
    });

    await channel.assertQueue('chat_messages');
    console.log('Connected to RabbitMQ');
    return channel;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    // Retry on initial failure
    setTimeout(connectRabbitMQ, 5000);
  }
};

const getChannel = () => {
  if (!channel) {
    console.warn("RabbitMQ channel accessed before initialization");
  }
  return channel;
};

module.exports = { connectRabbitMQ, getChannel };
