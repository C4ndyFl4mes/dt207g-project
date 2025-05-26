const express = require('express');
const cors = require('cors');

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);

app.get("/api", (req, res) => {
    return res.status(200).json({message: "Det funkar!"});
});

app.listen(port, () => {
    console.log("Server körs!");
});