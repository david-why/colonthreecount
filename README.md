# colonthreecount

This is a Slack bot that will count up from 1 with message reactions whenever the message `:3` is sent in a Slack channel. This is made for [#counttoamillioncolonthree](https://hackclub.enterprise.slack.com/archives/C0A3S04NBDF) on the Hack Club Slack.

## Usage

1. Join [#counttoamillioncolonthree](https://hackclub.enterprise.slack.com/archives/C0A3S04NBDF)
2. Send a message with the text `:3`
3. Profit!

## Self-hosting

1. Create `.env.local` and use `.env.example` to complete it
2. Run `bun install`
3. Run `bun scripts/create_emojis.ts` to create the `colonthreecount_{0,9}_{0,9}` emojis needed to count (you only need to do this once per Slack workspace)
4. Run `bun index.ts` to start the bot

## Tech stack

The project is made with Bun and the official Slack Bolt library.
