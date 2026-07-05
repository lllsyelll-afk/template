import { type ErrorCodeValue } from "./errorCodes";

export class AppError extends Error {
  code: ErrorCodeValue;
  status: number;
  data?: Record<string, unknown>;

  constructor(
    code: ErrorCodeValue,
    status: number,
    data?: Record<string, unknown>,
  ) {
    super(code);
    this.code = code;
    this.status = status;
    this.data = data;
  }
}
