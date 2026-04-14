import { Kafka } from 'kafkajs';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

const kafka = new Kafka({
    clientId: 'tripnour-simulator',
    brokers: [KAFKA_BROKER],
});

const producer = kafka.producer();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const startSimulator = async () => {
    try {
        await producer.connect();
        console.log('✅ Connected to Kafka Producer');
        console.log('\n--- TripNour Conversational Simulator ---');
        console.log('1: Simulate VIEW_PACKAGE (Bali)');
        console.log('2: Simulate COMPARE_PACKAGES (Bali vs Maldives)');
        console.log('3: Send Custom Chat Message (TRIGGER_AI)');
        console.log('exit: Quit\n');

        const promptUser = () => {
            rl.question('Select an option (1-3) or type exit: ', async (answer) => {
                if (answer.toLowerCase() === 'exit') {
                    await producer.disconnect();
                    process.exit(0);
                }

                let eventData = null;

                if (answer === '1') {
                    eventData = {
                        actor: { user_id: 'user_123' },
                        action: 'VIEW_PACKAGE',
                        object: { metadata: { destination: 'Bali' } }
                    };
                    await sendEvent(eventData);
                    promptUser();
                } else if (answer === '2') {
                    eventData = {
                        actor: { user_id: 'user_123' },
                        action: 'COMPARE_PACKAGES',
                        object: { metadata: { destination: 'Maldives' } }
                    };
                    await sendEvent(eventData);
                    promptUser();
                } else if (answer === '3') {
                    rl.question('Type your conversational message: ', async (msg) => {
                        eventData = {
                            actor: { user_id: 'user_123' },
                            action: 'TRIGGER_AI',
                            object: { content: msg }
                        };
                        await sendEvent(eventData);
                        promptUser();
                    });
                } else {
                    console.log('Invalid option. Please type 1, 2, 3, or exit.');
                    promptUser();
                }
            });
        };

        const sendEvent = async (eventData: any) => {
            await producer.send({
                topic: 'tripnour-events',
                messages: [{ value: JSON.stringify(eventData) }],
            });
            console.log(`🚀 Event [${eventData.action}] sent to Kafka for User 123.`);
            console.log(`(Check your backend terminal window for the Engine state changes and AI outputs)\n`);
        };

        promptUser();
    } catch (e) {
        console.error("❌ Kafka Producer Error", e);
        process.exit(1);
    }
};

startSimulator();
