import express from "express";
import { createShortUrl, redirectToOriginalUrl, getUrlStats, deleteShortUrl } from "../controller/url.controller.js";

const router = express.Router();

router.post("/", createShortUrl);
router.get("/stats/:shortId", getUrlStats);
router.get("/:shortId", redirectToOriginalUrl);
router.delete("/:shortId", deleteShortUrl);

export default router;