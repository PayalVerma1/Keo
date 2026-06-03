import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
    try {
        const Atoken = req.headers.authorization;
        if (!Atoken) {
            return res.status(401).json({
                message: "No token provided",
            });
        }
        const token = Atoken.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "Invalid token format"
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};
