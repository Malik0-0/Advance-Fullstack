import "express";

declare module "express-serve-static-core" {
  interface Response {
    ok: (data?: unknown, message?: string) => Response;
    created: (data?: unknown, message?: string) => Response;
    updated: (data?: unknown, message?: string) => Response;
    deleted: (data?: unknown, message?: string) => Response;
    paginated: (data: unknown, meta: unknown, message?: string) => Response;
  }
}
