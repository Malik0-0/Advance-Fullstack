import { NextFunction, Request, Response } from "express";

export function respondMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.ok = (data, message = "OK") =>
    res.status(200).json({ success: true, message, data });

  res.created = (data, message = "Created") =>
    res.status(201).json({ success: true, message, data });

  res.updated = (data, message = "Updated") =>
    res.status(200).json({ success: true, message, data });

  res.deleted = (data, message = "Deleted") =>
    res.status(200).json({ success: true, message, data });

  res.paginated = (data, meta, message = "OK") =>
    res.status(200).json({ success: true, message, data, meta });

  next();
}
