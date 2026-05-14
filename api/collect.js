const { Redis } = require('@upstash/redis')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })

    const accountId = process.env.LIVECHAT_ACCOUNT_ID
    const pat = process.env.LIVECHAT_PAT
    const credentials = Buffer.from(`${accountId}:${pat}`).toString('base64')

    let visitorCount = 0

    const lcRes = await fetch('https://api.livechatinc.com/v3.5/agent/action/list_chats', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'X-Region': 'us-south1'
      },
      body: JSON.stringify({
        filters: { active: true }
      })
    })

    const lcData = await lcRes.json()
    
    if (lcData && lcData.total_chats !== undefined) {
      visitorCount = lcData.total_chats
    } else if (lcData && lcData.chats_summary) {
      visitorCount = lcData.chats_summary.length
    }

    const now = new Date()
    const hour = now.getHours()
    const dateStr = now.toISOString().split('T')[0]
    const key = `v:${dateStr}:${String(hour).padStart(2,'0')}`

    const existing = await redis.get(key)
    if (existing) {
      const p = typeof existing === 'string' ? JSON.parse(existing) : existing
      const newVal = Math.round((p.v + visitorCount) / 2)
      await redis.set(key, JSON.stringify({ v: newVal, n: p.n + 1 }), { ex: 60*60*24*90 })
    } else {
      await redis.set(key, JSON.stringify({ v: visitorCount, n: 1 }), { ex: 60*60*24*90 })
    }

    return res.status(200).json({ ok: true, visitors: visitorCount, key })
  } catch(err) {
    return res.status(500).json({ error: err.message })
  }
}
