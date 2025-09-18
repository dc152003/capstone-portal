const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user; // { id, role, username, email }
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};