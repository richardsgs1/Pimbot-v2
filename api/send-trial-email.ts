/**
 * send-trial-email.ts
 * Location: /api/send-trial-email.ts
 * 
 * Vercel Serverless Function for sending trial notification emails
 * Using direct Mailgun REST API (simpler, no library issues)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ========================================
// RATE LIMITING (Simple in-memory)
// ========================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const maxRequests = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes

  const userLimit = rateLimitStore.get(email);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(email, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  rateLimitStore.set(email, userLimit);
  return true;
}

// ========================================
// MAIN HANDLER
// ========================================
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers for Vite frontend
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    // Extract data from request
    const { to, subject, body, userId, notificationType } = req.body;

    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email must include: to, subject, and body'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        error: 'Invalid email address',
        message: 'Please provide a valid email address'
      });
    }

    // Check environment variables
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
    const MAILGUN_API_URL = process.env.MAILGUN_API_URL || 'https://api.mailgun.net';
    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error('❌ Mailgun not configured properly');
      return res.status(500).json({
        error: 'Email service not configured',
        message: 'Please check MAILGUN_API_KEY and MAILGUN_DOMAIN in environment variables'
      });
    }

    // Check rate limit
    if (!checkRateLimit(to)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many email requests. Please try again in 15 minutes.',
        retryAfter: '15 minutes'
      });
    }

    // ========================================
    // MAILGUN - Send Email via Direct REST API
    // ========================================
    
    // Prepare form data for Mailgun
    const formData = new URLSearchParams();
    formData.append('from', `PiMbOt AI <${FROM_EMAIL}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', body);
    formData.append('html', body.replace(/\n/g, '<br>'));
    
    // Optional: Add tags and tracking
    formData.append('o:tag', notificationType || 'trial-email');
    formData.append('o:tracking', 'true');
    formData.append('o:tracking-clicks', 'true');
    formData.append('o:tracking-opens', 'true');

    // Make request to Mailgun API
    const mailgunUrl = `${MAILGUN_API_URL}/v3/${MAILGUN_DOMAIN}/messages`;
    const authHeader = 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');

    const mailgunResponse = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const mailgunData = await mailgunResponse.json();

    if (!mailgunResponse.ok) {
      console.error('❌ Mailgun API error:', mailgunData);
      
      // Handle specific Mailgun errors
      if (mailgunResponse.status === 401) {
        return res.status(500).json({
          error: 'Email service authentication failed',
          message: 'Invalid MAILGUN_API_KEY. Check your Vercel environment variables'
        });
      }

      if (mailgunResponse.status === 402) {
        return res.status(500).json({
          error: 'Mailgun billing issue',
          message: 'Please check your Mailgun account billing status'
        });
      }

      throw new Error(mailgunData.message || 'Failed to send email');
    }

    // Log success
    console.log(`✅ Sent ${notificationType} email to ${to}`);
    console.log(`📧 Mailgun Message ID: ${mailgunData.id}`);

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      emailType: notificationType,
      messageId: mailgunData.id
    });

  } catch (error: any) {
    console.error('❌ Email send error:', error);

    // Generic error
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message || 'An unknown error occurred',
      details: error.details || null
    });
  }
}

// ========================================
// NOTES
// ========================================
/*
This version uses direct fetch to Mailgun's REST API instead of the mailgun.js library.
This avoids compatibility issues with Vercel's serverless environment.

Environment Variables Needed:
- MAILGUN_API_KEY: Your Mailgun API key
- MAILGUN_DOMAIN: Your Mailgun domain (e.g., sandboxXXX.mailgun.org)
- MAILGUN_API_URL: https://api.mailgun.net (or https://api.eu.mailgun.net for EU)
- FROM_EMAIL: Your from email address

No additional npm packages needed beyond @vercel/node!
*/