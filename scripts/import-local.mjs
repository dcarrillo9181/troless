import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

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

loadEnvFile(path.join(process.cwd(), '.env.local'))

const url = process.env.SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
if (!url || !secret) {
  console.error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.')
  process.exit(1)
}

const passwords = JSON.parse(process.env.IMPORT_PASSWORDS || '{}')
const db = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'db.json'), 'utf8'))
const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'User-Agent': 'troless-server' } },
})

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'TU'
}

const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
if (listError) throw listError
const byEmail = new Map(listed.users.map((user) => [user.email?.toLowerCase(), user]))

for (const user of db.users ?? []) {
  let authUser = byEmail.get(user.email.toLowerCase())
  if (!authUser) {
    const password = passwords[user.email]
    if (!password) {
      console.log('Skipped', user.handle, 'because no import password was provided.')
      continue
    }
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        handle: user.handle,
        hue: user.hue,
        isAdmin: user.isAdmin,
        pledgeAcceptedAt: user.pledgeAcceptedAt,
        displayName: user.displayName,
        googleSub: user.googleSub,
      },
    })
    if (error || !data.user) throw error || new Error('createUser failed')
    authUser = data.user
    console.log('Created', user.handle)
  } else {
    const { error } = await admin.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        ...(authUser.user_metadata || {}),
        handle: user.handle,
        hue: user.hue,
        isAdmin: user.isAdmin,
        pledgeAcceptedAt: user.pledgeAcceptedAt,
        displayName: user.displayName,
        googleSub: user.googleSub,
      },
    })
    if (error) throw error
    console.log('Updated', user.handle)
  }
  const { error: profileError } = await admin.from('profiles').update({
    name: user.displayName,
    avatar_initials: initials(user.displayName),
    email: user.email,
    bio: user.bio,
    updated_at: new Date().toISOString(),
  }).eq('id', authUser.id)
  if (profileError) throw profileError
  user.remoteId = authUser.id
}

const idMap = new Map((db.users ?? []).filter((user) => user.remoteId).map((user) => [user.id, user.remoteId]))

for (const video of db.videos ?? []) {
  const userId = idMap.get(video.userId)
  if (!userId) continue
  const file = path.join(process.cwd(), 'data', 'videos', video.filename)
  if (fs.existsSync(file)) {
    const bytes = fs.readFileSync(file)
    const { error } = await admin.storage.from('videos').upload(video.filename, bytes, {
      contentType: video.mime,
      upsert: true,
    })
    if (error && !/already exists/i.test(error.message)) throw error
  }
  const { error } = await admin.from('videos').upsert({
    id: video.id,
    user_id: userId,
    video_url: video.filename,
    duration_seconds: Math.max(1, Math.min(60, Math.round(video.durationMs / 1000))),
    caption: video.title,
    positivity_impact: 0,
    total_ratings: 0,
    rating_sum: 0,
    view_count: 0,
    status: 'published',
    created_at: video.createdAt,
    updated_at: video.createdAt,
  }, { onConflict: 'id' })
  if (error) throw error
}

for (const comment of db.comments ?? []) {
  const userId = idMap.get(comment.userId)
  if (!userId) continue
  const { error } = await admin.from('comments').upsert({
    id: comment.id,
    video_id: comment.videoId,
    user_id: userId,
    body: comment.body,
    score: 0,
    is_blurred: false,
    created_at: comment.createdAt,
    updated_at: comment.createdAt,
  }, { onConflict: 'id' })
  if (error) throw error
}

for (const item of db.encouragements ?? []) {
  const userId = idMap.get(item.userId)
  if (!userId) continue
  const { error } = await admin.from('video_ratings').upsert({
    id: item.id || crypto.randomUUID(),
    user_id: userId,
    video_id: item.videoId,
    rating: 1,
    created_at: item.createdAt,
  }, { onConflict: 'video_id,user_id' })
  if (error) throw error
}

for (const report of db.reports ?? []) {
  const userId = idMap.get(report.reporterId)
  if (!userId) continue
  const { error } = await admin.from('notifications').upsert({
    id: report.id,
    user_id: userId,
    type: 'report',
    title: report.reason,
    body: '',
    reference_type: report.targetType,
    reference_id: report.targetId,
    read: Boolean(report.reviewedAt),
    created_at: report.createdAt,
  }, { onConflict: 'id' })
  if (error) throw error
}

const counts = {}
for (const table of ['profiles', 'videos', 'comments', 'video_ratings', 'notifications']) {
  const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true })
  if (error) throw error
  counts[table] = count
}
console.log(JSON.stringify(counts))
