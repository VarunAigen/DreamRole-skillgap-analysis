const fs = require('fs');
const path = require('path');

// Dynamically set paths to use the server's node_modules
const serverPath = path.join(__dirname, 'server');
const modulesPath = path.join(serverPath, 'node_modules');

// Helper to require from server's node_modules
function requireServerModule(moduleName) {
    try {
        return require(path.join(modulesPath, moduleName));
    } catch (e) {
        console.error(`Error: Could not find ${moduleName} in server/node_modules.`);
        console.log(`Please run 'npm install' in the server directory first.`);
        process.exit(1);
    }
}

const puppeteer = requireServerModule('puppeteer');

async function generateAuditPDF() {
    console.log('🚀 Starting DreamRole Project Audit PDF generation...');

    const auditContentPath = path.join(__dirname, 'project_audit_content.md');
    if (!fs.existsSync(auditContentPath)) {
        console.error('❌ Error: project_audit_content.md not found.');
        process.exit(1);
    }

    const markdown = fs.readFileSync(auditContentPath, 'utf8');

    // Simple markdown-to-html conversion for the audit report
    // (In a real scenario, we'd use 'marked', but I'll craft a premium HTML template directly)
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DreamRole Project Audit</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --accent: #8b5cf6;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --bg-light: #f8fafc;
        }

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: var(--text-main);
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: white;
        }

        .container {
            max-width: 850px;
            margin: auto;
            padding: 50px;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 30px;
            margin-bottom: 40px;
        }

        .header h1 {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(to right, var(--primary), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
        }

        .header p {
            color: var(--text-muted);
            font-size: 14px;
            margin-top: 10px;
        }

        h2 {
            font-size: 20px;
            font-weight: 700;
            color: var(--primary-dark);
            border-left: 4px solid var(--accent);
            padding-left: 15px;
            margin-top: 40px;
            margin-bottom: 20px;
        }

        h3 {
            font-size: 16px;
            font-weight: 600;
            color: #334155;
            margin-top: 25px;
        }

        p, li {
            font-size: 14px;
            color: #475569;
        }

        ul {
            padding-left: 20px;
        }

        li {
            margin-bottom: 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
        }

        th, td {
            text-align: left;
            padding: 12px;
            border: 1px solid #e2e8f0;
        }

        th {
            background-color: var(--bg-light);
            font-weight: 600;
        }

        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 11px;
            color: var(--text-muted);
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            background: #e0e7ff;
            color: #4338ca;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }

        hr {
            border: 0;
            border-top: 1px solid #f1f5f9;
            margin: 40px 0;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .feature-card {
            padding: 15px;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            background: var(--bg-light);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DreamRole Project Audit</h1>
            <p>Comprehensive technical breakdown and current implementation status</p>
            <p style="font-size: 12px;">Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
        </div>

        ${markdown
            .replace(/^# (.*)/gm, '<!-- skip main title -->')
            .replace(/^## (.*)/gm, '<h2>$1</h2>')
            .replace(/^### (.*)/gm, '<h3>$1</h3>')
            .replace(/^\- (.*)/gm, '<li>$1</li>')
            .replace(/\[x\] (.*)/g, '<span class="badge" style="background:#dcfce7;color:#166534;">COMMITTED</span> $1')
            .replace(/\[ \] (.*)/g, '<span class="badge" style="background:#fef3c7;color:#92400e;">PLANNED</span> $1')
            .split('---').map(section => `<div>${section}</div>`).join('<hr>')}

        <div class="footer">
            DreamRole Skill Gap Analysis Platform &bull; Proprietary Technical Documentation &bull; 2026
        </div>
    </div>
</body>
</html>`;

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const outputPath = path.join(__dirname, 'DreamRole_Project_Audit.pdf');
    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '10px', left: '20px' }
    });

    await browser.close();
    console.log(`✅ Success! PDF generated at: ${outputPath}`);
}

generateAuditPDF().catch(err => {
    console.error('❌ PDF Generation Failed:', err);
    process.exit(1);
});
