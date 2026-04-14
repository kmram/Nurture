import { Kafka } from 'kafkajs';
import { processEvent } from '../engine/decisionEngine';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

const kafka = new Kafka({
    clientId: 'tripnour-engine',
    brokers: [KAFKA_BROKER],
    retry: { retries: 5 }
});

const consumer = kafka.consumer({ groupId: 'decision-engine-group' });

export const startKafkaConsumer = async () => {
    try {
        // Ensure topic exists before consuming to prevent UNKNOWN_TOPIC_OR_PARTITION
        const admin = kafka.admin();
        await admin.connect();
        await admin.createTopics({
            topics: [{ topic: 'tripnour-events', numPartitions: 1 }],
            waitForLeaders: true,
        }).catch(() => { }); // Ignore if topic already exists
        await admin.disconnect();

        await consumer.connect();
        console.log('✅ Connected to Kafka');

        await consumer.subscribe({ topic: 'tripnour-events', fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) return;

                try {
                    const eventData = JSON.parse(message.value.toString());
                    console.log(`📥 Received Event: [${eventData.action}] for User: ${eventData.actor?.user_id}`);

                    // Route event to Decision Intelligence Engine synchronously
                    await processEvent(eventData);
                } catch (err) {
                    console.error('❌ Failed to process event:', err);
                }
            },
        });
    } catch (error) {
        console.error('❌ Kafka Consumer Error:', error);
    }
};
