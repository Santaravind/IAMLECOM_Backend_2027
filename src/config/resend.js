// src/config/resend.js

import 'dotenv/config';
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'IAMLECON 2027 <onboarding@resend.dev>';

export default resend;

