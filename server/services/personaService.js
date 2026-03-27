const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_PATH = path.join(__dirname, '../datasets/career_mentor_personas.csv');
let personasCache = null;

/**
 * Load and parse all mentor personas from the CSV.
 */
async function loadPersonas() {
    if (personasCache) return personasCache;

    return new Promise((resolve, reject) => {
        const personas = [];
        fs.createReadStream(CSV_PATH)
            .pipe(csv())
            .on('data', (row) => {
                personas.push({
                    id: row.id?.trim(),
                    name: row.name?.trim(),
                    role: row.role?.trim(),
                    company: row.company?.trim(),
                    company_type: row.company_type?.trim(),
                    category: row.category?.trim(),
                    domain: row.domain?.trim(),
                    skills: row.skills?.split(',').map(s => s.trim()).filter(Boolean) || [],
                    years_experience: parseInt(row.years_experience) || 0,
                    location: row.location?.trim(),
                    bio: row.bio?.trim(),
                    avatar_color: row.avatar_color?.trim() || '#6366f1'
                });
            })
            .on('end', () => {
                personasCache = personas;
                resolve(personas);
            })
            .on('error', reject);
    });
}

/**
 * Get all personas, optionally filtered by category/domain.
 */
async function getPersonas(filter = {}) {
    const all = await loadPersonas();
    if (!filter.category && !filter.domain && !filter.search) return all;

    return all.filter(p => {
        if (filter.category && !p.category.toLowerCase().includes(filter.category.toLowerCase())) return false;
        if (filter.domain && !p.domain.toLowerCase().includes(filter.domain.toLowerCase())) return false;
        if (filter.search) {
            const q = filter.search.toLowerCase();
            return p.name.toLowerCase().includes(q) ||
                p.role.toLowerCase().includes(q) ||
                p.domain.toLowerCase().includes(q) ||
                p.skills.some(s => s.toLowerCase().includes(q));
        }
        return true;
    });
}

/**
 * Get a single persona by id.
 */
async function getPersonaById(id) {
    const all = await loadPersonas();
    return all.find(p => p.id === String(id)) || null;
}

/**
 * Get all unique categories.
 */
async function getCategories() {
    const all = await loadPersonas();
    return [...new Set(all.map(p => p.category))].sort();
}

/**
 * Compare student skills vs mentor skills.
 */
function compareSkills(studentSkills, mentorSkills) {
    const studentNorm = studentSkills.map(s => s.toLowerCase().trim());
    const known = mentorSkills.filter(ms => studentNorm.some(ss => ss.includes(ms.toLowerCase()) || ms.toLowerCase().includes(ss)));
    const missing = mentorSkills.filter(ms => !known.includes(ms));
    return { known, missing };
}

module.exports = { loadPersonas, getPersonas, getPersonaById, getCategories, compareSkills };
