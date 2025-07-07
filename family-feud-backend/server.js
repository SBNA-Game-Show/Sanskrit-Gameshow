
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth.routes");
const responseRoutes = require('./routes/responses.route.js');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api/response', responseRoutes);
app.get("/", (req, res) => res.send("API running"));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(process.env.PORT, () =>
            console.log("Server running on port", process.env.PORT)
        );
    })
    .catch(err => console.error("Mongo error:", err));
