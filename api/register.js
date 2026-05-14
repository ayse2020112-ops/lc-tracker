module.exports = async function handler(req, res) {
  const accountId = process.env.LIVECHAT_ACCOUNT_ID
  const pat = process.env.LIVECHAT_PAT
  const credentials = Buffer.from(`${accountId}:${pat}`).toString('base64')

  const response = await fetch('https://api.livechatinc.com/v3.5/configuration/action/register_webhook', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'X-Region': 'us-south1'
    },
    body: JSON.stringify({
      action: 'incoming_visitor',
      url: 'https://lc-tracker-mauve.vercel.app/api/visitor',
      secret_key: 'kalitebet123',
      owner_client_id: 'kalitebet',
      description: 'Visitor tracker'
    })
  })

  const data = await response.json()
  return res.status(200).json(data)
}
