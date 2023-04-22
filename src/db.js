import { MongoClient } from 'mongodb'
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config()

let db;

async function conectToDb(cb) {
    const client = new MongoClient(`${process.env.mongo_client}`)

    await client.connect();

    db = client.db(`${process.env.mongo_db}`);
    await mongoose.connect(`${process.env.mongo_client}/${process.env.mongo_db}`);
    cb();
}

export {
    db,
    conectToDb,
};