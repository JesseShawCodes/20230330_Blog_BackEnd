import mongoose from "mongoose";

var ArticleSchema = new mongoose.Schema({
  name: {
    type: String  
},
  title: {
    type: String
  },
  content: {
    type: String
  },
  comments: {
    type: Array
  }
});

var Article = mongoose.model('Article', ArticleSchema);


/*
module.exports = {
    Article: Article
}
*/

export default Article