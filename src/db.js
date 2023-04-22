import { MongoClient } from 'mongodb'
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config()

let db;

async function conectToDb(cb) {
    // Local
    const client = new MongoClient(`${process.env.mongo_client}`)

    // const client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.0sk1xrb.mongodb.net/?retryWrites=true&w=majority`);
    await client.connect();

    db = client.db(`${process.env.mongo_db}`);
    // await mongoose.connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.0sk1xrb.mongodb.net/?retryWrites=true&w=majority/react-blog-db`);
    await mongoose.connect(`${process.env.mongo_client}/${process.env.mongo_db}`);
    cb();
}

export {
    db,
    conectToDb,
};