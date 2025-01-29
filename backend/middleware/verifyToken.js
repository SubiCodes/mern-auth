import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if(!token){
            return res.status(401).json({succes: false, message: "Unauthorized: no token provided."})
        }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({succes: false, message: "Unauthorized: no token provided."})
        }
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error("Error in verify token", error);
        return res.status(401).json({succes: false, message: "Server error"});
    }
}