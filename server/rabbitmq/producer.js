const { getChannel } = require('./connection');

const publishMessage = async (queue, message) => {
    const channel = getChannel();
    if (channel) {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        console.log(`Message sent to queue ${queue}:`, message);
    } else {
        console.error('RabbitMQ channel not available');
    }
};

module.exports = { publishMessage };
