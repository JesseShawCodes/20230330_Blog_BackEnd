import express from "express";
import { db, conectToDb } from './db.js'

const app = express();

// Middleware
app.use(express.json())

app.get("/api/articles/:name", async (req, res) => {
    const { name } = req.params

    const article = await db.collection('articles').findOne({ name });
    if (article) {
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

app.put("/api/articles/:name/upvote", async (req, res) => {
    const { name } = req.params;

    await db.collection('articles').updateOne({name }, {
        $inc: { upvotes: 1 }
    })

    const article = await db.collection('articles').findOne({name});
    if (article) {
        res.json(article);
    }
    else {
        res.send(`The Article does not exist`)
    }
});

app.post("/api/articles/:name/comments", async (req, res) => {
    console.log("COMMENT RECEIVED!")
    
    const { name } = req.params;
    const { postedBy, text } = req.body;

    await db.collection('articles').updateOne({name }, {
        $push: { comments: { postedBy, text } }
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
