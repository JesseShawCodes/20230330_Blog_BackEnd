import admin from 'firebase-admin';
import express, { query, response } from "express";
import { db, conectToDb } from './db.js';
import dotenv from 'dotenv';
import cors from 'cors'

dotenv.config()

import Article from './models/Article.js';
import SpotifyAuth from './models/SpotifyAuth.js';

const credentials = {
    "type": "service_account",
    "project_id": "my-blog-app-49f75",
    "private_key_id": `${process.env.private_key_id}`,
    "private_key": `${process.env.private_key.replace(/\\n/gm, "\n")}`,
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

/*
/api/music/search/:name


*/

const app = express();

// Middleware
app.use(express.json())
app.use(cors({
    origin: '*'
}));
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

/* Get Artist List. ID Is included in this function*/
const getArtistList = async (token, query, queryType) => {
    return fetch(`https://api.spotify.com/v1/search?query=${query}&type=${queryType}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then((response) => { 
        return response.json().then((data) => {
            return data;
        }).catch((err) => {
            return {
                err: `${err}`
            }
        }) 
    });
}

/*Search Artist*/
app.get("/api/music/search/:name", async (req, res) => {
    console.log("REQUEST!!")
    console.log(req.params)
    var data = await searchSpotify(req.params.name)
    if (data.error) {
        updateAuth()
        data = await searchSpotify(req.params.name)
    }
    res.json(data)
})

app.get("/api/music/search/albums_by_artist/:name", async (req, res) => {
    var artistCode = await searchSpotify(req.params.name)
    if (artistCode.error) {
        var newAuth = await updateAuth()
        artistCode = await searchSpotify(req.params.name)
    }
    
    let artistId = artistCode.artists.items[0].id
    let albumsList = await getAlbumsByArtist(artistId)
    
    res.json({data: albumsList})
})

const getAlbumsByArtist = async (name) => {
    var auth = await SpotifyAuth.find({token_type: "Bearer"})
    var data = await spotifyApiRequest(`https://api.spotify.com/v1/artists/${name}/albums`, auth[0].access_token, 'GET')
    return data
}

/*
Single Function meant to handle all requests to spotify API
*/
const spotifyApiRequest = async (path, auth, method) => {
    return fetch(path, {
        method: method,
        headers: {
            "Authorization": `Bearer ${auth}`
        }
    }).then((response) => {
        return response.json().then((data) => {
            return data;
        }).catch((err) => {
            return {
                err: `${err}`
            }
        })
    })
}

/*
How to get all songs from an artist
https://stackoverflow.com/questions/40020946/how-to-get-all-songs-of-an-artist-on-spoitfy
*/
app.get("/api/music/search/top_tracks/:name", async (req, res) => {
    let artistCode = await searchSpotify(req.params.name)
    let data = await topTracksSpotify(artistCode.artists.items[0].id)
    if (data.error) {
        updateAuth()
        data = await topTracksSpotify(artistCode)
    }
    res.json(data)
})

app.get("/api/music/auth", async (req, res) => {
    var auth = await SpotifyAuth.find({token_type: "Bearer"})
    if (auth.length == 0) {
        createAuth();
        var auth = await SpotifyAuth.find({token_type: "Bearer"})
    }
    res.json({auth})
})

const topTracksSpotify = async (name) => {
    // https://api.spotify.com/v1/artists/{id}/top-tracks
    var auth = await SpotifyAuth.find({token_type: "Bearer"})
    return fetch(`https://api.spotify.com/v1/artists/${name}/top-tracks?market=US`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer  ${auth[0].access_token}`
        }
    }).then((response) => { 
        return response.json().then((data) => {
            return data;
        }).catch((err) => {
            return {
                err: `${err}`
            }
        }) 
    });
}

const searchSpotify = async (name) => {
    var auth = await SpotifyAuth.find({token_type: "Bearer"})
    return fetch(`https://api.spotify.com/v1/search?query="${name}"&type=artist`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer  ${auth[0].access_token}`
        }
    }).then((response) => { 
        return response.json().then((data) => {
            return data;
        }).catch((err) => {
            return {
                err: `${err}`
            }
        }) 
    });
}

/* Auth Functions */
const updateAuth = async () => {
    console.log("AUTH IS UPDATED")
    const request = await getSpotifyAuthFromApi()
    const filter = { token_type: "Bearer" }
    const update = { access_token: request.access_token, token_type: request.token_type, created_date: Date.now() }

    const result = await SpotifyAuth.findOneAndUpdate(filter, update);

    return result;
}

const createAuth = async () => {
    const request = await getSpotifyAuthFromApi();
    const filter = { token_type: "Bearer" }
    const update = { access_token: request.access_token, token_type: request.token_type, created_date: Date.now() }
    const result = await SpotifyAuth.create({
        access_token: request.access_token,
        token_type: request.token_type,
        expires_in: request.expires_in,
        created_date: Date.now()
    });
    return result;
}

const getSpotifyAuthFromApi = async () => {
    var details = {
        'grant_type': 'client_credentials',
        'client_id': process.env.spotify_client_id,
        'client_secret': process.env.spotify_client_secret
    };
    
    var formBody = [];
    for (var property in details) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    return fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            // 'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody
    }).then((response) => { 
        return response.json().then((data) => {
            return data;
        }).catch((err) => {
            return {
                err: `${err}`
            }
        }) 
    });

}

conectToDb(() => {
    console.log("Successfully connected to Database")
    // updateAuth on server initial start
    updateAuth()
    // Run an updateAuth every hour
    setInterval(updateAuth, 3600000)
    app.listen(8000, () => {
        console.log("Server is listening on port 8000");
    })
});
