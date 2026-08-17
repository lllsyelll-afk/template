export const ErrorCode = {
  // Auth (middleware/auth.ts, routes/auth.ts)
  MISSING_TOKEN: "auth_missing_token",
  INVALID_TOKEN: "auth_invalid_token",
  USER_NOT_FOUND: "auth_user_not_found",
  USER_BLOCKED: "auth_user_blocked",
  PERMISSION_REQUIRED: "auth_permission_required",
  PHONE_VERIFICATION_REQUIRED: "auth_phone_verification_required",
  INVALID_CREDENTIALS: "auth_invalid_credentials",
  ALREADY_VERIFIED: "auth_already_verified",
  GOOGLE_AUTH_NOT_CONFIGURED: "auth_google_not_configured",
  GOOGLE_AUTH_FAILED: "auth_google_failed",
  GOOGLE_ACCOUNT_NOT_FOUND: "auth_google_account_not_found",
  INVALID_GOOGLE_TOKEN: "auth_invalid_google_token",
  FACEBOOK_AUTH_NOT_CONFIGURED: "auth_facebook_not_configured",
  FACEBOOK_AUTH_FAILED: "auth_facebook_failed",
  FACEBOOK_ACCOUNT_NOT_FOUND: "auth_facebook_account_not_found",
  INVALID_FACEBOOK_TOKEN: "auth_invalid_facebook_token",
  EMAIL_NOT_VERIFIED: "auth_email_not_verified",
  REQUEST_FAILED: "auth_request_failed",
  TOTP_REQUIRED: "auth_totp_required",
  TOTP_INVALID: "auth_totp_invalid",
  TOTP_NOT_ENABLED: "auth_totp_not_enabled",
  TOTP_ALREADY_ENABLED: "auth_totp_already_enabled",
  TOTP_2FA_REQUIRED: "auth_2fa_required",

  // CLI (middleware/cli.ts)
  CLI_NOT_CONFIGURED: "cli_not_configured",
  CLI_MISSING_API_KEY: "cli_missing_api_key",
  CLI_INVALID_API_KEY: "cli_invalid_api_key",

  // Validation
  VALIDATION: "validation_failed",
  DATE_REQUIRED: "validation_date_required",
  INVALID_DATE_FORMAT: "validation_invalid_date_format",
  STARTDATE_AND_ENDDATE_REQUIRED: "validation_start_end_date_required",
  INVALID_TIME_RANGE: "validation_invalid_time_range",
  INVALID_REQUEST: "validation_invalid_request",
  TOKEN_REQUIRED: "validation_token_required",

  // Resources not found
  NOT_FOUND: "resource_not_found",
  FILE_NOT_FOUND: "file_not_found",
  INVALID_FILE_TYPE: "file_invalid_type",
  FILE_TOO_LARGE: "file_too_large",
  ACCESS_DENIED: "resource_access_denied",
  FILE_ERROR: "file_processing_error",

  // Conflicts
  PHONE_ALREADY_USED: "conflict_phone_already_used",
  EMAIL_ALREADY_USED: "conflict_email_already_used",
  ACCOUNT_LOCKED: "conflict_account_locked",

  // SMS / Email / OTP
  SMS_FAILED: "communication_sms_failed",
  EMAIL_FAILED: "communication_email_failed",
  INVALID_OR_EXPIRED_OTP: "communication_invalid_otp",
  INVALID_OR_EXPIRED_CODE: "communication_invalid_code",
  TOO_MANY_ATTEMPTS: "communication_too_many_attempts",

  // Authorization
  FORBIDDEN: "auth_forbidden",

  // Operations
  UPDATE_FAILED: "operation_update_failed",
  DELETE_FAILED: "operation_delete_failed",
  CAPTCHA_FAILED: "operation_captcha_failed",

  // Files
  INVALID_FILE_PATH: "file_invalid_path",
  FILE_TYPE_NOT_ALLOWED: "file_type_not_allowed",
  INVALID_FOLDER: "file_invalid_folder",
  UPLOAD_FAILED: "file_upload_failed",

  // Push
  PUSH_NOT_CONFIGURED: "push_not_configured",

  // Internal
  INTERNAL_ERROR: "internal_server_error",

  // Notifications
  NOTIFICATION_NOT_FOUND: "notification_not_found",
  FETCH_NOTIFICATION_FAILED: "notification_fetch_failed",
  FETCH_NOTIFICATIONS_FAILED: "notification_fetch_all_failed",
  MARK_NOTIFICATION_FAILED: "notification_mark_read_failed",
  MARK_ALL_NOTIFICATIONS_FAILED: "notification_mark_all_read_failed",
  CREATE_NOTIFICATION_FAILED: "notification_create_failed",

  // Push subscriptions
  PUSH_SUBSCRIPTION_NOT_FOUND: "push_subscription_not_found",
  CREATE_PUSH_SUBSCRIPTION_FAILED: "push_subscription_create_failed",
  DELETE_PUSH_SUBSCRIPTION_FAILED: "push_subscription_delete_failed",
  FETCH_PUSH_SUBSCRIPTIONS_FAILED: "push_subscription_fetch_failed",

  // Misc
  UNAUTHORIZED: "misc_unauthorized",
  MISSING_FIELD: "misc_missing_field",
  INVALID_APPROVAL_LINK: "misc_invalid_approval_link",
  AMOUNT_MUST_BE_POSITIVE: "misc_amount_positive",
  WEBHOOK_INVALID_SIGNATURE: "webhook_invalid_signature",
  WEBHOOK_INVALID_EVENT: "webhook_invalid_event",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
