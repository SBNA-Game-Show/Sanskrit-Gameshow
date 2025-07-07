
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["host", "teamA", "teamB"], required: true },
  teamId: { type: String }
});

module.exports = mongoose.model("User", userSchema);
