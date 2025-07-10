export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { username, password } = JSON.parse(body);

      if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
      ) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (err) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
  });
}
