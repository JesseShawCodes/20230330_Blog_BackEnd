import mongoose from "mongoose";

var SpotifyAuthSchema = new mongoose.Schema({

  access_token: {
    type: String,
    required: true
},
  token_type: {
    type: String,
    required: true
  },
  expires_in: {
    type: Number,
    required: true
  },
  created_date: {
    type: Date,
    required: true
  },
});

var SpotifyAuth = mongoose.model('SpotifyAuth', SpotifyAuthSchema);


/*
module.exports = {
    Article: Article
}
*/

export default SpotifyAuth