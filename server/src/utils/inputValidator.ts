import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ErrorCode } from "./errorHandler";

type ValidationSource = "body" | "query" | "params";

export const validagteBody =
    <T>(schema: ZodSchema<T>, source: ValidationSource = "body") =>
        (req: Request, res: Response, next: NextFunction) => {
            const dataToValidate =
                source === "query"
                    ? req.query
                    : source === "params"
                        ? req.params
                        : req.body;

            const result = schema.safeParse(dataToValidate);
            if (!result.success) {
                const formattedErrors = result.error.flatten().fieldErrors;

                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    code: ErrorCode.VALIDATION_ERROR,
                    errors: formattedErrors,
                });
            }

            // Overwrite the data with parsed data
            if (source === "query") {
                req.query = result.data as any;
            } else if (source === "params") {
                req.params = result.data as any;
            } else {
                req.body = result.data;
            }

            next();
        };
