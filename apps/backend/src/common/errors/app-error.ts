/**
 * Custom application error class for unified error handling
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode || `ERR_${this.statusCode}`,
      details: this.details,
    };
  }
}


