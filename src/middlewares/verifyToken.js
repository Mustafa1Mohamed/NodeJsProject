import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const verifyToken = (req, res, next) => {
  let token = req.headers.authorization || "";
  if (token.startsWith("Bearer ")) token = token.slice(7).trim();
  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token, SECRET);
    // token contains { userId, role, email? }
    req.myToken = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid Token" });
  }
};

export default verifyToken;
