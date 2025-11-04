import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const VALID_STATUSES = ['COMPLETED', 'IN_PROGRESS', 'PLANNING', 'COMING_SOON'];
const shouldLogParseWarnings = (process.env.NODE_ENV || '').toLowerCase() !== 'production';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: baseHeaders
    };
  }

  try {
    const pathInfo = parsePath(event.path);

    if (pathInfo.resource !== 'projects') {
      return jsonResponse(404, { message: 'Resource not found.' });
    }

    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(pathInfo.id);
      case 'POST':
        await requireAdmin(event);
        return await handleCreate(event.body);
      case 'PUT':
        await requireAdmin(event);
        if (!pathInfo.id) {
          return jsonResponse(400, { message: 'Project id is required for updates.' });
        }
        return await handleUpdate(pathInfo.id, event.body);
      case 'DELETE':
        await requireAdmin(event);
        if (!pathInfo.id) {
          return jsonResponse(400, { message: 'Project id is required for deletion.' });
        }
        return await handleDelete(pathInfo.id);
      default:
        return jsonResponse(405, { message: 'Method not allowed.' });
    }
  } catch (error) {
    if (error.statusCode) {
      return jsonResponse(error.statusCode, { message: error.message });
    }

    console.error('projects handler error', error);
    return jsonResponse(500, {
      message: 'Unexpected error',
      detail: error.message
    });
  }
}

function parsePath(rawPath) {
  const normalised = rawPath.replace('/.netlify/functions/', '');
  const [resource, maybeId] = normalised.split('/').filter(Boolean);
  const numericId = Number.parseInt(maybeId, 10);
  return {
    resource,
    id: Number.isNaN(numericId) ? null : numericId
  };
}

async function handleGet(id) {
  if (id) {
    const rows = await sql`SELECT * FROM projects WHERE id = ${id} LIMIT 1;`;
    if (!rows.length) {
      return jsonResponse(404, { message: 'Project not found.' });
    }
    return jsonResponse(200, { project: formatProject(rows[0]) });
  }

  const rows = await sql`SELECT * FROM projects ORDER BY created_at DESC;`;
  return jsonResponse(200, { projects: rows.map(formatProject) });
}

async function handleCreate(body) {
  const payload = parseJsonBody(body);
  const validation = validatePayload(payload);
  if (!validation.valid) {
    return jsonResponse(400, { message: validation.message, issues: validation.issues });
  }

  const galleryUrls = toGalleryArray(payload.gallery);
  const highlightPoints = toStringArray(payload.highlightPoints);
  const galleryJson = sql.json(galleryUrls);
  const highlightArray = sql.array(highlightPoints, 'text');

  const [created] = await sql`
    INSERT INTO projects (
      name,
      location,
      project_type,
      summary,
      description,
      services,
      status,
      start_date,
      completion_date,
      main_image_url,
      gallery_urls,
      highlight_points
    )
    VALUES (
      ${payload.name},
      ${nullableText(payload.location)},
      ${nullableText(payload.projectType)},
      ${payload.summary},
      ${payload.description},
      ${nullableText(payload.services)},
      ${payload.status ?? 'PLANNING'},
      ${toNullableDate(payload.startDate)},
      ${toNullableDate(payload.completionDate)},
      ${nullableText(payload.mainImage)},
      ${galleryJson},
      ${highlightArray}
    )
    RETURNING *;
  `;

  return jsonResponse(201, { project: formatProject(created) });
}

async function handleUpdate(id, body) {
  const payload = parseJsonBody(body);
  const validation = validatePayload(payload);
  if (!validation.valid) {
    return jsonResponse(400, { message: validation.message, issues: validation.issues });
  }

  const galleryUrls = toGalleryArray(payload.gallery);
  const highlightPoints = toStringArray(payload.highlightPoints);
  const galleryJson = sql.json(galleryUrls);
  const highlightArray = sql.array(highlightPoints, 'text');

  const [updated] = await sql`
    UPDATE projects
    SET
      name = ${payload.name},
      location = ${nullableText(payload.location)},
      project_type = ${nullableText(payload.projectType)},
      summary = ${payload.summary},
      description = ${payload.description},
      services = ${nullableText(payload.services)},
      status = ${payload.status ?? 'PLANNING'},
      start_date = ${toNullableDate(payload.startDate)},
      completion_date = ${toNullableDate(payload.completionDate)},
      main_image_url = ${nullableText(payload.mainImage)},
      gallery_urls = ${galleryJson},
      highlight_points = ${highlightArray},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;

  if (!updated) {
    return jsonResponse(404, { message: 'Project not found.' });
  }

  return jsonResponse(200, { project: formatProject(updated) });
}

async function handleDelete(id) {
  const result = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id;`;
  if (!result.length) {
    return jsonResponse(404, { message: 'Project not found.' });
  }
  return jsonResponse(204, null);
}

function parseJsonBody(rawBody) {
  try {
    return rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    const err = new Error('Invalid JSON body.');
    err.statusCode = 400;
    throw err;
  }
}

function validatePayload(payload) {
  const issues = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Payload must be an object.', issues: ['Invalid payload format.'] };
  }

  if (!payload.name || typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    issues.push('Name is required.');
  }

  if (!payload.summary || typeof payload.summary !== 'string' || payload.summary.trim().length === 0) {
    issues.push('Summary is required.');
  }

  if (!payload.description || typeof payload.description !== 'string' || payload.description.trim().length === 0) {
    issues.push('Description is required.');
  }

  if (payload.status && !VALID_STATUSES.includes(payload.status)) {
    issues.push('Status is invalid.');
  }

  if (payload.gallery && !Array.isArray(payload.gallery)) {
    issues.push('Gallery must be an array of image URLs.');
  }

  if (payload.highlightPoints && !Array.isArray(payload.highlightPoints)) {
    issues.push('Highlight points must be an array of strings.');
  }

  if (payload.startDate && Number.isNaN(Date.parse(payload.startDate))) {
    issues.push('Start date must be a valid date.');
  }

  if (payload.completionDate && Number.isNaN(Date.parse(payload.completionDate))) {
    issues.push('Completion date must be a valid date.');
  }

  return {
    valid: issues.length === 0,
    message: issues.length ? 'Validation failed.' : 'ok',
    issues
  };
}

function formatProject(row) {
  const gallery = normaliseStringArray(row.gallery_urls);
  const highlightPoints = normaliseStringArray(row.highlight_points);

  return {
    id: row.id,
    name: row.name,
    summary: row.summary,
    description: row.description,
    location: row.location,
    projectType: row.project_type,
    services: row.services,
    status: row.status,
    startDate: row.start_date,
    completionDate: row.completion_date,
    mainImage: row.main_image_url,
    gallery,
    highlightPoints,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function nullableText(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function toNullableDate(value) {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function toGalleryArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((url) => nullableText(url))
    .filter((url) => typeof url === 'string' && url.length > 0);
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => nullableText(item))
    .filter((item) => typeof item === 'string' && item.length > 0);
}

function normaliseStringArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => nullableText(item)).filter((item) => typeof item === 'string' && item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    const candidate = trimmed.startsWith('[')
      ? trimmed
      : trimmed.startsWith('{')
        ? trimmed.replace(/^{/, '[').replace(/}$/, ']')
        : `[${trimmed}]`;

    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => nullableText(item))
          .filter((item) => typeof item === 'string' && item.length > 0);
      }
    } catch (error) {
      if (shouldLogParseWarnings) {
        console.warn('Failed to parse array string', error);
      }
    }
  }

  if (typeof value === 'object') {
    try {
      const parsed = JSON.parse(JSON.stringify(value));
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => nullableText(item))
          .filter((item) => typeof item === 'string' && item.length > 0);
      }
    } catch (error) {
      if (shouldLogParseWarnings) {
        console.warn('Failed to normalise array-like value', error);
      }
    }
  }

  return [];
}

async function requireAdmin(event) {
  const user = event.clientContext?.user;
  if (!user) {
    const error = new Error('Authentication required.');
    error.statusCode = 401;
    throw error;
  }

  const roles = user.app_metadata?.roles || [];
  if (!roles.includes('admin')) {
    const error = new Error('You do not have permission to manage projects.');
    error.statusCode = 403;
    throw error;
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: body === null ? baseHeaders : { ...baseHeaders, 'Content-Type': 'application/json' },
    body: body === null ? undefined : JSON.stringify(body)
  };
}
