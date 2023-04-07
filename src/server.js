import fs from 'fs';
import admin from 'firebase-admin';
import express from "express";
import { db, conectToDb } from './db.js';

const credentials = JSON.parse(
    fs.readFileSync('credentials.json')
)

admin.initializeApp({
    credential: admin.credential.cert(credentials),
})

const app = express();

// Middleware
app.use(express.json())

app.use(async (req, res, next) => {
    const { authToken } = req.headers;

    if (authToken) {
        try {
            req.user = await admin.auth().verifyIdToken(authToken);
        } catch (e) {
            res.sendStatus(400)
        }
    }

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
        article.canUpvote = uid && !upvoteIds.include(uid);
        res.json(article);
    }
    else {
        res.send("ARTICLE NOT FOUND")
    }
})

app.post("/hello", (req, res) => {
    res.send(`Hello ${req.body.name}`);
});

app.get('/hello/:name/goodbye/:name_2', (req, res) => {
    const name = req.params
    res.send(`Hello ${req.params.name}, Goodybe ${req.params.name_2}!`);
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

    const article = await db.collection('articles').findOne({ name });

    if (article) {
        const upvoteIds = article.upvoteIds || [];
        const canUpvote = uid && !upvoteIds.include(uid);

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
    console.log("COMMENT RECEIVED!")
    
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
