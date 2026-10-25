// Checks the database rules (src/online/rules.json) in the Firebase emulator:
// stale-room cleanup and the error log. Needs Java 21+.
//   npm run test:rules
const path = require('path')
const { initializeApp } = require('firebase/app')
const { getAuth, signInAnonymously, connectAuthEmulator } = require('firebase/auth')
const { getDatabase, connectDatabaseEmulator, ref, set, get, update, push, query, orderByChild, endAt, limitToFirst, serverTimestamp } = require('firebase/database')
const EMU = true
const config = { apiKey: 'x', projectId: 'demo-spy', databaseURL: 'http://127.0.0.1:9000?ns=demo-spy-default-rtdb' }
const DAY = 864e5

async function user(name) {
  const app = initializeApp(config, name)
  const auth = getAuth(app)
  if (EMU) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const u = (await signInAnonymously(auth)).user
  const db = getDatabase(app)
  if (EMU) connectDatabaseEmulator(db, '127.0.0.1', 9000)
  return { db, uid: u.uid }
}
const results = []
async function expect(label, want, fn) {
  let got
  try { await fn(); got = 'ok' } catch (e) { got = e.code === 'PERMISSION_DENIED' || /permission/i.test(e.message) ? 'denied' : 'error: ' + e.message }
  results.push(`${got === want ? 'PASS' : 'FAIL'}  ${label}: expected ${want}, got ${got}`)
}

;(async () => {
  const a = await user('a'), b = await user('b')
  const code = 'ZT' + Math.random().toString(36).slice(2, 4).toUpperCase()
  const room = (u) => ref(u.db, `rooms/${code}`)
  await set(room(a), { meta: { createdAt: serverTimestamp(), phase: 'lobby', round: 0 }, lastActive: serverTimestamp(), players: { [a.uid]: { name: 'A', joinedAt: serverTimestamp() } } })
  await expect('outsider deletes an active room', 'denied', () => set(room(b), null))
  await expect('outsider reads all rooms at once', 'denied', () => get(ref(b.db, 'rooms')))
  await expect('outsider lists rooms by another field', 'denied', () => get(query(ref(b.db, 'rooms'), orderByChild('meta/createdAt'), limitToFirst(25))))
  await expect('outsider lists too many stale rooms', 'denied', () => get(query(ref(b.db, 'rooms'), orderByChild('lastActive'), endAt(Date.now() - 31 * DAY), limitToFirst(500))))
  await expect('member backdates lastActive (must be now)', 'denied', () => set(ref(a.db, `rooms/${code}/lastActive`), 1000))
  await expect('member touches lastActive', 'ok', () => set(ref(a.db, `rooms/${code}/lastActive`), serverTimestamp()))
  await expect('outsider touches lastActive', 'denied', () => set(ref(b.db, `rooms/${code}/lastActive`), serverTimestamp()))
  await expect('member moves phase with lastActive', 'ok', () => update(ref(a.db, `rooms/${code}`), { 'meta/phase': 'reveal', lastActive: serverTimestamp() }))
  // Stand-in for 30 days passing: remove lastActive and backdate createdAt.
  await set(ref(a.db, `rooms/${code}/lastActive`), null)
  await update(ref(a.db, `rooms/${code}/meta`), { createdAt: 1000 })
  let found = []
  await expect('outsider lists stale rooms', 'ok', async () => {
    found = Object.keys((await get(query(ref(b.db, 'rooms'), orderByChild('lastActive'), endAt(Date.now() - 31 * DAY), limitToFirst(25)))).val() ?? {})
  })
  results.push(`      stale list contains test room: ${found.includes(code)}`)
  await expect('outsider deletes stale private words', 'ok', () => update(ref(b.db), { [`privateWords/${code}`]: null, [`pairReveals/${code}`]: null }))
  await expect('outsider deletes a stale room', 'ok', () => set(room(b), null))

  // Room from before lastActive existed: only stale once createdAt is old.
  const code2 = code + 'X'
  await set(ref(a.db, `rooms/${code2}`), { meta: { createdAt: serverTimestamp(), phase: 'lobby', round: 0 }, players: { [a.uid]: { name: 'A', joinedAt: serverTimestamp() } } })
  await expect('outsider deletes new room without lastActive', 'denied', () => set(ref(b.db, `rooms/${code2}`), null))
  await update(ref(a.db, `rooms/${code2}/meta`), { createdAt: 1000 })
  await expect('outsider deletes old room without lastActive', 'ok', () => set(ref(b.db, `rooms/${code2}`), null))

  await expect('error report', 'ok', () => push(ref(b.db, 'errors'), { msg: 'rules test, ignore', url: '/test', ua: 'node', at: serverTimestamp() }))
  await expect('error report with extra field', 'denied', () => push(ref(b.db, 'errors'), { msg: 'x', at: serverTimestamp(), evil: 1 }))
  await expect('error report with fake time', 'denied', () => push(ref(b.db, 'errors'), { msg: 'x', at: 5 }))
  await expect('reading error reports', 'denied', () => get(ref(b.db, 'errors')))
  console.log(results.join('\n'))
  process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })
