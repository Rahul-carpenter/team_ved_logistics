import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set');

const DB_NAME = 'ved_logistics';

// Connection options optimized for Atlas free-tier (512MB)
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In dev, use a global variable so the connection persists across HMR
  if (!globalThis._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options);
    globalThis._mongoClientPromise = client.connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

// Helper: generate a short unique ID (like cuid but smaller footprint)
export function genId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return ts + rand;
}

export default clientPromise;
