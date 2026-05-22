import { Resend } from "resend";

// Lazy initialize Resend — only create client when API key is present
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not set. Email functionality will not work.",
      );
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export type EmailType =
  | "DAY_1_WELCOME"
  | "DAY_2_EDUCATION"
  | "DAY_4_REINFORCEMENT"
  | "DAY_6_PUSH"
  | "DAY_7_CONVERSION";

interface EmailPayload {
  to: string;
  name: string;
  emailType: EmailType;
  energyLevel?: number; // For personalization (1-10)
  sorenessLevel?: number;
}

/**
 * Get email template based on type
 * Each email includes personalization hooks and clear CTAs
 */
function getEmailTemplate(
  emailType: EmailType,
  name: string,
  energyLevel?: number,
  sorenessLevel?: number,
): { subject: string; html: string } {
  const firstName = name.split(" ")[0];

  const templates: Record<EmailType, { subject: string; html: string }> = {
    DAY_1_WELCOME: {
      subject: `Welcome to Your 7-Day Oversight Trial, ${firstName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome, ${firstName}!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your 7-Day Oversight Trial Starts Now</p>
          </div>
          
          <div style="padding: 40px 20px; background: #f9f9f9;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              You're about to experience <strong>personalized coaching</strong> tailored to your body's recovery and performance.
            </p>

            <h2 style="font-size: 20px; margin: 30px 0 15px 0; color: #667eea;">What to Expect Over the Next 7 Days:</h2>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Daily Recovery Tracking:</strong> Log your energy, soreness, sleep, and vitals</li>
              <li><strong>Personalized Guidance:</strong> Receive training recommendations based on YOUR data</li>
              <li><strong>Expert Insights:</strong> Understand how recovery drives performance</li>
              <li><strong>Actionable Strategies:</strong> Learn what separates elite coaches from the rest</li>
            </ul>

            <p style="font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
              This trial is <strong>NOT</strong> a generic program. It's oversight—real coaching based on your daily metrics.
            </p>

            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Ready to get started?</strong> Log into your dashboard and submit today's recovery metrics. Your first personalized insight will arrive tomorrow.
              </p>
            </div>

            <a href="${process.env.SITE_URL}/dashboard" 
               style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
              Go to Dashboard
            </a>

            <p style="margin-top: 30px; font-size: 14px; color: #999; line-height: 1.6;">
              Questions? Reply directly to this email or visit our support page.<br>
              Let's get you on the path to elite performance.
            </p>
          </div>

          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© Big Ron Jones Coaching • Day 1 of 7</p>
          </div>
        </div>
      `,
    },

    DAY_2_EDUCATION: {
      subject: `The Recovery Formula: Why Most Athletes Get This Wrong`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Day 2: The Recovery Formula</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f9f9f9;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              ${firstName}, here's what separates elite coaches from amateur trainers:
            </p>

            <h2 style="font-size: 18px; margin: 25px 0 15px 0; color: #667eea;">Most people focus on training.</h2>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; padding: 15px 20px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
              <strong>They get results—for a while.</strong> Then they plateau. Then they get injured. Then they quit.
            </p>

            <h2 style="font-size: 18px; margin: 25px 0 15px 0; color: #667eea;">Elite coaches focus on recovery.</h2>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Here's the formula:
            </p>

            <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; text-align: center; font-weight: bold; color: #667eea;">
                Training × Recovery = Performance
              </p>
              <p style="margin: 15px 0 0 0; font-size: 13px; text-align: center; color: #666;">
                Without recovery, training is just damage. <br>
                With recovery, training is adaptation.
              </p>
            </div>

            <h2 style="font-size: 18px; margin: 25px 0 15px 0; color: #667eea;">What You're Learning This Week:</h2>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Why sleep is your #1 performance drug</li>
              <li>How to read your body's signals (HRV, soreness, energy)</li>
              <li>The 3 metrics that predict overtraining before injury</li>
              <li>Strategic recovery protocols for sustainable gains</li>
            </ul>

            <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #666;">
              <strong>Check your dashboard today</strong> for your personalized training recommendation based on your recovery metrics from Day 1.
            </p>

            <a href="${process.env.SITE_URL}/dashboard" 
               style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
              View Your Insight
            </a>
          </div>

          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© Big Ron Jones Coaching • Day 2 of 7</p>
          </div>
        </div>
      `,
    },

    DAY_4_REINFORCEMENT: {
      subject: `You're Halfway There—Here's What's Working`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Halfway There, ${firstName}</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f9f9f9;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              You've made it to Day 4. You're tracking your metrics. You're seeing the data.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>Now it gets real.</strong>
            </p>

            <h2 style="font-size: 18px; margin: 25px 0 15px 0; color: #667eea;">What We're Seeing in Your Data:</h2>
            
            ${
              sorenessLevel && sorenessLevel > 6
                ? `
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; padding: 15px 20px; background: #d4edff; border-radius: 4px; border-left: 4px solid #0066cc;">
                <strong>Your soreness is elevated.</strong> This is a sign to dial back intensity and prioritize sleep and mobility work.
              </p>
            `
                : ``
            }

            ${
              energyLevel && energyLevel < 5
                ? `
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; padding: 15px 20px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
                <strong>Your energy is low.</strong> This might indicate insufficient recovery, dehydration, or overtraining. Adjust today's training accordingly.
              </p>
            `
                : ``
            }

            <p style="font-size: 14px; line-height: 1.6; margin: 20px 0;">
              The most successful athletes aren't the ones who push hardest. They're the ones who know when NOT to push.
            </p>

            <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid #667eea; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">Your Last 3 Days (Summary):</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Avg Energy: ${energyLevel ? energyLevel.toFixed(1) : "—"}/10</li>
                <li>Avg Soreness: ${sorenessLevel ? sorenessLevel.toFixed(1) : "—"}/10</li>
                <li>Days Tracked: 3/4</li>
              </ul>
            </div>

            <h2 style="font-size: 18px; margin: 25px 0 15px 0; color: #667eea;">For Days 5–7:</h2>
            <p style="font-size: 14px; line-height: 1.6; margin: 0;">
              Keep tracking consistently. Small changes in your recovery metrics predict big wins in performance. Your final recommendation arrives on Day 7.
            </p>

            <a href="${process.env.SITE_URL}/dashboard" 
               style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
              View Your Analysis
            </a>
          </div>

          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© Big Ron Jones Coaching • Day 4 of 7</p>
          </div>
        </div>
      `,
    },

    DAY_6_PUSH: {
      subject: `${firstName}, Two Days Left—Let's Lock This In`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Two Days Left</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f9f9f9;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              You're 86% of the way through your trial. You've logged your metrics. You've learned the principles. You've seen what oversight coaching actually looks like.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; color: #667eea; font-weight: bold;">
              Now comes the hardest part: committing to the transformation.
            </p>

            <h2 style="font-size: 18px; margin: 25px 0 15px 0; color: #667eea;">Here's What's Possible</h2>
            <p style="font-size: 14px; line-height: 1.8; margin: 0 0 15px 0;">
              Athletes who join the full program report:
            </p>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.9;">
              <li>30–40% improvement in strength gains per month</li>
              <li>Better sleep quality and consistent energy</li>
              <li>Fewer injuries and faster recovery</li>
              <li>Clear understanding of their performance limits</li>
            </ul>

            <p style="font-size: 14px; line-height: 1.6; margin: 20px 0;">
              But only if they have the RIGHT coach. The one who knows you. The one who sees your data.
            </p>

            <div style="background: #f0e6ff; padding: 25px; border-radius: 8px; border: 2px solid #667eea; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 16px;">Special Offer for Trial Members</h3>
              <p style="margin: 0 0 15px 0; font-size: 14px;">
                Join the full program this month and receive a <strong>30% discount</strong> on your first 3 months.
              </p>
              <p style="margin: 0; font-size: 13px; color: #666;">
                This offer expires when your trial ends.
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; margin: 20px 0;">
              Log your metrics today. Tomorrow, you'll get your final analysis and the option to continue.
            </p>

            <a href="${process.env.SITE_URL}/dashboard" 
               style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
              Complete Your Trial
            </a>
          </div>

          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© Big Ron Jones Coaching • Day 6 of 7</p>
          </div>
        </div>
      `,
    },

    DAY_7_CONVERSION: {
      subject: `Your 7-Day Trial is Complete—Next Steps`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You Did It, ${firstName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">7 Days of Real Oversight</p>
          </div>
          
          <div style="padding: 40px 20px; background: #f9f9f9;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              You've completed your trial. You've tracked your metrics. You've learned from real data.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>Here's your final analysis:</strong>
            </p>

            <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid #667eea; margin: 20px 0;">
              <h3 style="margin: 0 0 20px 0; color: #667eea; font-size: 16px;">Your 7-Day Insights</h3>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.9;">
                <li><strong>Avg Energy:</strong> ${energyLevel ? energyLevel.toFixed(1) : "—"}/10</li>
                <li><strong>Avg Soreness:</strong> ${sorenessLevel ? sorenessLevel.toFixed(1) : "—"}/10</li>
                <li><strong>Pattern:</strong> You now know your recovery baseline</li>
                <li><strong>Next Step:</strong> Optimize your training around this data</li>
              </ul>
            </div>

            <h2 style="font-size: 18px; margin: 25px 0 15px 0; color: #667eea;">What Happens Next</h2>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
              You have two options:
            </p>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Option 1: Continue as a Full Member</h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                Join our full coaching program and get personalized training plans, weekly check-ins, and data-driven recovery protocols.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #333;">
                First 3 months: 30% off (Trial Member Pricing)
              </p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #667eea; margin: 15px 0;">
              <a href="https://buy.stripe.com/3cIbJ0djw9QUbzn3HMdUY0p" 
                 style="display: block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center;">
                Upgrade to Full Program
              </a>
            </div>

            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4caf50;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Option 2: Stay Connected</h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                If you're not ready yet, that's okay. We'll send you insights and recovery tips to keep you on track.
              </p>
            </div>

            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #ddd;">
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666;">
                <strong>One Last Thing:</strong> Your data from this trial is yours to keep. Use these insights to fuel your next phase, wherever that takes you.
              </p>
            </div>

            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666;">
              Questions? Hit reply or visit our support page. <br>
              <strong>Thanks for training with us.</strong>
            </p>
          </div>

          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© Big Ron Jones Coaching • Trial Complete</p>
          </div>
        </div>
      `,
    },
  };

  return templates[emailType];
}

/**
 * Send a single email to user
 * Handles Resend API call and error logging
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      console.error("Missing Resend configuration");
      return false;
    }

    const template = getEmailTemplate(
      payload.emailType,
      payload.name,
      payload.energyLevel,
      payload.sorenessLevel,
    );

    const response = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: payload.to,
      subject: template.subject,
      html: template.html,
    });

    if (response.error) {
      console.error(
        `Failed to send ${payload.emailType} to ${payload.to}:`,
        response.error,
      );
      return false;
    }

    console.log(
      `✓ Email sent: ${payload.emailType} to ${payload.to} (ID: ${response.data?.id})`,
    );
    return true;
  } catch (error) {
    console.error(`Error sending email ${payload.emailType}:`, error);
    return false;
  }
}
