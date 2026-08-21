import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.error("Auth Error: Authorization header missing");
    return res.status(401).json({
      message: "Token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token || token === "null" || token === "undefined") {
    console.error("Auth Error: Token is null or undefined");
    return res.status(401).json({
      message: "Token is invalid or missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
    req.user = decoded;
    next();
  } catch (error) {
    console.error(`Auth Error: JWT verification failed for token starting with ${token.substring(0, 10)}...:`, error);
    return res.status(401).json({
      message: "Invalid or expired token",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};


