import type { RequestHandler } from "express";

export const requireAppToken: RequestHandler = (req, res, next) => {
  const expectedToken = process.env.APP_TOKEN;
  if (!expectedToken) {
    res.status(500).json({ error: "Authentication is not configured on the server" });
    return;
  }

  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match || match[1] !== expectedToken) {
    res.status(401).json({ error: "Missing or invalid authentication token" });
    return;
  }

  next();
};
