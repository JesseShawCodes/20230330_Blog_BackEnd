import { MongoClient } from 'mongodb'
import mongoose from 'mongoose';

let db;

async function conectToDb(cb) {
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();

    db = client.db('react-blog-db');
    await mongoose.connect('mongodb://127.0.0.1:27017/react-blog-db');

    cb();
}

export {
    db,
    conectToDb,
};