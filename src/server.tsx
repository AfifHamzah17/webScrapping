// // server.ts
// import express, { Request, Response } from 'express';
// import axios from 'axios';

// const app = express();
// const port = 3001;

// app.use(express.json());

// app.get('/api/scrape', async (req: Request, res: Response) => {
//   const { url } = req.query;

//   try {
//     const videoId = extractVideoId(url as string);
//     if (!videoId) {
//       return res.status(400).json({ error: 'Invalid YouTube URL' });
//     }

//     const apiKey = 'YOUR_YOUTUBE_API_KEY';
//     const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;

//     const response = await axios.get(apiUrl);
//     const data = response.data.items[0];
    
//     if (!data) {
//       return res.status(404).json({ error: 'Video not found' });
//     }

//     const { viewCount, likeCount, commentCount } = data.statistics;
    
//     res.json({ 
//       totalViews: viewCount, 
//       totalLikes: likeCount, 
//       totalComments: commentCount 
//     });
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     res.status(500).json({ error: 'Error fetching data' });
//   }
// });

// function extractVideoId(url: string): string | null {
//   const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
//   const match = url.match(regex);
//   return match ? match[1] : null;
// }

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
