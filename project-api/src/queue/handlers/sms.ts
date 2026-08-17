import { Job } from "../types";
import { createSmsAdapter } from "../../sms";

export interface SmsJobData {
  phone: string;
  message?: string;
  code?: string;
  isOtp?: boolean;
}

export async function processSmsJob(job: Job<SmsJobData>): Promise<void> {
  const { phone, message, code, isOtp } = job.data;
  if (!phone) {
    throw new Error("Invalid SMS job data: 'phone' is required");
  }

  const smsAdapter = createSmsAdapter();

  if (isOtp && code) {
    await smsAdapter.sendOtp(phone, code);
    console.log(`[queue:sms] Sent OTP to ${phone}`);
  } else if (message) {
    await smsAdapter.sendSms(phone, message);
    console.log(`[queue:sms] Sent SMS message to ${phone}`);
  } else {
    throw new Error("Invalid SMS job data: either 'code' with 'isOtp' or 'message' is required");
  }
}
