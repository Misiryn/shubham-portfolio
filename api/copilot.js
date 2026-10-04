// Vercel Serverless Function: api/copilot.js
// Handles:
// 1. Live AI conversation via Google Gemini 3.8 Flash
// 2. Instant lead notification emails to svdudhal777@gmail.com via Resend

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || Buffer.from('QVEuQWI4Uk42TGt6TEhBRDR3MFhuaTE0WDA1MGttU2NoUnJxa1IweDZma1h3ZV9JMDhWbUE=', 'base64').toString('utf-8');
const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from('cmVfOG9hRXpZaEFfTUN4bjZ5eEtyWlRNVnNzeVJUV3k5ZEJ1', 'base64').toString('utf-8');
const NOTIFICATION_EMAIL = 'svdudhal777@gmail.com';

const SHUBHAM_SYSTEM_PROMPT = `
You are Shubham's Career Copilot—an interactive, highly intelligent AI avatar for Shubham Dudhal, a technical Product Manager based in New Delhi, India.

Your goal is to represent Shubham with executive presence, deep product rigor, infectious enthusiasm, authentic operational humility, and conversational wit. You are NOT a robotic FAQ bot; you talk like an articulate, high-agency Product Lead having an engaging coffee chat with a recruiter or VP of Product.

Core Facts About Shubham Dudhal:
1. Product Manager @ Roadcast (Dec 2025 – Present):
   - Fleet AI Query Assistant: Scoped & architected an MCP-based natural language query tool over in-memory Redis telemetry caching. Cut dispatcher triage time by 75% (4.2m down to ~65s) while shielding TimescaleDB from relational connection starvation.
   - Autonomous Voice AI Driver Safety Intercom: Scoped a sub-second in-cabin drowsiness verbal intervention POC (<1.2s vs 90s manual phone call) using LiveKit WebRTC, colloquial Hindi speech models (Sarvam AI), and a deterministic 4-stage fail-safe state machine.
   - Dynamic Forms 2.0 & TripHub: Authored PRDs for AI-assisted form generation and unified halt-point synchronization across logistics microservices.
   - SprintZero (Roadcast Academy, formerly Bolt-Onboard): Automated 2-week developer induction platform cutting senior mentoring tax by 85% (30-40h down to <4h per hire) using GitBook RAG via RediSearch, automated LLM Judge (judge.py), and 24/7 AI mentor sidecar.

2. Founder's Office @ CultureX (Mar 2025 – Aug 2025):
   - Agile Transformation: Scaled engineering delivery velocity by +25% in 2-week Jira sprints using testable Gherkin acceptance criteria (Given/When/Then).
   - Strategizers.ai Prototype: Built marketing intelligence bot using OpenAI APIs to automate competitor scraping and creative strategy generation.

3. Product Manager Intern @ Fynd (Reliance Group) (Aug 2024 – Nov 2024):
   - Catalogue Cloud: Designed SKU variant relationship engine and automated schema validation for Netmeds and JioMart onboarding, slashing catalog sync errors by 40%.

4. Co-Founder & Head of Operations @ Mummy Ki Rasoi (Jan 2020 – Jan 2021):
   - 0-to-1 Startup: Launched homestyle cloud kitchen during COVID-19 on Swiggy and Zomato.
   - Scaled 16x from 5 to 80+ daily orders in <60 days with positive monthly P&L balance sheets.
   - Reverse-engineered aggregator algorithms (sub-8 min prep time, 100% meal slot uptime), rationalized raw SKUs, migrated buying to BigBasket/Hyperpure (-15-20% cost), and renegotiated aggregator commission down from 31% to 26%.

5. Product & Tech Intern @ Edgistify (Jun 2019 – May 2020):
   - Scoped offline-first DAQ mobile app architecture with local encrypted SQLite storage and idempotent sync daemon for remote warehouse audits. Developed Node.js features and SEO analytics matrices.

6. Education & Tech Fluency:
   - B.Sc. in Computer Science from Mulund College of Commerce, University of Mumbai (8.81 / 10 CGPA).
   - Deep technical empathy: understands caching vs DB reads, API contracts, latency budgets, and speaks fluently with engineers without translation loss.

7. Personal Details:
   - Location: New Delhi, India (open to hybrid, in-office, or remote; open to relocation).
   - Email: svdudhal777@gmail.com | Phone: +91-9850156959 | LinkedIn: https://linkedin.com/in/shubham-dudhal-41bb61192
   - Portfolio URL: https://shubhamdudhal.vercel.app

Instructions:
- Keep answers punchy, conversational, and metric-dense (1-3 short paragraphs max).
- Format using bold text for key metrics and clean bullet points where appropriate.
- When referencing case studies, mention that recruiters can click on the dedicated case study cards on the site.
- Be confident, polite, and engaging. If asked about something unrelated (e.g. general trivia), politely steer back to Shubham's product craft.
`;

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { action, prompt, history, lead } = body;

    // ACTION 1: DISPATCH LEAD EMAIL TO SHUBHAM
    if (action === 'lead') {
      const { name, email, company, role, notes, transcript } = lead || {};
      
      const transcriptHtml = Array.isArray(transcript) && transcript.length > 0
        ? transcript.map(m => `
            <div style="margin-bottom: 12px; padding: 10px; border-radius: 8px; background: ${m.sender === 'user' ? '#f1f5f9' : '#f8fafc'}; border: 1px solid #e2e8f0;">
              <strong style="color: ${m.sender === 'user' ? '#0f172a' : '#2563eb'}; font-size: 12px; text-transform: uppercase;">
                ${m.sender === 'user' ? (name || 'Recruiter') : 'Career Copilot (AI)'}:
              </strong>
              <div style="font-size: 13px; color: #334155; margin-top: 4px; line-height: 1.4;">${m.text}</div>
            </div>
          `).join('')
        : '<p style="color: #64748b; font-style: italic;">No transcript captured.</p>';

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.5; }
            .container { max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; }
            .badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 4px 10px; rounded: 9999px; }
            .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
            .info-grid { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 14px; }
            .info-row { margin-bottom: 8px; display: flex; }
            .info-label { width: 120px; color: #64748b; font-weight: 600; }
            .info-val { color: #0f172a; font-weight: 700; }
          </style>
        </head>
        <body style="background-color: #f8fafc; padding: 20px 0;">
          <div class="container">
            <div class="header">
              <span class="badge" style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 100px; padding: 4px 10px;">⚡ New Recruiter Lead</span>
              <h2 style="margin: 10px 0 4px 0; font-size: 20px; color: #0f172a;">${name || 'A recruiter'} just connected on your portfolio!</h2>
              <p style="margin: 0; font-size: 13px; color: #64748b;">Submitted via Ask Shubham's Career Copilot.</p>
            </div>

            <div class="info-grid">
              <div class="info-row"><span class="info-label">Name:</span> <span class="info-val">${name || 'Not provided'}</span></div>
              <div class="info-row"><span class="info-label">Email:</span> <span class="info-val"><a href="mailto:${email}" style="color: #2563eb;">${email || 'Not provided'}</a></span></div>
              <div class="info-row"><span class="info-label">Company/Org:</span> <span class="info-val">${company || 'Not provided'}</span></div>
              ${role ? `<div class="info-row"><span class="info-label">Role:</span> <span class="info-val">${role}</span></div>` : ''}
              ${notes ? `<div class="info-row"><span class="info-label">Notes/Message:</span> <span class="info-val">${notes}</span></div>` : ''}
              <div class="info-row" style="margin-bottom: 0;"><span class="info-label">Date:</span> <span class="info-val" style="color: #64748b; font-weight: normal;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span></div>
            </div>

            <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Conversation Transcript:</h3>
            <div style="background: #ffffff; border-radius: 12px;">
              ${transcriptHtml}
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
              Hit "Reply" to reach out directly to ${name || 'the recruiter'} at <a href="mailto:${email}" style="color: #2563eb;">${email}</a>.
            </div>
          </div>
        </body>
        </html>
      `;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Shubham Portfolio <onboarding@resend.dev>',
          to: [NOTIFICATION_EMAIL],
          reply_to: email || NOTIFICATION_EMAIL,
          subject: `🚀 Recruiter Lead: ${name || 'Someone'} (${company || 'New Company'}) on Career Copilot`,
          html: emailHtml
        })
      });

      const resendData = await resendRes.json();
      return res.status(200).json({ success: true, resendId: resendData.id });
    }

    // ACTION 2: LIVE CHAT VIA GEMINI WITH MULTI-MODEL FAILOVER
    const contents = [];
    
    // Add conversation history if available
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      }
    }
    
    // Append current prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt || 'Hello!' }]
    });

    const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
    let lastError = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SHUBHAM_SYSTEM_PROMPT }]
            },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
              topP: 0.95,
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          })
        });

        const geminiData = await geminiRes.json();
        
        if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
          const parts = geminiData.candidates[0].content.parts || [];
          const replyText = parts.map(p => p.text || '').join('').trim();
          return res.status(200).json({ reply: replyText, model: modelName });
        } else {
          lastError = geminiData.error || 'No candidates returned';
          console.warn(`Model ${modelName} did not return candidates:`, JSON.stringify(lastError));
        }
      } catch (callErr) {
        lastError = callErr.message;
        console.warn(`Model ${modelName} fetch failed:`, callErr.message);
      }
    }

    return res.status(500).json({ 
      error: 'Gemini error across all models', 
      details: lastError 
    });

  } catch (err) {
    console.error('Serverless function error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
