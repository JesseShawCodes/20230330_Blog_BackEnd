import fs from 'fs';
import admin from 'firebase-admin';
import express from "express";
import { db, conectToDb } from './db.js';
import dotenv from 'dotenv';

dotenv.config()

import Article from './models/Article.js';
console.log(process.env)
const credentials = {
    "type": "service_account",
    "project_id": "my-blog-app-49f75",
    "private_key_id": `${process.env.private_key_id}`,
    "private_key": `${process.env.private_key}`,
    "client_email": `${process.env.client_email}`,
    "client_id": `${process.env.client_id}`,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-csmdo%40my-blog-app-49f75.iam.gserviceaccount.com"
}
  

admin.initializeApp({
    credential: admin.credential.cert(credentials),
})

const app = express();

// Middleware
app.use(express.json())

app.use(async (req, res, next) => {
    const { authtoken } = req.headers;


    if (authtoken) {
        try {
            req.user = await admin.auth().verifyIdToken(authtoken);
        } catch (e) {
            return res.sendStatus(400)
        }
    }

    
    req.user = req.user || {};
    

    next();
})

app.get("/api/articles/:name", async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });
    if (article) {
        // USer can only upvote article once
        const upvoteIds = article.upvoteIds || [];
        // Make sure user id is not in the id of the article
        article.canUpvote = uid && !upvoteIds.includes(uid);
        res.json(article);
    }
    else {
        res.sendStatus(404)
    }
})

app.get("/api/articles", async (req, res) => {
    const articles = await Article.find()
    res.json(articles)
})

app.use((req, res, next) => {
    if (req.user) {
        next()
    }
    else {
        res.sendStatus(401)
    }
});

app.put("/api/articles/:name/upvote", async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });

    if (article) {
        const upvoteIds = article.upvoteIds || [];
        const canUpvote = uid && !upvoteIds.includes(uid);

        if (canUpvote) {
            await db.collection('articles').updateOne({name }, {
                $inc: { upvotes: 1 },
                $push: { upvoteIds: uid},
            })
        }

        const updatedArticle = await db.collection('articles').findOne({name});

        res.json(updatedArticle)

    } else {
        res.send(`The Article does not exist`)
    }

});

app.post("/api/articles/:name/comments", async (req, res) => {
    const { name } = req.params;
    const { text } = req.body;
    const { email } = req.user;

    await db.collection('articles').updateOne({name }, {
        $push: { comments: { email, text } }
    })

    const article = await db.collection('articles').findOne( {name} )

    if (article) {
        res.json(article)
    }
    else {
        res.send("That article does not exist")
    }
})
conectToDb(() => {
    console.log("Successfully connected to Database")
    app.listen(8000, () => {
        console.log("Server is listening on port 8000");
    })
});
