import { App } from '@slack/bolt'
import { sql } from 'bun'

const { SLACK_BOT_TOKEN, SLACK_APP_TOKEN, SLACK_SIGNING_SECRET } = process.env
const COUNTING_CHANNELS = process.env.COUNTING_CHANNELS!.split(',')

const app = new App({
  token: SLACK_BOT_TOKEN,
  appToken: SLACK_APP_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  socketMode: true,
})

// the database stuff

interface Channel {
  id: string
  last_ts: string
}

async function getLastHandledTimestamp(channel: string) {
  const [chan] = await sql<
    Channel[]
  >`SELECT * FROM channels WHERE id = ${channel}`
  if (!chan) {
    return (Date.now() / 1000).toString()
  }
  return chan.last_ts
}

async function setLastHandledTimestamp(channel: string, ts: string) {
  const payload = { id: channel, last_ts: ts }
  await sql`INSERT INTO channels ${sql(
    payload
  )} ON CONFLICT (id) DO UPDATE SET last_ts = EXCLUDED.last_ts`
}

// the message handling stuff

let handling = new Set<string>()

async function handleNewMessages(channel: string) {
  if (handling.has(channel)) return
  handling.add(channel)

  try {
    let stop = false

    while (!stop) {
      const ts = await getLastHandledTimestamp(channel)
      const res = await app.client.conversations.history({
        channel,
        oldest: ts,
        limit: 999,
      })
      stop = !res.has_more
      if (!res.messages?.length) break

      const messages = res.messages.toSorted(
        (a, b) => Number(a.ts!) - Number(b.ts!)
      )

      for (const message of messages) {
        if (message.subtype && !['file_share'].includes(message.subtype))
          continue

        console.log(message.text)
      }

      await setLastHandledTimestamp(channel, messages[messages.length - 1]!.ts!)
    }
  } finally {
    handling.delete(channel)
  }
}

// handlers and stuff

app.message(async ({ payload }) => {
  if (
    !COUNTING_CHANNELS.includes(payload.channel) ||
    (payload.subtype && payload.subtype != 'file_share') ||
    payload.thread_ts
  )
    return

  handleNewMessages(payload.channel)
})

await app.start()

console.log(':3 started!')
