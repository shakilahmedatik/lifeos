import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.warn(
        `[Validation Error] ${req.method} ${req.originalUrl}:`,
        JSON.stringify(result.error.issues),
        "Payload:",
        JSON.stringify(req.body),
      );
      res.status(400).json({
        error: "Validation error",
        issues: result.error.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
