const { Redis } = require('@upstash/redis')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })

    const now = new Date()
    const results = []

    for (let d = 6; d >= 0; d--) {
      const date = new Date(now)
      date.setDate(date.getDate() - d)
      const dateStr = date.toISOString().split('T')[0]

      for (let h = 0; h < 24; h++) {
        const key = `v:${dateStr}:${String(h).padStart(2,'0')}`
        try {
          const val = await redis.get(key)
          if (val) {
            const p = typeof val === 'string' ? JSON.parse(val) : val
            results.push({ date: dateStr, hour: h, visitors: p.v, count: p.n })
          }
        } catch(e) {}
      }
    }

    const byHour = {}
    results.forEach(r => {
      if (!byHour[r.hour]) byHour[r.hour] = []
      byHour[r.hour].push(r.visitors)
    })

    const averages = {}
    Object.keys(byHour).forEach(h => {
      const vals = byHour[h]
      averages[h] = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)
    })

    return res.status(200).json({ data: results, averages })
  } catch(err) {
    return res.status(500).json({ error: err.message })
  }
}
