import { WebClient } from '@slack/web-api'

const { SLACK_USER_XOXC, SLACK_USER_XOXD, SLACK_BOT_TOKEN } = process.env

const client = new WebClient(SLACK_BOT_TOKEN)

const NUMBERS = [
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0030-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0031-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0032-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0033-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0034-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0035-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0036-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0037-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0038-fe0f-20e3.png',
  'https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-large/0039-fe0f-20e3.png',
]

const existing = (await client.emoji.list()).emoji || {}

for (let i = 0; i < 10; i++) {
  for (let j = 0; j < 10; j++) {
    if (`colonthreecount_${i}_${j}` in existing) continue

    const data = new FormData()
    data.set('token', SLACK_USER_XOXC!)
    data.set('name', `colonthreecount_${i}_${j}`)
    data.set('mode', 'url')
    data.set('url', NUMBERS[i]!)

    const res = await fetch(
      'https://hackclub.enterprise.slack.com/api/emoji.add',
      {
        method: 'POST',
        headers: {
          Cookie: `d=${SLACK_USER_XOXD}`,
        },
        body: data,
      }
    )

    console.log(await res.text())
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}
