import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from "axios";

const apiKey = "AIzaSyCLftSvfwZzGu0Lp4yEh9f-Z5UlRAtKwLM";
const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&key=${apiKey}&type=video`;
const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&key=${apiKey}`;

function Home() {
  const [videos, setVideos] = useState([]);
  const [channelImages, setChannelImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const navigate = useNavigate();

  const fetchVideos = async (query) => {
    setLoading(true);
    try {
      const response = await axios.get(`${searchApiUrl}&q=${query || "muse"}`);
      const fetchedVideos = response.data.items;
      await fetchVideoStatistics(fetchedVideos);
      await fetchChannelImages(fetchedVideos);
      setVideos(fetchedVideos);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const fetchVideoStatistics = async (videos) => {
    const videoIds = videos.map((video) => video.id.videoId).join(",");
    try {
      const statsResponse = await axios.get(`${videoApiUrl}&id=${videoIds}`);
      const statsData = statsResponse.data.items;

      videos.forEach((video, index) => {
        video.statistics = statsData[index]?.statistics || {};
        video.contentDetails = statsData[index]?.contentDetails || {};
      });
    } catch (error) {
      console.error("Error fetching video statistics:", error);
    }
  };

  const fetchChannelImages = async (videos) => {
    const channelImageMap = {};
    const fetchPromises = videos.map(async (video) => {
      const channelId = video.snippet.channelId;
      try {
        const channelResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`
        );
        const channelData = channelResponse.data.items[0];
        const channelImage = channelData.snippet.thumbnails.default.url;
        channelImageMap[channelId] = channelImage;
      } catch (error) {
        console.error(
          `Error fetching channel image for channelId ${channelId}:`,
          error
        );
      }
    });
    await Promise.all(fetchPromises);
    setChannelImages(channelImageMap);
  };

  const formatViewsAndTime = (views, publishedAt) => {
    const formattedViews = views
      ? new Intl.NumberFormat("ar-EG", {
          notation: "compact",
        }).format(views)
      : "غير متاح";

    const timeSincePublished = Math.floor(
      (new Date() - new Date(publishedAt)) / (1000 * 60 * 60 * 24)
    );
    const timeString =
      timeSincePublished > 0 ? `قبل ${timeSincePublished} أيام` : "اليوم";

    return `${formattedViews} مشاهدة • ${timeString}`;
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSearch = () => {
    if (searchTerm) {
      fetchVideos(searchTerm);
    }
  };

  const handleVideoClick = (video) => {
    navigate(`/content/${video.id.videoId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div role="status">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-gray-200 animate-spin fill-blue-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full"> 
      <header className="text-white py-2 px-4 flex items-center justify-between bg-white  fixed-top">
        <div className="flex items-center space-x-4 h-10 w-10">
          <img
            src="https://www.shutterstock.com/image-vector/blank-avatar-photo-place-holder-600nw-1114445501.jpg"
            className="rounded-full"
            alt="profile"
          />
          <button className="text-black p-2 bg-[#f0f0f0] rounded-full">
            <i className="fas fa-bell"></i>
          </button>
          <button className="text-black px-4 py-2 bg-[#f0f0f0] rounded-full flex items-center space-x-1">
            <span>إنشاء</span>
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button className="text-black">
            <i className="fas fa-microphone"></i>
          </button>
          <div className="flex items-center bg-white rounded-full px-4 py-1 shadow-md search-field">
            <button className="text-black" onClick={handleSearch}>
              <i className="fas fa-search"></i>
            </button>
            <button className="text-black ml-3">
              <i className="fas fa-keyboard"></i>
            </button>
            <input
              type="text"
              placeholder="بحث"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-black outline-none px-4 w-full text-right"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/home">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg"
              className="w-20"
              alt="YouTube Logo"
            />
          </Link>
          <button
            onClick={() => setMenuVisible(!menuVisible)}
            className="text-black p-2 bg-black-900 rounded-full"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </header>{" "}
      <br />
      <br />
      <div className="flex flex-col md:flex-row">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2 p-6 w-full">
          {videos.map((video) => (
            <div
              key={video.id.videoId}
              className="group w-full cursor-pointer"
              onClick={() => handleVideoClick(video)}
            >
              <div className="relative">
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="mt-3 flex flex-col text-right">
                <div className="flex items-center justify-end">
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold group-hover:text-blue-500 transition">
                      {video.snippet.title}
                    </h4>
                    <div className="flex ml-auto justify-end">
                      <p className="text-xs text-gray-500">
                        {video.snippet.channelTitle}
                      </p>
                      <img
                        src={
                          channelImages[video.snippet.channelId] ||
                          "https://via.placeholder.com/40"
                        }
                        alt="صورة القناة"
                        className="rounded-full w-5 h-5 ml-2"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <p>
                    {formatViewsAndTime(
                      video.statistics?.viewCount,
                      video.snippet.publishedAt
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      <div className={`w-64 bg-white text-right p-4 overflow-auto fixed top-0 right-0 h-full transition-transform transform ${menuVisible ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0`}>
        <button
          onClick={() => setMenuVisible(false)}
          className="text-black p-2 absolute top-4 right-4 md:hidden"
        >
          <i className="fas fa-times"></i>
        </button>
        <ul className="space-y-2">
          <Link
            to="/home"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <li className="py-2 hover:bg-gray-100 rounded-lg">
              الصفحة الرئيسية
            </li>
          </Link>
          <li className="py-2 hover:bg-gray-100 rounded-lg">Shorts</li>
          <li className="py-2 hover:bg-gray-100 rounded-lg">الاشتراكات</li>
          <hr />
          <li className="py-2 hover:bg-gray-100 rounded-lg">أنت</li>
          <li className="py-2 hover:bg-gray-100 rounded-lg">قناتك</li>
          <li className="py-2 hover:bg-gray-100 rounded-lg">السجل</li>
          <li className="py-2 hover:bg-gray-100 rounded-lg">قوائم التشغيل</li>
          <li className="py-2 hover:bg-gray-100 rounded-lg">فيديوهاتك</li>
          <li className="py-2 hover:bg-gray-100 rounded-lg">
            مقاطع البودكاست الخاصة بك
          </li>
          <li className="py-2 hover:bg-gray-100 rounded-lg">
            المشاهدة لاحقًا
          </li>
          <li className="py-2 hover:bg-gray-100 rounded-lg">
            الفيديوهات التي أعجبتني
          </li>
          <hr />
          <div className="mt-4">
            <h4 className="font-bold text-gray-700">استكشاف</h4>
            <ul className="space-y-2 mt-2">
              <li className="py-2 hover:bg-gray-100 rounded-lg">
                المحتوى الرائج
              </li>
              <li className="py-2 hover:bg-gray-100 rounded-lg">موسيقى</li>
              <li className="py-2 hover:bg-gray-100 rounded-lg">بث مباشر</li>
              <li className="py-2 hover:bg-gray-100 rounded-lg">
                ألعاب فيديو
              </li>
              <li className="py-2 hover:bg-gray-100 rounded-lg">رياضة</li>
            </ul>
          </div>
          <hr />
          <div className="text-sm text-gray-500 mt-4">
            <p>© 2024 Google LLC</p>
          </div>
        </ul>
      </div>

      </div>
    </div>
  );
}

export default Home;
