export {};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      requestDurationMs?: number;
    }
  }
}
