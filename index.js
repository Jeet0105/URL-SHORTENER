import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./utils/connectDB.js";
import urlRoutes from "./routes/url.route.js";

const app = express();
dotenv.config();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Welcome to the URL Shortener API");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP" });
});

app.use("/api/v1/url", urlRoutes);

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port: ${PORT}`);
            console.log(`http://localhost:${PORT}`);
        });
    } catch(error) {
        console.error(error);
    }
}

startServer();