import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.send("No token provided");
    }
    jwt.verify(token, "secret", (err, decoded) => {
        if (err) {
            return res.send("Invalid Token");
        }
        req.myToken = decoded;
        next();
    });
};

export default verifyToken;
