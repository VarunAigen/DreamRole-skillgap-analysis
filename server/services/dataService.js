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
 * Returns: { roleName: { domain, core_skills } }
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
                const core_skills_str = row['core_skills']?.trim();

                if (!role) return;

                let core_skills = [];
                if (core_skills_str) {
                    // properly parse quoted CSV strings if they are raw, but csv-parser handles quotes
                    core_skills = core_skills_str.split(',').map(s => s.trim()).filter(Boolean);
                }

                roles[role] = { domain, core_skills };
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
 * Get required skills (core skills) for a specific role.
 */
async function getRequiredSkills(role) {
    const data = await loadCareerRolesData();
    const roleData = data[role];
    if (!roleData) return null;
    return roleData.core_skills;
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

/**
 * Get all progress records or filter by user_id.
 */
function getProgress(userId) {
    try {
        const data = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
        if (userId) return data.filter(p => p.user_id === userId);
        return data;
    } catch {
        return [];
    }
}

/**
 * Save a new progress entry.
 */
function saveProgress(entry) {
    let data = [];
    try {
        data = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    } catch {
        data = [];
    }

    const newEntry = {
        id: uuidv4(),
        user_id: entry.user_id || 'anonymous',
        role: entry.role,
        alignment_stage: entry.alignment_stage,
        missing_skills: entry.missing_skills || [],
        matched_skills: entry.matched_skills || [],
        date: new Date().toISOString()
    };

    data.push(newEntry);
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(data, null, 2));
    return newEntry;
}

module.exports = {
    loadRolesData,
    loadCareerRolesData,
    getRoleNames,
    getDomainsAndRoles,
    getRequiredSkills,
    getProjects,
    getCertifications,
    getMentors,
    getProgress,
    saveProgress
};
