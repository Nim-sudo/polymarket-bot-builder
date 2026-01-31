// Polymarket Gamma API Proxy
// Bypasses CORS restrictions by proxying requests through our backend

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Get the endpoint and query string from the request
        // Vercel passes the full URL, we need to extract the query string
        const fullUrl = req.url;
        const queryString = fullUrl.includes('?') ? fullUrl.split('?')[1] : '';

        // Build the Gamma API URL
        // The request will come in as /api/polymarket?path=/markets&limit=10&active=true
        const urlParams = new URLSearchParams(queryString);
        const path = urlParams.get('path') || '/markets';
        urlParams.delete('path');

        const apiUrl = `https://gamma-api.polymarket.com${path}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;

        console.log('Proxying request to:', apiUrl);

        // Forward the request to Gamma API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Polymarket-Bot-Builder/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Return the data with CORS headers
        res.status(200).json(data);

    } catch (error) {
        console.error('Polymarket API Proxy Error:', error);
        res.status(500).json({
            error: 'Failed to fetch from Polymarket API',
            message: error.message
        });
    }
}
