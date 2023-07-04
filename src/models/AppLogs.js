import mongoose from "mongoose";

var AppLogSchema = new mongoose.Schema({
  log: {
    type: Object,
  },
  message: {
    type: String,
  },
  created_date: {
    type: Date,
    required: true
  },
});

var AppLog = mongoose.model('AppLog', AppLogSchema);

export default AppLog