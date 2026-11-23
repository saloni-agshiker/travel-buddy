const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const User = require("../models/User");
const { s3, BUCKET } = require("../s3");

// creates mini Express app (group of routes related to authentication)
const router = express.Router();
const SIGNED_URL_SECONDS = 60 * 60;
const ALLOWED_PROFILE_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (ALLOWED_PROFILE_IMAGE_TYPES.has(file.mimetype)) return callback(null, true);
        return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
    },
});

// simple authentication/verification middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.sub;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// Update route - when server receives PATCH /api/users/me
router.patch("/me", requireAuth, async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "college",
            "residence",
            "year",
            "bio",
            "languages",
            //"profilePic",
        ];

        const updates = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ message: "Server error", detail: err.message });
    }
}

);

// POST /api/users/me/profile-picture
// Send multipart/form-data with one image field named "file".
// The uploaded key is saved on the authenticated user's profile.
router.post("/me/profile-picture", requireAuth, (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (error) {
            const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
                ? "Profile pictures must be 5 MB or smaller."
                : "Please upload an image file in the 'file' field.";
            return res.status(400).json({ message });
        }
        return next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "A profile picture file is required." });
        }

        const extension = req.file.originalname.split(".").pop();
        const uploadedAt = new Date().toISOString().replace(/[:.]/g, "-");
        const key = `users/${req.userId}/profilePictures/${uploadedAt}-${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }));

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: { profilePicKey: key } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({ key: user.profilePicKey });
    } catch (error) {
        console.error("Profile-picture upload error:", error);
        return res.status(500).json({ message: "Profile-picture upload failed." });
    }
});

// GET /api/users/me/profile-picture?key=<s3-key>
// Generates a one-hour signed URL for a picture owned by the signed-in user.
router.get("/me/profile-picture", requireAuth, async (req, res) => {
    try {
        const key = typeof req.query.key === "string" ? req.query.key : "";
        if (!key) {
            return res.status(400).json({ message: "A profile-picture key is required." });
        }

        // Do not let a user create URLs for another user's objects. Support the
        // current profilePictures folder and keys created by the earlier uploads folder.
        const allowedPrefixes = [
            `users/${req.userId}/profilePictures/`
        ];
        if (!allowedPrefixes.some((prefix) => key.startsWith(prefix))) {
            return res.status(403).json({ message: "You cannot access this profile picture." });
        }

        const url = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: BUCKET, Key: key }),
            { expiresIn: SIGNED_URL_SECONDS }
        );

        return res.status(200).json({
            url,
            expiresAt: new Date(Date.now() + SIGNED_URL_SECONDS * 1000).toISOString(),
        });
    } catch (error) {
        console.error("Profile-picture retrieval error:", error);
        return res.status(500).json({ message: "Profile-picture retrieval failed." });
    }
});

module.exports = router;
