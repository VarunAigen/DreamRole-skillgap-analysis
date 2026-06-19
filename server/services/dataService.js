const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

const CSV_PATH = path.join(__dirname, '../datasets/tech_jobs_comprehensive_dataset.csv');
const CAREER_CSV_PATH = path.join(__dirname, '../datasets/career_roles_skills_dataset.csv');
const PROGRESS_PATH = path.join(__dirname, '../datasets/progress.json');
const MENTORS_PATH = path.join(__dirname, '../datasets/mentors.json');

let rolesCache = null;
let careerRolesCache = null;
let mentorsCache = null;

/**
 * Load and parse the CSV into a structured object.
 * Returns: { roleName: { required_skills: string[], projects: [], certifications: [] } }
 */
async function loadRolesData() {
    if (rolesCache) return rolesCache;

    return new Promise((resolve, reject) => {
        const roles = {};

        fs.createReadStream(CSV_PATH)
            .pipe(csv())
            .on('data', (row) => {
                const role = row['job_role']?.trim();
                const skills = row['required_skills']?.trim();
                const projectName = row['project_name']?.trim();
                const projectDesc = row['project_description']?.trim();
                const projectGithub = row['project_github_link']?.trim();
                const certName = row['certification_name']?.trim();
                const certProvider = row['certification_provider']?.trim();
                const certLink = row['certification_link']?.trim();

                if (!role) return;

                if (!roles[role]) {
                    roles[role] = { required_skills: [], projects: [], certifications: [] };
                }

                // Add skills (split by comma, deduplicate)
                if (skills) {
                    skills.split(',').map(s => s.trim()).forEach(skill => {
                        if (skill && !roles[role].required_skills.includes(skill)) {
                            roles[role].required_skills.push(skill);
                        }
                    });
                }

                // Add project
                if (projectName && !roles[role].projects.find(p => p.title === projectName)) {
                    roles[role].projects.push({
                        title: projectName,
                        description: projectDesc || '',
                        github: projectGithub || '',
                        tags: skills ? skills.split(',').map(s => s.trim()).slice(0, 3) : []
                    });
                }

                // Add certification
                if (certName && !roles[role].certifications.find(c => c.title === certName)) {
                    roles[role].certifications.push({
                        title: certName,
                        platform: certProvider || '',
                        link: certLink || '',
                        duration: ''
                    });
                }
            })
            .on('end', () => {
                rolesCache = roles;
                resolve(roles);
            })
            .on('error', reject);
    });
}

/**
 * Load and parse the career roles CSV.
 * Returns: { roleName: { domain, core_skills, tools_and_technologies, optional_advanced_skills } }
 */
async function loadCareerRolesData() {
    if (careerRolesCache) return careerRolesCache;

    return new Promise((resolve, reject) => {
        const roles = {};

        fs.createReadStream(CAREER_CSV_PATH)
            .pipe(csv())
            .on('data', (row) => {
                const role = row['role']?.trim();
                const domain = row['domain']?.trim();
                if (!role) return;

                const parseSkills = (str) => {
                    if (!str) return [];
                    return str.split(',').map(s => s.trim()).filter(Boolean);
                };

                roles[role] = { 
                    domain, 
                    core_skills: parseSkills(row['core_skills']?.trim()),
                    programming_languages: parseSkills(row['programming_languages']?.trim()),
                    frameworks_and_libraries: parseSkills(row['frameworks_and_libraries']?.trim()),
                    tools_and_technologies: parseSkills(row['tools_and_technologies']?.trim()),
                    platforms_and_cloud: parseSkills(row['platforms_and_cloud']?.trim()),
                    methodologies_and_practices: parseSkills(row['methodologies_and_practices']?.trim()),
                    soft_skills: parseSkills(row['soft_skills']?.trim()),
                    optional_advanced_skills: parseSkills(row['optional_advanced_skills']?.trim())
                };
            })
            .on('end', () => {
                careerRolesCache = roles;
                resolve(roles);
            })
            .on('error', reject);
    });
}

/**
 * Get all available role names.
 */
async function getRoleNames() {
    const data = await loadCareerRolesData();
    return Object.keys(data);
}

/**
 * Get required skills in categorized format for multi-dimensional matching.
 */
async function getRequiredSkillsCategorized(role) {
    const data = await loadCareerRolesData();
    const roleData = data[role];
    if (!roleData) return null;
    return {
        core_skills: roleData.core_skills || [],
        programming_languages: roleData.programming_languages || [],
        frameworks_and_libraries: roleData.frameworks_and_libraries || [],
        tools_and_technologies: roleData.tools_and_technologies || [],
        platforms_and_cloud: roleData.platforms_and_cloud || [],
        methodologies_and_practices: roleData.methodologies_and_practices || [],
        soft_skills: roleData.soft_skills || [],
        optional_advanced_skills: roleData.optional_advanced_skills || []
    };
}

/**
 * Get required skills (flattened) for a specific role (backward compatibility).
 */
async function getRequiredSkills(role) {
    const cat = await getRequiredSkillsCategorized(role);
    if (!cat) return null;
    return [
        ...cat.core_skills,
        ...cat.programming_languages,
        ...cat.frameworks_and_libraries,
        ...cat.tools_and_technologies,
        ...cat.platforms_and_cloud,
        ...cat.methodologies_and_practices,
        ...cat.soft_skills,
        ...cat.optional_advanced_skills
    ];
}

/**
 * Get domains and their associated roles.
 */
async function getDomainsAndRoles() {
    const data = await loadCareerRolesData();
    const domains = [];
    const rolesByDomain = {};

    for (const [role, info] of Object.entries(data)) {
        const domain = info.domain || 'Other';
        if (!domains.includes(domain)) {
            domains.push(domain);
            rolesByDomain[domain] = [];
        }
        rolesByDomain[domain].push(role);
    }

    return { domains, rolesByDomain };
}

/**
 * Get project recommendations for a role.
 */
async function getProjects(role) {
    const data = await loadRolesData();
    const roleData = data[role];
    if (!roleData) return [];
    return roleData.projects.slice(0, 6);
}

/**
 * Get certification recommendations for a role.
 */
async function getCertifications(role) {
    const data = await loadRolesData();
    const roleData = data[role];
    if (!roleData) return [];
    return roleData.certifications.slice(0, 4);
}

/**
 * Load mentor data from JSON file.
 */
function getMentors(role) {
    if (!mentorsCache) {
        mentorsCache = JSON.parse(fs.readFileSync(MENTORS_PATH, 'utf-8'));
    }
    if (!role) return mentorsCache;
    return mentorsCache.filter(m =>
        m.domain.toLowerCase().includes(role.toLowerCase().split(' ')[0].toLowerCase())
    );
}

const Progress = require('../models/Progress');

/**
 * Get all progress records or filter by user_id.
 */
async function getProgress(userId) {
    try {
        const query = userId ? { user_id: userId } : {};
        const records = await Progress.find(query).sort({ date: -1 }).lean();
        
        // Ensure format matches old API expectations
        return records.map(record => ({
            id: record._id.toString(),
            user_id: record.user_id,
            role: record.role,
            alignment_stage: record.alignment_stage,
            missing_skills: record.missing_skills || [],
            matched_skills: record.matched_skills || [],
            date: record.date
        }));
    } catch (err) {
        console.error("DB GetProgress Error:", err);
        throw err;
    }
}

/**
 * Save a new progress entry.
 */
async function saveProgress(entry) {
    try {
        const newProgress = new Progress({
            user_id: entry.user_id || 'anonymous',
            role: entry.role,
            alignment_stage: entry.alignment_stage,
            missing_skills: entry.missing_skills || [],
            matched_skills: entry.matched_skills || [],
            evaluation_status: entry.evaluation_status || 'pending'
        });

        const saved = await newProgress.save();
        
        return {
            id: saved._id.toString(),
            user_id: saved.user_id,
            role: saved.role,
            alignment_stage: saved.alignment_stage,
            missing_skills: saved.missing_skills,
            matched_skills: saved.matched_skills,
            evaluation_status: saved.evaluation_status,
            date: saved.date
        };
    } catch (err) {
        console.error("[saveProgress] Non-fatal DB write error:", err.message);
        return null; // non-fatal — main analysis response is unaffected
    }
}

module.exports = {
    loadRolesData,
    loadCareerRolesData,
    getRoleNames,
    getDomainsAndRoles,
    getRequiredSkills,
    getRequiredSkillsCategorized,
    getProjects,
    getCertifications,
    getMentors,
    getProgress,
    saveProgress
};
