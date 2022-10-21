import { request } from "undici";

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK || "";

export function sendSlackMessage(text: string) {
  if (!SLACK_WEBHOOK.length) return;

  return request(SLACK_WEBHOOK, {
    headers: {
      "Content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
