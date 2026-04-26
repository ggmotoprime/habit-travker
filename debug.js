export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { token, dbId } = req.body;
  if (!token || !dbId) return res.status(400).json({ error: 'Missing token or dbId' });

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 1, sorts: [{ property: 'Date', direction: 'descending' }] }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    // Return just the property names and their values from the first page
    const page = data.results[0];
    const simplified = {};
    for (const [key, val] of Object.entries(page.properties)) {
      simplified[key] = {
        type: val.type,
        value: val.type === 'checkbox' ? val.checkbox : val.type === 'date' ? val.date : '...'
      };
    }
    return res.status(200).json({ properties: simplified });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
