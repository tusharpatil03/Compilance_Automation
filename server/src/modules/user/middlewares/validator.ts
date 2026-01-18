import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validagteBody =
    <T>(schema: ZodSchema<T>) =>
        (req: Request, res: Response, next: NextFunction) => {
            console.log(req.baseUrl);
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    message: "Validation error",
                    errors: result.error.format(),
                });
            }

            //overwrite req.body with the parsed data
            req.body = result.data;
            next();
        };
