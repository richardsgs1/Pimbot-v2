/**
 * TrialEmailService.ts
 * Location: /lib/TrialEmailService.ts
 * 
 * Handles email notifications for trial period milestones
 * Works with Mailgun via the /api/send-trial-email serverless function
 */

import { TrialManager, TrialStatus } from './TrialManager';

export type TrialNotificationType = 
  | 'trial-7-days'
  | 'trial-3-days'
  | 'trial-1-day'
  | 'trial-expired'
  | 'grace-ending';

interface EmailTemplate {
  subject: string;
  body: string;
}

interface UserData {
  id?: string;
  name?: string;
  email: string;
  trialStartDate?: string;
  trialEndDate?: string;
  isPremium?: boolean;
  lastTrialNotification?: string;
  trialNotificationsSent?: string[];
}

export class TrialEmailService {
  /**
   * Email templates for different notification types
   */
  private static getEmailTemplate(
    type: TrialNotificationType,
    userData: UserData,
    status: TrialStatus
  ): EmailTemplate {
    const firstName = userData.name?.split(' ')[0] || 'there';
    const daysRemaining = status.daysRemaining;

    const templates: Record<TrialNotificationType, EmailTemplate> = {
      'trial-7-days': {
        subject: '⏰ 7 Days Left in Your Pimbot Trial',
        body: `Hi ${firstName},

Just a friendly reminder that you have 7 days remaining in your Pimbot free trial.

You've been crushing it with:
• Project management across multiple workspaces
• Advanced task tracking and prioritization  
• Smart calendar integration
• Team collaboration features

Don't lose access to all these powerful features! Upgrade now to keep your productivity flowing.

👉 View Pricing Plans: [UPGRADE_LINK]

Questions? Just reply to this email.

Best,
The Pimbot Team`
      },

      'trial-3-days': {
        subject: '⚡ Only 3 Days Left - Don\'t Lose Your Data',
        body: `Hi ${firstName},

Your Pimbot trial ends in just 3 days!

Here's what you'll lose access to if you don't upgrade:
❌ All your projects and tasks (after grace period)
❌ Advanced calendar features
❌ Team collaboration tools
❌ Export and backup capabilities
❌ Priority support

But here's what you GET when you upgrade:
✅ Unlimited projects and tasks
✅ Full calendar integration
✅ Advanced analytics
✅ Priority customer support
✅ Regular feature updates

Upgrade now and save your work: [UPGRADE_LINK]

Need help choosing a plan? Reply to this email.

Cheers,
The Pimbot Team`
      },

      'trial-1-day': {
        subject: '🚨 Final Notice: Trial Ends Tomorrow',
        body: `Hi ${firstName},

This is it - your trial ends tomorrow at ${status.endDate.toLocaleTimeString()}.

After that, you'll enter a 3-day grace period with limited access. Then your data will be archived.

⏰ Time is running out!

Upgrade RIGHT NOW to:
• Keep all your projects and tasks
• Maintain uninterrupted workflow
• Unlock premium features permanently

👉 Upgrade Now (Takes 2 Minutes): [UPGRADE_LINK]

Special offer: Use code LASTDAY for 10% off your first month!

Don't wait - secure your account now.

Best,
The Pimbot Team

P.S. Questions? Reply immediately and we'll help you upgrade.`
      },

      'trial-expired': {
        subject: '⚠️ Your Trial Has Ended - Grace Period Active',
        body: `Hi ${firstName},

Your Pimbot trial has ended, but don't panic!

You're now in a 3-day grace period. Here's what that means:
• View-only access to your projects
• Limited task creation
• No exports or backups
• 3 days to upgrade before data archival

Your hard work isn't lost yet - upgrade now to restore full access:

👉 Restore Full Access: [UPGRADE_LINK]

Why upgrade today?
✅ Immediate full feature restoration
✅ Your data stays safe and accessible
✅ No interruption to your workflow
✅ Lock in current pricing

We'd hate to see you go. Let us know if there's anything we can do to help.

Sincerely,
The Pimbot Team`
      },

      'grace-ending': {
        subject: '🚨 URGENT: Grace Period Ends in 24 Hours',
        body: `Hi ${firstName},

This is your FINAL warning.

Your grace period ends in 24 hours. After that:
❌ Your account will be archived
❌ Projects and tasks become inaccessible  
❌ All data will be stored offline for 30 days
❌ Recovery requires contacting support

This is your last chance to save everything with one click.

👉 UPGRADE NOW: [UPGRADE_LINK]

⚡ LAST CHANCE OFFER: Use code FINALDAY for 15% off

Don't lose months of work. Act now.

The Pimbot Team

P.S. This is an automated final notice. Your account will be archived tomorrow.`
      }
    };

    return templates[type];
  }

  /**
   * Send trial notification email via Mailgun serverless function
   */
  static async sendTrialNotification(
    userData: UserData,
    notificationType: TrialNotificationType
  ): Promise<boolean> {
    const status = TrialManager.getTrialStatus(userData);
    const template = this.getEmailTemplate(notificationType, userData, status);

    // Replace upgrade link with actual pricing page URL
    // TODO: Update this with your actual pricing page URL
    const upgradeUrl = window.location.origin + '/pricing';
    template.body = template.body.replace(/\[UPGRADE_LINK\]/g, upgradeUrl);

    try {
      // Send via Mailgun serverless function
      const response = await fetch('/api/send-trial-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userData.email,
          subject: template.subject,
          body: template.body,
          userId: userData.id,
          notificationType
        })
      });

      if (!response.ok) {
        return false;
      }

      await response.json();
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Check trial status and send notifications if needed
   * Call this function periodically (on app load, background job, etc.)
   */
  static async checkAndNotify(userData: UserData): Promise<{
    sent: boolean;
    type?: TrialNotificationType;
    error?: string;
  }> {
    // Skip if premium user
    if (userData.isPremium) {
      return { sent: false };
    }

    const status = TrialManager.getTrialStatus(userData);
    const notificationCheck = TrialManager.shouldSendNotification(
      status,
      userData.lastTrialNotification,
      userData.trialNotificationsSent || []
    );

    if (!notificationCheck.should || !notificationCheck.type) {
      return { sent: false };
    }

    try {
      const success = await this.sendTrialNotification(
        userData,
        notificationCheck.type
      );

      if (success) {
        
        
        // TODO: Update user record in Supabase with:
        // await supabase.from('users').update({
        //   last_trial_notification: new Date().toISOString(),
        //   trial_notifications_sent: [...existing, notificationCheck.type]
        // }).eq('id', userData.id);
        
        return { sent: true, type: notificationCheck.type };
      } else {
        return { 
          sent: false, 
          error: 'Email service returned failure' 
        };
      }
    } catch (error) {
      
      return { 
        sent: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Batch check notifications for multiple users (for cron jobs)
   * Useful for scheduled backend jobs that process all users at once
   */
  static async checkMultipleUsers(users: UserData[]): Promise<{
    total: number;
    sent: number;
    failed: number;
    results: Array<{ email: string; sent: boolean; type?: TrialNotificationType }>;
  }> {
    const results = await Promise.all(
      users.map(async (user) => {
        const result = await this.checkAndNotify(user);
        return {
          email: user.email,
          sent: result.sent,
          type: result.type
        };
      })
    );

    return {
      total: users.length,
      sent: results.filter(r => r.sent).length,
      failed: results.filter(r => !r.sent).length,
      results
    };
  }

  /**
   * Preview email template (for testing)
   * Useful for seeing what emails will look like before sending
   */
  static previewTemplate(
    type: TrialNotificationType,
    userData: UserData
  ): EmailTemplate {
    const status = TrialManager.getTrialStatus(userData);
    const template = this.getEmailTemplate(type, userData, status);
    
    // Replace upgrade link for preview
    const upgradeUrl = window.location.origin + '/pricing';
    template.body = template.body.replace(/\[UPGRADE_LINK\]/g, upgradeUrl);
    
    return template;
  }

  /**
   * Test email sending (for development)
   * Sends a test email to verify Mailgun is configured correctly
   */
  static async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      const response = await fetch('/api/send-trial-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: '🧪 Test Email from Pimbot (Mailgun)',
          body: `This is a test email to verify your Mailgun integration is working correctly.

If you received this, congratulations! Your email service is configured properly.

Sent at: ${new Date().toLocaleString()}

- The Pimbot Team`,
          userId: 'test-user',
          notificationType: 'test'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        
        return false;
      }

      const result = await response.json();
      
      return true;
    } catch (error) {
      
      return false;
    }
  }
}

// ========================================
// USAGE EXAMPLES
// ========================================
/*

// Example 1: Check and send notification for a user (call on app load)
const user = await getCurrentUser();
const result = await TrialEmailService.checkAndNotify(user);
if (result.sent) {
  
}

// Example 2: Manually send a specific notification
await TrialEmailService.sendTrialNotification(user, 'trial-3-days');

// Example 3: Preview template before sending
const preview = TrialEmailService.previewTemplate('trial-7-days', user);


// Example 4: Send test email
await TrialEmailService.sendTestEmail('your-email@example.com');

// Example 5: Batch process users (for cron jobs)
const users = await getAllTrialUsers();
const batchResult = await TrialEmailService.checkMultipleUsers(users);


*/

// ========================================
// MAILGUN CONFIGURATION NOTES
// ========================================
/*

ENVIRONMENT VARIABLES (in Vercel):
- MAILGUN_API_KEY: Your Mailgun private API key
- MAILGUN_DOMAIN: sandboxde9fbfd65f19434cafc8e16396aa0ff4.mailgun.org (for testing)
- MAILGUN_API_URL: https://api.mailgun.net
- FROM_EMAIL: noreply@sandboxde9fbfd65f19434cafc8e16396aa0ff4.mailgun.org (for sandbox)

SANDBOX LIMITATIONS:
- Can only send to 5 authorized recipients
- Add authorized recipients in Mailgun dashboard: Sending > Authorized Recipients
- Good for testing, not for production

PRODUCTION SETUP:
1. Add your custom domain in Mailgun (e.g., mg.yourdomain.com)
2. Configure DNS records (MX, TXT, CNAME)
3. Verify domain
4. Update FROM_EMAIL to noreply@yourdomain.com
5. Update MAILGUN_DOMAIN to mg.yourdomain.com

*/