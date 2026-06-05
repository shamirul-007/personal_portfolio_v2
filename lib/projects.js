import fs from 'fs';
import path from 'path';
// Static import: seed data for local dev / read fallback.
import seedData from '../pages/api/projects.json';

const TABLE = 'projects';

// Local dev storage (writable filesystem).
const DATA_FILE = path.join(process.cwd(), 'pages', 'api', 'projects.json');

const clone = (data) => JSON.parse(JSON.stringify(data));

/* ----------------------------- Supabase config ------------------------- */

// Read at call time so env vars injected by the Vercel integration are picked
// up. Supports the common variable names the integration may provide.
const sbConfig = () => {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.POSTGRES_SUPABASE_URL ||
    '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    '';
  return { url: url.replace(/\/$/, ''), key };
};

const useSupabase = () => {
  const { url, key } = sbConfig();
  return !!(url && key);
};

// Thin PostgREST fetch wrapper — no SDK, just the built-in fetch.
const sbFetch = async (pathAndQuery, init = {}) => {
  const { url, key } = sbConfig();
  const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${detail.slice(0, 300)}`);
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : [];
};

// Map a DB row to the shape the frontend expects.
const normalize = (row) => {
  const project = {
    id: row.id,
    name: row.name,
    image: row.image,
    description: row.description,
    tags: Array.isArray(row.tags) ? row.tags : [],
    demo: row.demo,
  };
  if (row.source_code) project.source_code = row.source_code;
  return project;
};

const sbReadAll = async () => {
  const rows = await sbFetch(`${TABLE}?select=*&order=id.asc`, { method: 'GET' });
  return rows.map(normalize);
};

const sbCreate = async (value) => {
  const rows = await sbFetch(TABLE, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(value),
  });
  return normalize(rows[0]);
};

const sbUpdate = async (id, value) => {
  const body = {
    name: value.name,
    image: value.image,
    description: value.description,
    tags: value.tags,
    demo: value.demo,
    source_code: value.source_code || null,
  };
  const rows = await sbFetch(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  return rows.length ? normalize(rows[0]) : null;
};

const sbDelete = async (id) => {
  const rows = await sbFetch(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  return rows.length ? normalize(rows[0]) : null;
};

/* ----------------------- local filesystem fallback --------------------- */

const fsRead = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    return clone(seedData);
  }
};

const fsWrite = (projects) => {
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(projects, null, 2)}\n`, 'utf-8');
};

const fsNextId = (projects) =>
  projects.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;

/* ------------------------------- validation ---------------------------- */

const sanitize = (input) => {
  if (!input || typeof input !== 'object') {
    return { error: 'Invalid request body' };
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description =
    typeof input.description === 'string' ? input.description.trim() : '';
  const image = typeof input.image === 'string' ? input.image.trim() : '';
  const demo = typeof input.demo === 'string' ? input.demo.trim() : '';
  const source_code =
    typeof input.source_code === 'string' ? input.source_code.trim() : '';

  let tags = [];
  if (Array.isArray(input.tags)) {
    tags = input.tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof input.tags === 'string') {
    tags = input.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  if (!name) return { error: 'Name is required' };
  if (!description) return { error: 'Description is required' };
  if (!image) return { error: 'Image URL is required' };
  if (!demo) return { error: 'Demo URL is required' };

  const value = { name, image, description, tags, demo };
  if (source_code) value.source_code = source_code;
  return { value };
};

/* --------------------------------- API --------------------------------- */

export const getProjects = async () => {
  if (!useSupabase()) return fsRead();
  try {
    return await sbReadAll();
  } catch (err) {
    // Never let a read crash the page — degrade to bundled seed data.
    console.error('[projects] supabase read failed, using seed:', err.message);
    return clone(seedData);
  }
};

// Paginated view over the projects list.
// Returns { data, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }.
export const getPaginatedProjects = async ({ page = 1, limit = 10 } = {}) => {
  const all = await getProjects();
  const total = all.length;

  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.max(1, Math.min(totalPages, Number(page) || 1));

  const start = (safePage - 1) * safeLimit;
  const data = all.slice(start, start + safeLimit);

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
};

export const getProjectById = async (id) => {
  const projects = await getProjects();
  return projects.find((p) => String(p.id) === String(id)) || null;
};

export const createProject = async (input) => {
  const { value, error } = sanitize(input);
  if (error) return { error };

  try {
    if (useSupabase()) {
      const project = await sbCreate(value);
      return { project };
    }
    const projects = fsRead();
    const project = { id: fsNextId(projects), ...value };
    projects.push(project);
    fsWrite(projects);
    return { project };
  } catch (err) {
    return { error: err.message || 'Failed to save project' };
  }
};

export const updateProject = async (id, input) => {
  const { value, error } = sanitize(input);
  if (error) return { error };

  try {
    if (useSupabase()) {
      const project = await sbUpdate(id, value);
      if (!project) return { error: 'Project not found', notFound: true };
      return { project };
    }
    const projects = fsRead();
    const index = projects.findIndex((p) => String(p.id) === String(id));
    if (index === -1) return { error: 'Project not found', notFound: true };
    const updated = { ...projects[index], ...value };
    if (!value.source_code) delete updated.source_code;
    projects[index] = updated;
    fsWrite(projects);
    return { project: updated };
  } catch (err) {
    return { error: err.message || 'Failed to update project' };
  }
};

export const deleteProject = async (id) => {
  try {
    if (useSupabase()) {
      const project = await sbDelete(id);
      if (!project) return { error: 'Project not found', notFound: true };
      return { project };
    }
    const projects = fsRead();
    const index = projects.findIndex((p) => String(p.id) === String(id));
    if (index === -1) return { error: 'Project not found', notFound: true };
    const [removed] = projects.splice(index, 1);
    fsWrite(projects);
    return { project: removed };
  } catch (err) {
    return { error: err.message || 'Failed to delete project' };
  }
};
