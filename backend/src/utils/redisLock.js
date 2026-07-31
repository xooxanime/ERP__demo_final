import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = parseInt(process.env.REDIS_PORT, 10) || 6379;
const password = process.env.REDIS_PASSWORD || null;

let redisClient = null;
let isRedisConnected = false;

// Simple in-memory fallback lock set
const inMemoryLocks = new Set();

try {
  redisClient = new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    showFriendlyErrorStack: true
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('📡 Redis Lock Service: Connected successfully.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
  });
} catch (error) {
  console.warn('⚠️ Redis Lock Service: Failed to initialize. Using in-memory fallback.', error.message);
}

/**
 * Acquires a distributed lock with ownership validation.
 * @param {String} key - Lock identifier.
 * @param {Number} ttlSeconds - Time-to-live in seconds.
 * @param {String} ownerToken - Token identifying the caller to ensure only the owner releases the lock.
 * @returns {Promise<Boolean>} - True if lock acquired, False otherwise.
 */
export const acquireLock = async (key, ttlSeconds = 600, ownerToken = 'default_owner') => {
  if (isRedisConnected && redisClient) {
    try {
      const result = await redisClient.set(key, ownerToken, 'NX', 'EX', ttlSeconds);
      return result === 'OK';
    } catch (err) {
      console.warn('⚠️ Redis Lock Error, falling back to local Set:', err.message);
    }
  }

  // InMemory fallback
  if (inMemoryLocks.has(key)) {
    return false;
  }
  inMemoryLocks.add(key);
  // Auto-release in-memory lock after TTL
  setTimeout(() => {
    inMemoryLocks.delete(key);
  }, ttlSeconds * 1000);
  return true;
};

/**
 * Releases a distributed lock using a safe Lua script evaluation to verify ownership.
 * @param {String} key - Lock identifier.
 * @param {String} ownerToken - Token validating lock ownership.
 */
export const releaseLock = async (key, ownerToken = 'default_owner') => {
  if (isRedisConnected && redisClient) {
    try {
      const luaReleaseScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await redisClient.eval(luaReleaseScript, 1, key, ownerToken);
      return;
    } catch (err) {
      console.warn('⚠️ Redis Release Lock Error:', err.message);
    }
  }

  inMemoryLocks.delete(key);
};
