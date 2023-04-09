import mongoose from "mongoose";

var ArticleSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true
  },
  title: {
    type: String,
    index: true
  },
  content: {
    type: String
  },
  comments: {
    type: Array
  }
});

var Article = mongoose.model('Item', ArticleSchema);
/*
module.exports = {
    Article: Article
}
*/

export default Article