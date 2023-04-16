import mongoose from "mongoose";

var SpotifyAuthSchema = new mongoose.Schema({

  access_token: {
    type: String  
},
  token_type: {
    type: String
  },
  expires_in: {
    type: Number
  },
  created_date: {
    type: Date
  },
});

var SpotifyAuth = mongoose.model('SpotifyAuth', SpotifyAuthSchema);


/*
module.exports = {
    Article: Article
}
*/

export default SpotifyAuth