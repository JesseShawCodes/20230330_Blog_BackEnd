import express from "express";

let articlesInfo = [{
    name: 'article-1',
    upvotes: 0
}, {
    name: 'article-2',
    upvotes: 0
}, {
    name: 'article-3',
    upvotes: 0
}]

const app = express();

// Middleware
app.use(express.json())

app.post("/hello", (req, res) => {
    console.log(req.body)
    res.send(`Hello ${req.body.name}`);
});

app.get('/hello/:name/goodbye/:name_2', (req, res) => {
    console.log(req);
    const name = req.params
    res.send(`Hello ${req.params.name}, Goodybe ${req.params.name_2}!`);
})

app.put("/api/articles/:name/upvote", (req, res) => {
    console.log(req.params);
    const { name } = req.params;

    const article = articlesInfo.find(a => a.name === name);
    if (article) {
        article.upvotes += 1;
        res.send(`The ${name }article now has ${article.upvotes} upvotes`)
    }
    else {
        res.send(`The Article does not exist`)
    }
})

app.listen(8000, () => {
    console.log("Server is listening on port 8000");
})