import { useState, useEffect } from 'react';
import axios from 'axios';

const apiKey = 'AIzaSyB8g3kIEWtdHC2RhqGFQDIaCBvMGkdqMKQ'; // YouTube API key

function VideoList({ onVideoClick }) {
  const [videos, setVideos] = useState([]); // State to store the videos

  useEffect(() => {
    // Fetch videos from YouTube API using Axios
    axios
      .get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&key=${apiKey}&type=video`
      )
      .then((response) => {
        setVideos(response.data.items); // Update state with video data
      })
      .catch((error) => {
        console.error('Error fetching YouTube videos', error);
      });
  }, []);

  return (
    <div className="list-group">
      {videos.map((video) => (
        <button
          key={video.id.videoId}
          onClick={() => onVideoClick(video)}
          className="list-group-item list-group-item-action"
        >
          <img
            src={video.snippet.thumbnails.medium.url}
            alt={video.snippet.title}
            className="img-fluid mb-2"
          />
          <h5 className="mb-1">{video.snippet.title}</h5>
        </button>
      ))}
    </div>
  );
}

export default VideoList;
