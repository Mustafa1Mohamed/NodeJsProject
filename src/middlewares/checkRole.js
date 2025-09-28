const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role || "user"; // تأكد من وجود role في التوكن

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  };
};

export default checkRole;
