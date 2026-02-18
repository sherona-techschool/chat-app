const { getChannel } = require('./connection');

const consumeMessage = async (queue, callback) => {
    const channel = getChannel();
    if (channel) {
        await channel.consume(queue, (data) => {
            if (data) {
                const content = JSON.parse(data.content.toString());
                callback(content);
                channel.ack(data);
            }
        });
        console.log(`Consuming messages from queue ${queue}`);
    } else {
        console.error('RabbitMQ channel not available');
    }
};

module.exports = { consumeMessage };
