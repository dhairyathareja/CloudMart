import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, name: user.name },
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: process.env.TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_KEY,
    { expiresIn: process.env.TOKEN_EXPIRY }
  );
};
