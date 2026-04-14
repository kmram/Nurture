import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL);

redis.on('connect', () => {
    console.log('✅ Connected to Redis cache');
});

redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
});
