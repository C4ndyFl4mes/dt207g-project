const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const reviewsRoutes = require("./routes/reviews");

require('dotenv').config();

const app = express();
connectDB();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

// Routes:
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/reviews", reviewsRoutes);

app.get("/api", (req, res) => {
    return res.status(200).json({message: "Det funkar!"});
});

app.listen(port, () => {
    console.log("Server körs!");
});