export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Token ONLY from server environment — never from client
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token non configuré sur le serveur.' });

  const { dbId, cursor } = req.body;
  if (!dbId) return res.status(400).json({ error: 'Database ID manquant.' });

  const body = { page_size: 100, sorts: [{ property: 'Date', direction: 'descending' }] };
  if (cursor) body.start_cursor = cursor;

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Erreur Notion' });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Impossible de contacter Notion. Vérifie ta connexion.' });
  }
}
