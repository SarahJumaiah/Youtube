import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useParams } from "react-router-dom";

const apiKey = "AIzaSyCLftSvfwZzGu0Lp4yEh9f-Z5UlRAtKwLM";
const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&key=${apiKey}`;
const randomVideosApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&key=${apiKey}&type=video`;
const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&key=${apiKey}`;
const commentsApiUrl = "https://66edc361380821644cddefa5.mockapi.io/comments";

function Content() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [randomVideos, setRandomVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState(null);
  const [channelImage, setChannelImage] = useState("");
  const [subscribers, setSubscribers] = useState("");
  const [likes, setLikes] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRandomVideos();
  }, []);

  useEffect(() => {
    if (id) {
      fetchVideoData(id);
    }
  }, [id]);

  const formatViewsAndDate = (viewCount, publishedAt) => {
    const views = viewCount
      ? new Intl.NumberFormat("ar-EG", {
          notation: "compact",
        }).format(viewCount)
      : "غير متاح";

    const publishedDate = new Date(publishedAt);
    const timeSincePublished = Math.floor(
      (new Date() - publishedDate) / (1000 * 60 * 60 * 24 * 7)
    );
    const timeString =
      timeSincePublished > 0 ? `قبل ${timeSincePublished} أسابيع` : "اليوم";

    return `${views} مشاهدة • ${timeString}`;
  };

  const fetchRandomVideos = async () => {
    try {
      const response = await axios.get(randomVideosApiUrl);
      await fetchVideoStatistics(response.data.items);
      setRandomVideos(response.data.items);
    } catch (error) {
      console.error("Error fetching side videos", error);
      setError("Error fetching side videos");
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

const fetchChannelSubscribers = async (channelId) => {
  try {
    const channelResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
    );
    const subscriberCount =
      channelResponse.data.items[0].statistics.subscriberCount;
    setSubscribers(subscriberCount); 
  } catch (error) {
    console.error("Error fetching subscriber count", error);
  }
};

const fetchVideoData = async (videoId) => {
  try {
    const response = await axios.get(`${videoApiUrl}&id=${videoId}`);
    const videoData = response.data.items[0];
    setVideo(videoData);
    setLikes(videoData.statistics.likeCount);
    setChannelImage(videoData.snippet.thumbnails.default.url);
    
    const channelId = videoData.snippet.channelId;
    await fetchChannelSubscribers(channelId); 
    
    await fetchComments(videoId);
    setLoading(false);
  } catch (error) {
    setError("Error fetching video data");
    setLoading(false);
  }
};


  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`${searchApiUrl}&q=${searchTerm}`);
      setRandomVideos(response.data.items);
      if (response.data.items.length > 0) {
        setVideo(response.data.items[0]);
        fetchVideoData(response.data.items[0].id.videoId);
      }
      setLoading(false);
    } catch (error) {
      setError("Error searching for videos");
      setLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    fetchVideoData(video.id.videoId);
  };

  const fetchComments = async (videoId) => {
    try {
      const customCommentsResponse = await axios.get(
        `${commentsApiUrl}?videoId=${videoId}`
      );
      const customComments = customCommentsResponse.data;

      const youtubeCommentsResponse = await axios.get(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&key=${apiKey}`
      );

      const youtubeComments = youtubeCommentsResponse.data.items.map(
        (item) => ({
          id: item.id,
          authorDisplayName:
            item.snippet.topLevelComment.snippet.authorDisplayName,
          textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
          publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
          authorProfileImageUrl:
            item.snippet.topLevelComment.snippet.authorProfileImageUrl ||
            "https://www.shutterstock.com/image-vector/blank-avatar-photo-place-holder-600nw-1114445501.jpg",
        })
      );

      setComments([...customComments, ...youtubeComments]);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("No comments found for this video.");
        setComments([]);
      } else {
        console.error("Error fetching comments:", error);
        setError("Error fetching comments");
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const storedUsername = localStorage.getItem("username");

    if (commentText.trim() !== "") {
      const newComment = {
        videoId: id || video.id.videoId,
        authorDisplayName: storedUsername || "Anonymous",
        textDisplay: commentText,
        publishedAt: new Date().toISOString(),
        likeCount: 0,
      };

      try {
        const response = await axios.post(commentsApiUrl, newComment);
        setUserComments([response.data, ...userComments]);
        setCommentText("");
      } catch (error) {
        setError("Error posting comment");
      }
    }
  };

  const handleMenuToggle = () => {
    setMenuVisible(!menuVisible);
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
  
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen w-full">
      <header className="text-white py-2 px-4 flex items-center justify-between bg-white fixed-top ">
        <div className="flex items-center space-x-4">
          <img
            src="https://www.shutterstock.com/image-vector/blank-avatar-photo-place-holder-600nw-1114445501.jpg"
            className="rounded-full w-10 h-10"
            alt="profile"
          />
          <button className="hidden md:flex text-black p-2 bg-[#f0f0f0] rounded-full">
            <i className="fas fa-bell"></i>
          </button>
          <button className="hidden md:flex text-black px-4 py-2 bg-[#f0f0f0] rounded-full  items-center space-x-1  ">
            <span>إنشاء</span>
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button className="text-black">
            <i className="fas fa-microphone hidden md:flex"></i>
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
            onClick={handleMenuToggle}
            className="text-black p-2 bg-black-900 rounded-full"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </header> <br /><br />

      {menuVisible && ( 
        <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg text-right text-gray-900 overflow-auto">
          <button
            onClick={() => setMenuVisible(false)}
            className="text-black p-2 "
          >
            <i className="fas fa-bars"></i>
          </button>
          <ul className="p-4 space-y-2">
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
            <div className="mt-4 pt-4">
              <ul className="space-y-2">
                <li className="py-2 hover:bg-gray-100 rounded-lg">الإعدادات</li>
                <li className="py-2 hover:bg-gray-100 rounded-lg">
                  سجلّ الإبلاغ عن المحتوى
                </li>
                <li className="py-2 hover:bg-gray-100 rounded-lg">مساعدة</li>
                <li className="py-2 hover:bg-gray-100 rounded-lg">
                  إرسال ملاحظات
                </li>
              </ul>
            </div>
            <hr />
            <div className="text-sm text-gray-500 mt-4">
              <p>© 2024 Google LLC</p>
            </div>
          </ul>
        </div>
      )}

      <div className="flex flex-col-reverse md:flex-row h-auto w-full">
        <aside className="md:w-[30vw] h-full bg-white overflow-y-auto p-4 border-r border-gray-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-500 text-white p-4 rounded-lg w-full ">
              <div className="flex items-center space-x-3">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png"
                  alt="LinkedIn Logo"
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold">Sarah Aljumaiah</h2>
                  <p className="text-sm">Connect with me on LinkedIn</p>
                </div>
              </div>

              <div className="ml-auto">
                <button
                  onClick={() =>
                    window.open(
                      "https://www.linkedin.com/in/sarah-aljumaiah-a6989b234/",
                      "_blank"
                    )
                  }
                  className="bg-white text-blue-500 font-semibold py-2 px-4 rounded-full hover:bg-gray-200 transition"
                >
                  Connect
                </button>
              </div>
            </div>

            <div className="flex space-x-1 mt-4 justify-center mx-2">
              <button className="bg-[#f0f0f0] text-black px-2 rounded-full text-xs">
                تمت مشاهدتها
              </button>
              <button className="bg-[#f0f0f0] text-black px-2 rounded-full text-xs">
                محتوى مقترح لك
              </button>
              <button className="bg-[#f0f0f0] text-black px-2 rounded-full text-xs">
                محتوى مشابه
              </button>
              <button className="bg-black text-white rounded-full text-xs">
                الكل
              </button>
            </div>
            {randomVideos.map((video) => (
              <div
                key={video.id.videoId}
                className="flex space-x-4 items-center text-right cursor-pointer ml-auto justify-end rounded-xl"
                onClick={() => handleVideoClick(video)}
              >
                <div className="flex flex-col">
                  <h3 className="text-sm font-semibold">
                    {video.snippet.title}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {video.snippet.channelTitle}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatViewsAndDate(
                      video.statistics?.viewCount,
                      video.snippet.publishedAt
                    )}
                  </p>
                </div>
                <img
                  src={video.snippet.thumbnails.default.url}
                  alt="Video Thumbnail"
                  className="w-24 h-16 rounded"
                />
              </div>
            ))}
          </div>
        </aside>
        <main className="p-6 overflow-y-auto text-right w-full md:w-[70vw] ml-auto">
          {video ? (
            <>
              <div className="w-full h-96 bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.snippet.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              <div className="mt-4 ml-auto">
                <h1 className="text-2xl font-semibold">
                  {video.snippet.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center mt-4 space-x-2 w-full justify-end">
                <button className="bg-[#f0f0f0] text-black px-4 py-2 rounded-full">
                  <i className="fas fa-thumbs-up"></i> {likes}
                </button>
                <button className="bg-[#f0f0f0] text-black px-4 py-2 rounded-full">
                  <i className="fas fa-thumbs-down"></i>
                </button>
                <button className="bg-[#f0f0f0] text-black px-4 py-2 rounded-full">
                  مشاركة
                </button>
                <button className="bg-[#f0f0f0] text-black px-4 py-2 rounded-full">
                  تنزيل
                </button>
                <button className="bg-black text-white px-4 py-2 rounded-full">
                  اشترك
                </button>

                <div className="flex items-center space-x-2 ml-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {video.snippet.channelTitle}
                    </p>
                    {subscribers ? (
                      <p className="text-sm text-gray-500">
                        {subscribers.toLocaleString()}  مشتركين
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No subscriber count available
                      </p>
                    )}
                  </div>

                  {channelImage ? (
                    <img
                      src={channelImage}
                      alt="Channel Avatar"
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <img
                      src="https://via.placeholder.com/40"
                      alt="Default Avatar"
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg mt-4 ml-auto justify-end">
                <p className="text-gray-600 text-sm">
                  <div className="flex justify-end items-center text-gray-500">
                    <p className="mr-2">
                      {new Date(video.snippet.publishedAt).toLocaleDateString(
                        "ar-EG",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      )}
                    </p>
                    <p className="mr-2">
                      {video.statistics?.viewCount
                        ? video.statistics.viewCount.toLocaleString("ar-EG")
                        : "N/A"}{" "}
                      مشاهدات
                    </p>
                  </div>
                  {video.snippet.description}
                </p>
              </div>

              <div className="mt-6 w-[60vw] ml-auto justify-end">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-right justify-end ml-auto">
                    التعليقات
                  </h2>
                </div>

                <form onSubmit={handleCommentSubmit}>
  <div className="flex items-center mb-4 flex-row-reverse w-full space-x-0 sm:space-x-2">
    <img
      src="https://www.shutterstock.com/image-vector/blank-avatar-photo-place-holder-600nw-1114445501.jpg"
      className="rounded-full w-10 h-10"
      alt="profile"
    />
    <input
      type="text"
      placeholder="إضافة تعليق..."
      value={commentText}
      onChange={(e) => setCommentText(e.target.value)}
      className="bg-gray-100 rounded-full py-2 px-4 flex-grow text-sm text-right"
    />
    <button
      type="submit"
      className="bg-black text-white py-1 px-4 rounded-full ml-2"
    >
      تعليق
    </button>
  </div>
</form>


                <div className="user-comments">
                  {userComments.length > 0 && (
                    <div className="mb-4">
                      {userComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start space-x-2 flex-row-reverse mb-4"
                        >
                          <img
                            src="https://secure.gravatar.com/avatar/6cebda13b6bbc5100f3f1955ec805c60?d=https://www.idlethumbs.net/forums/uploads/monthly_2017_08/Y.png.3c6607b74155c6a6b16ccb9e32b33871.png"
                            className="rounded-full w-10 h-10"
                            alt="profile"
                          />
                          <div className="flex flex-col items-end text-right">
                            <div className="flex items-center space-x-2 flex-row-reverse">
                              <p className="font-semibold">
                                {comment.authorDisplayName}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {new Date(
                                  comment.publishedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm">{comment.textDisplay}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="api-comments">
                  {comments.length > 0 && (
                    <div>
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start space-x-2 flex-row-reverse mb-4"
                        >
                          <img
                            src={
                              comment.authorProfileImageUrl ||
                              "https://www.shutterstock.com/image-vector/blank-avatar-photo-place-holder-600nw-1114445501.jpg"
                            }
                            alt="User Avatar"
                            className="rounded-full h-10 w-10"
                          />
                          <div className="flex flex-col items-end text-right">
                            <div className="flex items-center space-x-2 flex-row-reverse">
                              <p className="font-semibold">
                                {comment.authorDisplayName}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {new Date(
                                  comment.publishedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm">{comment.textDisplay}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>No video selected</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default Content;
