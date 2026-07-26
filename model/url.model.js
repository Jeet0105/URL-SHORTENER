import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
    redirectURL: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    shortId: {
        type: String,
        required: true,
        unique: true,
    },
    clickCount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const Url = mongoose.model("Url", urlSchema);
export default Url;