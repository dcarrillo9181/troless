import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const ref = 'lhpvuvbmsnkfyndstebi'

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(path.join(process.cwd(), '.env'))
loadEnvFile(path.join(process.cwd(), '.env.local'))

const url = process.env.SUPABASE_URL || `https://${ref}.supabase.co`
const sqlPath = path.join(process.cwd(), 'supabase/migrations/20261026193000_troless.sql')

function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const password = process.env.SUPABASE_DB_PASSWORD
  if (!password) return ''
  const host = process.env.SUPABASE_DB_HOST || 'aws-1-us-east-1.pooler.supabase.com'
  const port = process.env.SUPABASE_DB_PORT || '5432'
  const user = encodeURIComponent(`postgres.${ref}`)
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/postgres`
}

async function applyWithPg(sql) {
  const client = new pg.Client({
    connectionString: connectionString(),
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    await client.query(sql)
    return client
  } catch (error) {
    await client.end()
    throw error
  }
}

async function applyWithManagement(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`Management API ${response.status}: ${body.slice(0, 300)}`)
  }
}

async function importRows(client, db) {
  for (const user of db.users) {
    await client.query(
      `insert into public.users
        (id, email, password_hash, password_salt, google_sub, display_name, handle, bio, hue, pledge_accepted_at, is_admin, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       on conflict (id) do nothing`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.passwordSalt,
        user.googleSub,
        user.displayName,
        user.handle,
        user.bio,
        user.hue,
        user.pledgeAcceptedAt,
        user.isAdmin,
        user.createdAt,
      ]
    )
  }
  for (const video of db.videos) {
    await client.query(
      `insert into public.videos (id, user_id, title, filename, mime, duration_ms, created_at)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (id) do nothing`,
      [video.id, video.userId, video.title, video.filename, video.mime, video.durationMs, video.createdAt]
    )
  }
  for (const item of db.encouragements) {
    await client.query(
      `insert into public.encouragements (user_id, video_id, created_at)
       values ($1,$2,$3)
       on conflict (user_id, video_id) do nothing`,
      [item.userId, item.videoId, item.createdAt]
    )
  }
  for (const comment of db.comments) {
    await client.query(
      `insert into public.comments (id, video_id, user_id, body, created_at)
       values ($1,$2,$3,$4,$5)
       on conflict (id) do nothing`,
      [comment.id, comment.videoId, comment.userId, comment.body, comment.createdAt]
    )
  }
  for (const report of db.reports) {
    await client.query(
      `insert into public.reports (id, reporter_id, target_type, target_id, reason, created_at, reviewed_at)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (id) do nothing`,
      [report.id, report.reporterId, report.targetType, report.targetId, report.reason, report.createdAt, report.reviewedAt]
    )
  }
}

async function uploadVideos(db) {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    console.log('Skipped video upload. Set SUPABASE_SECRET_KEY to copy clips into storage.')
    return 0
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  let uploaded = 0
  for (const video of db.videos) {
    const file = path.join(process.cwd(), 'data', 'videos', video.filename)
    if (!fs.existsSync(file)) continue
    const bytes = fs.readFileSync(file)
    const { error } = await supabase.storage.from('videos').upload(video.filename, bytes, {
      contentType: video.mime,
      upsert: true,
    })
    if (error && !/already exists/i.test(error.message)) throw error
    uploaded += 1
  }
  return uploaded
}

async function counts(client) {
  const tables = ['users', 'videos', 'encouragements', 'comments', 'reports']
  const summary = {}
  for (const table of tables) {
    const result = await client.query(`select count(*)::int as n from public.${table}`)
    summary[table] = result.rows[0].n
  }
  return summary
}

const sql = fs.readFileSync(sqlPath, 'utf8')
const databaseUrl = connectionString()
const accessToken = process.env.SUPABASE_ACCESS_TOKEN

if (!databaseUrl && !accessToken) {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (key) {
    const response = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'User-Agent': 'troless-server' },
    })
    if (response.ok) {
      console.log('Supabase is already provisioned at', url)
      console.log('Restart the dev server so it reads .env.local.')
      process.exit(0)
    }
  }
  console.error(
    `Cannot create tables on ${url} yet. Add one of these to .env.local and run npm run db:bootstrap:\n` +
      '- SUPABASE_DB_PASSWORD (database password from the Supabase Connect panel)\n' +
      '- DATABASE_URL (the session pooler connection string)\n' +
      '- SUPABASE_ACCESS_TOKEN (a personal access token)\n' +
      'Also set SUPABASE_SECRET_KEY so the app and video upload can use the project.'
  )
  process.exit(1)
}

let client = null
try {
  if (databaseUrl) {
    client = await applyWithPg(sql)
  } else {
    await applyWithManagement(sql)
    console.log('Applied schema through the management API.')
    if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Set SUPABASE_SECRET_KEY before starting the app.')
      process.exit(0)
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

const dataPath = path.join(process.cwd(), 'data', 'db.json')
if (client && fs.existsSync(dataPath)) {
  const db = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  await importRows(client, {
    users: db.users ?? [],
    videos: db.videos ?? [],
    encouragements: db.encouragements ?? [],
    comments: db.comments ?? [],
    reports: db.reports ?? [],
  })
  const uploaded = await uploadVideos(db)
  console.log('Imported local accounts and uploaded', uploaded, 'videos.')
}

if (client) {
  console.log(JSON.stringify(await counts(client)))
  await client.end()
}
console.log('Supabase schema is ready at', url)
