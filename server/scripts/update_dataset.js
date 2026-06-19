require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const STATUS_PATH = path.join(__dirname, '../datasets/update_status.json');
const CHECKPOINT_PATH = path.join(__dirname, '../datasets/update_checkpoint.json');
const COMPREHENSIVE_CSV_PATH = path.join(__dirname, '../datasets/tech_jobs_comprehensive_dataset.csv');
const CAREER_CSV_PATH = path.join(__dirname, '../datasets/career_roles_skills_dataset.csv');

/**
 * Dynamically reads the existing career_roles_skills_dataset.csv to find all configured roles.
 */
function getRolesFromCSV() {
    return new Promise((resolve, reject) => {
        const roles = [];
        if (!fs.existsSync(CAREER_CSV_PATH)) {
            resolve([]);
            return;
        }
        fs.createReadStream(CAREER_CSV_PATH)
            .pipe(csv())
            .on('data', (row) => {
                const role = row['role']?.trim();
                if (role && !roles.includes(role)) {
                    roles.push(role);
                }
            })
            .on('end', () => {
                resolve(roles);
            })
            .on('error', reject);
    });
}

// List of target roles to keep updated
const TARGET_ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Analyst",
    "Data Scientist",
    "Data Engineer",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Mobile App Developer",
    "Cybersecurity Analyst",
    "AI Engineer",
    "Database Engineer",
    "MLOps Engineer",
    "Blockchain Developer",
    "Site Reliability Engineer"
];

/**
 * Escapes fields for CSV output according to RFC 4180
 */
function escapeCSVField(field) {
    if (field === null || field === undefined) return '""';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return `"${stringField}"`;
}

async function fetchRolesDataFromGemini(roles) {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is not defined in server/.env');
    }

    const prompt = `You are a professional IT career data expert. Generate updated career paths, core skills, recommended projects, and certifications for the following IT roles:
${roles.join(', ')}

For EACH role, you MUST generate a deep-dive list of EXACTLY 6 distinct, diverse, and realistic projects using different technologies, frameworks, and tools related to the role, and EXACTLY 6 credible, real-world industry certifications (from AWS, Microsoft, GCP, Cisco, CompTIA, Meta, Google, freeCodeCamp, Udemy, Coursera, etc.).
Ensure projects have realistic open-source template GitHub repository URLs.

You MUST return ONLY a valid JSON object matching this structure (no markdown wrapper, no explanation):
{
  "roles_data": [
    {
      "role": "Role Name",
      "domain": "Domain Name (e.g. Frontend Development, Backend Development, AI/ML, Data, Cloud & DevOps, Cybersecurity)",
      "core_skills": "Skill1, Skill2, Skill3, Skill4, Skill5, Skill6",
      "programming_languages": "Lang1, Lang2...",
      "frameworks_and_libraries": "Framework1, Framework2...",
      "tools_and_technologies": "Tool1, Tool2, Tool3, Tool4",
      "platforms_and_cloud": "Platform1, Platform2...",
      "methodologies_and_practices": "Practice1, Practice2...",
      "soft_skills": "SoftSkill1, SoftSkill2...",
      "optional_advanced_skills": "AdvSkill1, AdvSkill2",
      "years_to_entry_level": "1-2",
      "learning_path": [
        "Step 1: Focus on learning language fundamentals...",
        "Step 2: Learn frameworks and system design basics...",
        "Step 3: Build a production portfolio project and apply..."
      ],
      "projects": [
        {
          "title": "Realistic Project Title 1",
          "description": "A 2-3 sentence project description explaining the architectural stack and features.",
          "github": "https://github.com/example/project-repo-1"
        },
        {
          "title": "Realistic Project Title 2",
          "description": "Another project description.",
          "github": "https://github.com/example/project-repo-2"
        },
        {
          "title": "Realistic Project Title 3",
          "description": "Another project description.",
          "github": "https://github.com/example/project-repo-3"
        },
        {
          "title": "Realistic Project Title 4",
          "description": "Another project description.",
          "github": "https://github.com/example/project-repo-4"
        },
        {
          "title": "Realistic Project Title 5",
          "description": "Another project description.",
          "github": "https://github.com/example/project-repo-5"
        },
        {
          "title": "Realistic Project Title 6",
          "description": "Another project description.",
          "github": "https://github.com/example/project-repo-6"
        }
      ],
      "certifications": [
        {
          "title": "Certification Title 1",
          "provider": "Provider Name",
          "link": "https://example.com/certification-1"
        },
        {
          "title": "Certification Title 2",
          "provider": "Provider Name",
          "link": "https://example.com/certification-2"
        },
        {
          "title": "Certification Title 3",
          "provider": "Provider Name",
          "link": "https://example.com/certification-3"
        },
        {
          "title": "Certification Title 4",
          "provider": "Provider Name",
          "link": "https://example.com/certification-4"
        },
        {
          "title": "Certification Title 5",
          "provider": "Provider Name",
          "link": "https://example.com/certification-5"
        },
        {
          "title": "Certification Title 6",
          "provider": "Provider Name",
          "link": "https://example.com/certification-6"
        }
      ]
    }
  ]
}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = null;
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        for (const model of modelsToTry) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            };

            try {
                console.log(`📡 Attempt ${attempt}/${MAX_RETRIES} - Sending request to Gemini API (Model: ${model})...`);
                const response = await axios.post(url, requestBody, {
                    headers: { 'Content-Type': 'application/json' }
                });

                const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (candidateText) {
                    console.log(`✅ Gemini API call succeeded with model: ${model}`);
                    return JSON.parse(candidateText.trim());
                }
            } catch (err) {
                console.warn(`⚠️ Model ${model} call failed (Status: ${err.response?.status || err.message}).`);
                lastError = err;
            }
        }
        if (attempt < MAX_RETRIES) {
            const delay = attempt * 10000;
            console.log(`⏳ Waiting ${delay/1000}s before next attempt...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    throw new Error(`All Gemini attempts failed. Last error: ${lastError?.response?.data?.error?.message || lastError?.message}`);
}

/**
 * Updates the CSV files with the new Gemini generated role dataset
 */
async function updateCSVFiles(apiData) {
    const rolesData = apiData.roles_data;
    if (!rolesData || !Array.isArray(rolesData)) {
        throw new Error('Parsed API data does not contain roles_data array');
    }

    console.log(`📝 Processing data for ${rolesData.length} roles...`);

    // 1. Update career_roles_skills_dataset.csv
    let careerCsvContent = 'id,role,domain,core_skills,programming_languages,frameworks_and_libraries,tools_and_technologies,platforms_and_cloud,methodologies_and_practices,soft_skills,optional_advanced_skills,years_to_entry_level,learning_path_step1,learning_path_step2,learning_path_step3\n';
    rolesData.forEach((roleObj, idx) => {
        const id = idx + 1;
        const row = [
            id,
            roleObj.role,
            roleObj.domain,
            roleObj.core_skills,
            roleObj.programming_languages,
            roleObj.frameworks_and_libraries,
            roleObj.tools_and_technologies,
            roleObj.platforms_and_cloud,
            roleObj.methodologies_and_practices,
            roleObj.soft_skills,
            roleObj.optional_advanced_skills,
            roleObj.years_to_entry_level,
            roleObj.learning_path?.[0] || '',
            roleObj.learning_path?.[1] || '',
            roleObj.learning_path?.[2] || ''
        ];
        careerCsvContent += row.map(escapeCSVField).join(',') + '\n';
    });

    fs.writeFileSync(CAREER_CSV_PATH, careerCsvContent, 'utf8');
    console.log(`✅ Updated: ${CAREER_CSV_PATH}`);

    // 2. Update tech_jobs_comprehensive_dataset.csv
    let compCsvContent = '"job_role","required_skills","project_name","project_description","project_github_link","certification_name","certification_provider","certification_link"\n';
    rolesData.forEach((roleObj) => {
        const projects = roleObj.projects || [];
        const certs = roleObj.certifications || [];
        const maxLen = Math.max(projects.length, certs.length);

        for (let i = 0; i < maxLen; i++) {
            const p = projects[i] || {};
            const c = certs[i] || {};
            const row = [
                roleObj.role,
                [roleObj.core_skills, roleObj.programming_languages, roleObj.frameworks_and_libraries].filter(Boolean).join(', '),
                p.title || '',
                p.description || '',
                p.github || '',
                c.title || '',
                c.provider || '',
                c.link || ''
            ];
            compCsvContent += row.map(escapeCSVField).join(',') + '\n';
        }
    });

    fs.writeFileSync(COMPREHENSIVE_CSV_PATH, compCsvContent, 'utf8');
    console.log(`✅ Updated: ${COMPREHENSIVE_CSV_PATH}`);
}

/**
 * Saves the accumulated roles data to the checkpoint file.
 */
function saveCheckpoint(allRolesData) {
    try {
        fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify({ roles_data: allRolesData }, null, 2), 'utf8');
    } catch (e) {
        console.warn('⚠️ Could not save checkpoint:', e.message);
    }
}

/**
 * Main execution function
 */
async function runUpdate() {
    try {
        console.log('🏁 Starting Dataset Update via Gemini API...');
        
        // Dynamically load the list of roles to update to preserve all 100+ roles configured in the database
        let rolesList = await getRolesFromCSV();
        if (rolesList.length === 0) {
            console.warn('⚠️ No roles found in career_roles_skills_dataset.csv, falling back to basic TARGET_ROLES');
            rolesList = TARGET_ROLES;
        }
        
        // Load checkpoint if exists (resume from previous run)
        let allRolesData = [];
        let completedRoles = new Set();
        if (fs.existsSync(CHECKPOINT_PATH)) {
            try {
                const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'));
                if (Array.isArray(checkpoint.roles_data) && checkpoint.roles_data.length > 0) {
                    allRolesData = checkpoint.roles_data;
                    completedRoles = new Set(allRolesData.map(r => r.role));
                    console.log(`♻️ Resuming from checkpoint: ${allRolesData.length} roles already completed.`);
                }
            } catch (e) {
                console.warn('⚠️ Could not read checkpoint, starting fresh.');
            }
        }

        // Filter out already-completed roles
        const remainingRoles = rolesList.filter(r => !completedRoles.has(r));
        console.log(`📋 ${rolesList.length} total roles. ${remainingRoles.length} remaining to process.`);
        
        const batchSize = 3;
        
        for (let i = 0; i < remainingRoles.length; i += batchSize) {
            const batch = remainingRoles.slice(i, i + batchSize);
            const currentBatchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(remainingRoles.length / batchSize);
            
            // Add a delay between requests to stay safely within Gemini's 15 RPM free tier rate limit
            if (i > 0) {
                console.log(`⏱️ Waiting 10 seconds to respect Gemini API rate limits...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            
            console.log(`📦 Processing batch ${currentBatchNum} of ${totalBatches}: ${batch.join(', ')}`);
            
            const batchData = await fetchRolesDataFromGemini(batch);
            if (batchData && Array.isArray(batchData.roles_data)) {
                allRolesData.push(...batchData.roles_data);
                console.log(`✅ Batch ${currentBatchNum} finished successfully. Accumulated ${allRolesData.length} roles so far.`);
                // Save checkpoint after every batch so progress is never lost
                saveCheckpoint(allRolesData);
            } else {
                throw new Error(`Invalid response format for batch starting with ${batch[0]}`);
            }
        }
        
        // All batches done — write full CSVs
        // Re-include all original roles (checkpoint may have them all)
        const allRolesForCSV = rolesList.map(role => allRolesData.find(r => r.role === role)).filter(Boolean);
        await updateCSVFiles({ roles_data: allRolesForCSV });
        
        // Clear checkpoint on success
        try { fs.unlinkSync(CHECKPOINT_PATH); } catch (_) {}

        // Write success status
        const status = {
            last_updated: new Date().toISOString(),
            success: true,
            roles_updated: rolesList
        };
        fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2), 'utf8');
        console.log('🚀 Dataset Update finished successfully!');
        return true;
    } catch (err) {
        console.error('❌ Dataset Update failed:', err.message);
        
        // Write failure status
        const status = {
            last_attempt: new Date().toISOString(),
            success: false,
            error: err.message
        };
        try {
            fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2), 'utf8');
        } catch (_) {}
        return false;
    }
}

/**
 * Hook to be called by the Express server to check/schedule weekly updates
 */
function checkAndScheduleWeeklyUpdate() {
    if (!GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY is not defined. Weekly dataset auto-updates are disabled.');
        return;
    }

    console.log('📅 Checking dataset update status...');
    let needsUpdate = false;

    if (!fs.existsSync(STATUS_PATH)) {
        needsUpdate = true;
    } else {
        try {
            const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
            const lastUpdated = new Date(status.last_updated);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            if (isNaN(lastUpdated.getTime()) || lastUpdated < sevenDaysAgo) {
                needsUpdate = true;
            }
        } catch (e) {
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        console.log('📅 Dataset is older than 7 days (or status file missing). Running update now...');
        runUpdate();
    } else {
        console.log('📅 Dataset is up to date (updated within the last 7 days).');
    }

    // Schedule checking/running every 24 hours
    setInterval(() => {
        checkAndScheduleWeeklyUpdate();
    }, 24 * 60 * 60 * 1000);
}

// Allow running this file directly from command line (node update_dataset.js)
if (require.main === module) {
    runUpdate();
}

module.exports = {
    runUpdate,
    checkAndScheduleWeeklyUpdate
};
