// vercel/api/convert.js
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'POST') {
        try {
            const { audio, format = 'mp3', bitrate = '128k' } = req.body;
            
            if (!audio) {
                return res.status(400).json({ error: 'Audio data required' });
            }
            
            // Decode base64 audio
            const audioBuffer = Buffer.from(audio, 'base64');
            const tempInput = path.join('/tmp', `input_${Date.now()}.webm`);
            const tempOutput = path.join('/tmp', `output_${Date.now()}.${format}`);
            
            await writeFile(tempInput, audioBuffer);
            
            // Convert using ffmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .output(tempOutput)
                    .audioCodec(format === 'mp3' ? 'libmp3lame' : 'copy')
                    .audioBitrate(bitrate)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });
            
            // Read converted file
            const outputBuffer = fs.readFileSync(tempOutput);
            const base64Output = outputBuffer.toString('base64');
            
            // Cleanup
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);
            
            res.json({
                success: true,
                format,
                size: outputBuffer.length,
                data: base64Output
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
