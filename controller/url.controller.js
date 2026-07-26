import { nanoid } from "nanoid";
import Url from "../model/url.model.js";
import LFUCache from "../utils/lfuCache.js";

const MAX_RETRIES = 5;
const cache = new LFUCache(100);

/*
    Controller for creating a short URL and redirecting to the original URL
    @param {Object} req - The request object
    @param {Object} res - The response object
    @returns {Object} - The response object with the short URL or the original URL
*/
export const createShortUrl = async (req, res) => {
    try {
        const { redirectURL } = req.body;
        if (!redirectURL) {
            return res.status(400).json({ error: "redirectURL is required" });
        }

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const shortId = nanoid(8);
            try {
                const newUrl = new Url({ redirectURL, shortId });
                await newUrl.save();
                cache.set(shortId, {
                    shortId: newUrl.shortId,
                    redirectURL: newUrl.redirectURL,
                    clickCount: newUrl.clickCount,
                });
                return res.status(201).json({ shortId });
            } catch (error) {
                if (error.code === 11000 && error.keyPattern?.shortId) {
                    continue;
                }
                if (error.code === 11000 && error.keyPattern?.redirectURL) {
                    const url = await Url.findOne({ redirectURL });
                    if (url) return res.status(200).json({ shortId: url.shortId });
                }
                throw error;
            }
        }

        return res.status(500).json({ error: "Failed to generate a unique short URL, please try again" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/*
    Controller for redirecting to the original URL based on the short ID
    @param {Object} req - The request object
    @param {Object} res - The response object
    @returns {Object} - The response object with the original URL or an error message
*/
export const redirectToOriginalUrl = async (req, res) => {
    try {
        const { shortId } = req.params;
        if (!shortId) {
            return res.status(400).json({ error: "shortId is required" });
        }

        const cached = cache.get(shortId);
        if (cached) {
            // Cache hit: redirect immediately, update the DB count in the background.
            cached.clickCount += 1;
            Url.updateOne({ shortId }, { $inc: { clickCount: 1 } }).catch((err) =>
                console.error("Background click update failed:", err)
            );
            return res.redirect(cached.redirectURL);
        }

        const url = await Url.findOneAndUpdate(
            { shortId },
            { $inc: { clickCount: 1 } },
            { new: true }
        );

        if (!url) {
            return res.status(404).json({ error: "URL not found" });
        }

        cache.set(shortId, {
            shortId: url.shortId,
            redirectURL: url.redirectURL,
            clickCount: url.clickCount,
        });

        res.redirect(url.redirectURL);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/*
    Controller for retrieving statistics for a short URL
    @param {Object} req - The request object
    @param {Object} res - The response object
    @returns {Object} - The response object with the URL statistics
*/
export const getUrlStats = async (req, res) => {
    try {
        const { shortId } = req.params;
        if (!shortId) {
            return res.status(400).json({ error: "shortId is required" });
        }

        const cached = cache.get(shortId);
        if (cached) {
            return res.status(200).json(cached);
        }

        const url = await Url.findOne({ shortId });
        if (!url) {
            return res.status(404).json({ error: "URL not found" });
        }

        const stats = {
            shortId: url.shortId,
            redirectURL: url.redirectURL,
            clickCount: url.clickCount,
        };

        cache.set(shortId, stats);
        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/*
    Controller for deleting a short URL based on the short ID
    @param {Object} req - The request object
    @param {Object} res - The response object
    @returns {Object} - The response object with a success or error message
*/
export const deleteShortUrl = async (req, res) => {
    try {
        const { shortId } = req.params;
        if (!shortId) {
            return res.status(400).json({ error: "shortId is required" });
        }
        const url = await Url.findOneAndDelete({ shortId });
        if (!url) {
            return res.status(404).json({ error: "URL not found" });
        }
        cache.delete(shortId);
        res.status(200).json({ message: "URL deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}