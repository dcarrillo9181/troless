import {
  addEncouragement,
  commentsFor,
  findUserByEmail,
  findUserByGoogleSub,
  findUserByHandle,
  findUserById,
  hasEncouragement,
  listVideosNewest,
  publicAuthor,
  unreviewedCount,
} from './records'
import * as fileStore from './store-file'
import * as remoteStore from './store-supabase'
import { supabaseConfigured } from './supabase'

export { registerEmailUser, registerGoogleUser, authenticateEmail } from './store-supabase'
import type { Database, VideoRecord } from './types'

function backend() {
  return supabaseConfigured() ? remoteStore : fileStore
}

export function readDb() {
  return backend().readDb()
}

export function update<T>(fn: (db: Database) => T) {
  return backend().update(fn)
}

export function writeVideoBytes(filename: string, bytes: Buffer, mime: string) {
  return backend().writeVideoBytes(filename, bytes, mime)
}

export function removeVideoBytes(filename: string) {
  return backend().removeVideoBytes(filename)
}

export function readVideoBytes(video: VideoRecord) {
  return backend().readVideoBytes(video)
}

export function secretPath() {
  return fileStore.secretPath()
}

export {
  addEncouragement,
  commentsFor,
  findUserByEmail,
  findUserByGoogleSub,
  findUserByHandle,
  findUserById,
  hasEncouragement,
  listVideosNewest,
  publicAuthor,
  unreviewedCount,
}
