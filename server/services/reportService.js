/**
 * Helper to launch Puppeteer browser safely across local dev and Vercel serverless functions.
 */
async function launchBrowser() {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        try {
            const chromium = require('@sparticuz/chromium');
            const puppeteerCore = require('puppeteer-core');
            return await puppeteerCore.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true
            });
        } catch (e) {
            console.warn('[ReportService] Chromium serverless launch failed, trying puppeteer fallback:', e.message);
        }
    }
    const puppeteer = require('puppeteer');
    return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
}

/**
 * Generate a PDF report from analysis data.
 * @param {Object} data - Report data
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generatePDFReport(data) {
    const {
        role = 'Unknown Role',
        alignment_stage = 'Developing Stage',
        detected_skills = [],
        missing_skills = [],
        matched_skills = [],
        feedback = '',
        weak_areas = [],
        resume_improvements = [],
        projects = [],
        certifications = [],
        date = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })
    } = data;

    const stageColor = {
        'Foundation Stage': '#f59e0b',
        'Developing Stage': '#3b82f6',
        'Skilled Stage': '#8b5cf6',
        'Role Ready Stage': '#10b981'
    }[alignment_stage] || '#3b82f6';

    const skillTag = (skill, color = '#dbeafe', textColor = '#1e40af') =>
        `<span style="background:${color};color:${textColor};padding:3px 10px;border-radius:20px;font-size:12px;margin:3px;display:inline-block;">${skill}</span>`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #f8fafc; padding: 40px; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 32px; border-radius: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 28px; font-weight: 800; }
    .header p { font-size: 14px; opacity: 0.85; margin-top: 6px; }
    .stage-badge { display: inline-block; background: ${stageColor}; color: white; padding: 6px 18px; border-radius: 30px; font-size: 14px; font-weight: 700; margin-top: 12px; }
    .role-name { font-size: 18px; font-weight: 600; margin-top: 8px; opacity: 0.9; }
    .section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 15px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
    .feedback-text { font-size: 14px; line-height: 1.75; color: #374151; background: #f0f9ff; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .project-item { padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px; }
    .project-title { font-size: 13px; font-weight: 600; color: #1e293b; }
    .project-link { font-size: 11px; color: #4f46e5; text-decoration: none; word-break: break-all; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 DreamRole Career Report</h1>
    <p>Generated on ${date}</p>
    <div class="role-name">🎯 Target Role: ${role}</div>
    <div class="stage-badge">${alignment_stage}</div>
  </div>

  <div class="section">
    <div class="section-title">💡 AI Analysis</div>
    <div class="feedback-text">${feedback || 'Resume analyzed successfully. Keep building your skills!'}</div>
    ${weak_areas.length > 0 ? `
      <div style="margin-top: 16px;">
        <h4 style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 8px;">Focus Areas</h4>
        <div>${weak_areas.map(area => `<span style="background:#fffbeb;color:#b45309;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid #fcd34d;margin-right:6px;display:inline-block;margin-bottom:6px;">${area}</span>`).join('')}</div>
      </div>
    ` : ''}
    ${resume_improvements.length > 0 ? `
      <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <h4 style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 8px;">Actionable Resume Improvements</h4>
        <ul style="font-size: 13px; color: #374151; padding-left: 20px; line-height: 1.6;">
          ${resume_improvements.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  </div>

  <div class="two-col">
    <div class="section">
      <div class="section-title">✅ Detected Skills</div>
      <div>${detected_skills.map(s => skillTag(s, '#d1fae5', '#065f46')).join('') || '<em style="color:#94a3b8">None detected</em>'}</div>
    </div>
    <div class="section">
      <div class="section-title">⚡ Skills to Develop</div>
      <div>${missing_skills.map(s => skillTag(s, '#fee2e2', '#991b1b')).join('') || '<em style="color:#94a3b8">None – great job!</em>'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🚀 Recommended Projects</div>
    ${projects.slice(0, 4).map(p => `
      <div class="project-item">
        <div class="project-title">${p.title}</div>
        <div style="font-size:12px;color:#64748b;margin:4px 0;">${(p.description || '').substring(0, 120)}${(p.description || '').length > 120 ? '...' : ''}</div>
        ${p.github && p.github.trim() ? `<a class="project-link" href="${p.github.trim()}" style="color:#4f46e5;text-decoration:underline;font-size:11px;word-break:break-all;display:block;margin-top:4px;">🔗 ${p.github.trim()}</a>` : '<span style="font-size:11px;color:#94a3b8;">No GitHub link available</span>'}
      </div>
    `).join('') || '<em style="color:#94a3b8">No projects available for this role</em>'}
  </div>

  <div class="section">
    <div class="section-title">🏆 Recommended Certifications</div>
    ${certifications.slice(0, 4).map(c => `
      <div class="project-item">
        <div class="project-title">${c.title}</div>
        <div style="font-size:12px;color:#64748b;margin:4px 0;font-weight:600;">${c.platform || ''}</div>
        ${c.link && c.link.trim() ? `<a class="project-link" href="${c.link.trim()}" style="color:#4f46e5;text-decoration:underline;font-size:11px;word-break:break-all;display:block;margin-top:4px;">🔗 ${c.link.trim()}</a>` : '<span style="font-size:11px;color:#94a3b8;">No link available</span>'}
      </div>
    `).join('') || '<em style="color:#94a3b8">No certifications available for this role</em>'}
  </div>

  <div class="footer">
    Generated by DreamRole – Skill Gap Analysis Platform &bull; ${new Date().toISOString()}
  </div>
</body>
</html>`;

    const browser = await launchBrowser();

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = { generatePDFReport };
