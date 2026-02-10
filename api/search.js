// vercel/api/search.js
const ytsr = require('ytsr');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    const { q: query, limit = 10 } = req.query;
    
    if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
    }
    
    try {
        const searchResults = await ytsr(query, { limit: parseInt(limit) });
        
        const results = searchResults.items
            .filter(item => item.type === 'video')
            .map(item => ({
                id: item.id,
                title: item.title,
                url: item.url,
                duration: item.duration,
                thumbnail: item.bestThumbnail.url,
                channel: item.author.name,
                views: item.views,
                uploaded: item.uploadedAt
            }));
        
        res.json({
            query,
            results,
            count: results.length
        });
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
};
