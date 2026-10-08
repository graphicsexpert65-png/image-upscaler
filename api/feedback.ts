/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Vercel Serverless Function & Node.js API Handler
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      rating,
      comment = '',
      scale,
      mode,
      processingTimeMs,
      backendUsed,
      deviceCategory = 'Unknown',
      timestamp = new Date().toISOString(),
    } = body || {};

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid star rating (1-5) is required' });
    }

    const sanitizedComment = String(comment).slice(0, 2000).trim();
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    const feedbackPayload = {
      rating,
      stars,
      comment: sanitizedComment,
      scale,
      mode,
      processingTimeMs,
      backendUsed,
      deviceCategory,
      timestamp,
    };

    console.log('[USER FEEDBACK RECEIVED]', JSON.stringify(feedbackPayload, null, 2));

    // Centralized Webhook Forwarding (Discord, Slack, Formspree, or generic Webhook)
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        let webhookBody: any;

        // Check if Discord Webhook URL
        if (webhookUrl.includes('discord.com/api/webhooks')) {
          webhookBody = {
            username: 'AI Upscaler Feedback',
            embeds: [
              {
                title: `${stars} (${rating}/5 Stars)`,
                description: sanitizedComment ? `"${sanitizedComment}"` : '*No written comment provided*',
                color: rating >= 4 ? 0x38bdf8 : rating === 3 ? 0xf59e0b : 0xef4444,
                fields: [
                  { name: 'Scale Factor', value: `${scale || '?'}×`, inline: true },
                  { name: 'Mode', value: `${mode || 'default'}`, inline: true },
                  { name: 'Processing Time', value: processingTimeMs ? `${(processingTimeMs / 1000).toFixed(1)}s` : 'N/A', inline: true },
                  { name: 'Backend', value: `${backendUsed || 'N/A'}`.toUpperCase(), inline: true },
                  { name: 'Device Category', value: `${deviceCategory}`, inline: true },
                ],
                footer: { text: `Submitted at ${timestamp}` },
              },
            ],
          };
        } else if (webhookUrl.includes('hooks.slack.com')) {
          // Slack Incoming Webhook
          webhookBody = {
            text: `*New Upscaler Feedback: ${stars} (${rating}/5)*\n>${sanitizedComment || '_No comment_'}\n*Scale:* ${scale}× | *Mode:* ${mode} | *Time:* ${(processingTimeMs / 1000).toFixed(1)}s | *Backend:* ${backendUsed}`,
          };
        } else {
          // Generic JSON webhook endpoint (e.g. Formspree, Zapier, custom backend)
          webhookBody = feedbackPayload;
        }

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookBody),
        });

        if (!webhookResponse.ok) {
          console.warn(`Webhook responded with status ${webhookResponse.status}`);
        }
      } catch (webhookErr) {
        console.error('Failed to dispatch webhook notification:', webhookErr);
      }
    }

    return res.status(200).json({ success: true, message: 'Thank you for your feedback!' });
  } catch (err: any) {
    console.error('Feedback submission error:', err);
    return res.status(500).json({ error: 'Failed to process feedback submission' });
  }
}
