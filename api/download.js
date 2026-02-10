// vercel/api/download.js
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const { url, format = 'mp3', quality = '128k' } = req.query;
        
        if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }
        
        // Get video info
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        // Download audio stream
        const audioStream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
        });
        
        // Convert to requested format
        if (format === 'mp3') {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
            
            const ffmpegProcess = ffmpeg(audioStream)
                .audioCodec('libmp3lame')
                .audioBitrate(quality)
                .format('mp3');
            
            await pipeline(ffmpegProcess, res);
        } else {
            // Raw audio
            res.setHeader('Content-Type', 'audio/webm');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.webm"`);
            await pipeline(audioStream, res);
        }
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Download failed'
        });
    }
};
