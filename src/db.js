import { MongoClient } from 'mongodb'
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config()

let db;

async function conectToDb(cb) {
    const client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.0sk1xrb.mongodb.net/?retryWrites=true&w=majority`);
    await client.connect();

    db = client.db('test');
    await mongoose.connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.0sk1xrb.mongodb.net/?retryWrites=true&w=majority/react-blog-db`);

    cb();
}

export {
    db,
    conectToDb,
};