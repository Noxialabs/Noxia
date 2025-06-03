// ===================================================
// src/middleware/swagger.middleware.ts
import { Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import { specs } from "../config/swagger.config";

export const setupSwagger = (app: any) => {
  // Swagger UI options
  const options = {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1f2937; }
    `,
    customSiteTitle: "Legal Case Management API Documentation",
    swaggerOptions: {
      docExpansion: "none",
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        req.headers["Content-Type"] = "application/json";
        return req;
      },
    },
  };

  // Serve swagger docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, options));

  // Serve swagger JSON
  app.get("/api-docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  console.log("📚 Swagger documentation available at: /api-docs");
};
