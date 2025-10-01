import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("from middleware", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, "secret", (err, decoded) => {
    if (err) {
      return res.status(401).json({ msg: "Invalid Token" });
    }
    req.user = decoded;
    next();
  });
};

export default verifyToken;
