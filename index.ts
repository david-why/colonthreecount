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

interface ChannelCount {
  id: number
  channel_id: string
  user_id: string
  count: number
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
  const payload: Partial<Channel> = { id: channel, last_ts: ts }
  await sql`INSERT INTO channels ${sql(
    payload
  )} ON CONFLICT (id) DO UPDATE SET last_ts = EXCLUDED.last_ts`
}

async function getLastCount(channel: string) {
  const [count] = await sql<
    ChannelCount[]
  >`SELECT * FROM channel_count WHERE channel_id = ${channel} ORDER BY count DESC LIMIT 1`
  if (!count) {
    return { user_id: 'USLACKBOT', count: 0 }
  }
  return count
}

async function addCount(count: Omit<ChannelCount, 'id'>) {
  await sql`INSERT INTO channel_count ${sql(count)}`
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
        if (
          (message.subtype && !['file_share'].includes(message.subtype)) ||
          !message.user ||
          !message.ts
        )
          continue

        if (!message.text?.startsWith(':3')) {
          app.client.reactions.add({
            channel,
            timestamp: message.ts,
            name: 'bangbang',
          })
          app.client.chat.postEphemeral({
            channel,
            user: message.user,
            text: `:3 non-thread messages must start with :3, optionally followed by more text!`,
          })
        } else {
          const last = await getLastCount(channel)
          if (last.user_id === message.user) {
            app.client.reactions.add({
              channel,
              timestamp: message.ts,
              name: 'bangbang',
            })
            app.client.chat.postEphemeral({
              channel,
              user: message.user,
              text: `:3 ur cute but u can't :3 twice in a row!`,
            })
          } else {
            const num = last.count + 1
            await addCount({
              channel_id: channel,
              count: num,
              user_id: message.user!,
            })
            addReactions(channel, message.ts, num)
          }
        }
      }

      await setLastHandledTimestamp(channel, messages[messages.length - 1]!.ts!)
    }
  } finally {
    handling.delete(channel)
  }
}

async function addReactions(channel: string, ts: string, count: number) {
  // for debugging
  // await app.client.chat.postMessage({
  //   channel,
  //   thread_ts: ts,
  //   text: `[debug] count: ${count}`,
  // })
  const digits = Math.floor(count).toString()
  for (const [idx, digit] of Array.from(digits).entries()) {
    const num = parseInt(digit)
    await app.client.reactions.add({
      channel,
      timestamp: ts,
      name: `colonthreecount_${num}_${idx}`,
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
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
