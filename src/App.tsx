import { useState, useEffect } from 'react';
import './App.css';
import * as XLSX from 'xlsx';

interface Video {
    title: string;
    videoUrl: string;
    likeCount: number;
    viewCount: number;
    commentCount: number;
}

const App = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [videoToDelete, setVideoToDelete] = useState<string>('');
    const [successNotification, setSuccessNotification] = useState<boolean>(false);
    const [errorNotification, setErrorNotification] = useState<boolean>(false);
    const [csvAlert, setCsvAlert] = useState<boolean>(false);
    const [fileTypeErrorModal, setFileTypeErrorModal] = useState<boolean>(false);
    const [filteredVideos, setFilteredVideos] = useState<Video[]>(videos);


    useEffect(() => {
        const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]') as Video[];
        setVideos(storedVideos);
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const filtered = videos.filter(video =>
                video.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredVideos(filtered);
        }, 300); // Delay for debounce effect

        return () => clearTimeout(timeoutId); // Cleanup the timeout on unmount or searchTerm change
    }, [searchTerm, videos]);

    const renderVideoList = (videos: Video[]) => {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map(video => (
                    <div key={video.videoUrl} className="rounded overflow-hidden shadow-lg bg-white">
                        <img className="w-full" src={`https://img.youtube.com/vi/${getYouTubeVideoId(video.videoUrl)}/0.jpg`} alt={video.title} />
                        <div className="px-6 py-4">
                            <div className="font-bold text-xl mb-2">{video.title}</div>
                            <p className="text-gray-700 text-base">Like Count: {video.likeCount}</p>
                            <p className="text-gray-700 text-base">View Count: {video.viewCount}</p>
                            <p className="text-gray-700 text-base">Comment Count: {video.commentCount}</p>
                        </div>
                        <div className="px-6 py-4">
                            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full" onClick={() => handleDelete(video.videoUrl)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handleDelete = (videoUrlToDelete: string) => {
        setVideoToDelete(videoUrlToDelete);
        setDeleteModal(true);
    };

    const confirmDelete = () => {
        const updatedVideos = videos.filter(video => video.videoUrl !== videoToDelete);
        localStorage.setItem('videos', JSON.stringify(updatedVideos));
        setVideos(updatedVideos);
        setSuccessNotification(true);
        setDeleteModal(false);
        setTimeout(() => setSuccessNotification(false), 3000);
    };

    const cancelDelete = () => {
        setDeleteModal(false);
        setVideoToDelete('');
    };

    const getYouTubeVideoId = (url: string) => {
        const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[1] ? match[1].slice(0, 11) : null;
    };

    const handleFetchClick = async () => {
        try {
            await getYouTubeVideoData(videoUrl);
        } catch (error: unknown) {
            console.error((error as Error).message);
        }
    };

    const getYouTubeVideoData = async (url: string) => {
      const videoId = getYouTubeVideoId(url);
      if (!videoId) {
          throw new Error('Invalid YouTube Video URL');
      }

      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=YOUR_API_KEY`);
      const data = await response.json();

      if (data.items.length === 0) {
          throw new Error('No video data found');
      }

      const video = data.items[0];
      const newVideo: Video = {
          title: video.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          likeCount: video.statistics.likeCount,
          viewCount: video.statistics.viewCount,
          commentCount: video.statistics.commentCount
      };

      const existingVideo = videos.find(video => video.videoUrl === newVideo.videoUrl);
      if (existingVideo) {
          setErrorNotification(true);
          setTimeout(() => setErrorNotification(false), 3000);
          return;
      }

      const updatedVideos = [...videos, newVideo];
      localStorage.setItem('videos', JSON.stringify(updatedVideos));
      setVideos(updatedVideos);
      setSuccessNotification(true);
      setTimeout(() => setSuccessNotification(false), 3000);
  };

    const handleUploadCsv = () => {
        if (csvFile) {
            const validFileTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (!validFileTypes.includes(csvFile.type)) {
                setFileTypeErrorModal(true);
                return;
            }

            setCsvAlert(true);
            const reader = new FileReader();
            reader.onload = function (e) {
                if (e && e.target) {
                    const csv = e.target.result as string;
                    const lines = csv.split(/\r\n|\n/);
                    const urls = lines.map(line => line.trim()).filter(line => line !== '');
                    urls.forEach(async (url: string) => {
                        try {
                            await getYouTubeVideoData(url);
                        } catch (error) {
                            console.error((error as Error).message);
                        }
                    });
                    setCsvAlert(false);
                }
            };
            reader.readAsText(csvFile);
        }
    };

    const handleExportToExcel = () => {
        if (videos.length > 0) {
            const header = ['Nama Video', 'URL Video', 'Total Likes', 'Total Views', 'Total Komen'];
            const data = videos.map(video => [video.title, video.videoUrl, video.likeCount, video.viewCount, video.commentCount]);
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'YouTube Video Data');
            XLSX.writeFile(wb, 'youtube_video_data.xlsx');
        } else {
            alert('No data to export!');
        }
    };

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold my-4" style={{ color: '#ecf5f8' }}>Website Otomatisasi Rekapitulasi Data Video YouTube</h1>
            <div className="flex items-center mb-4">
                <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="form-input rounded-l py-2 px-4" placeholder="Enter YouTube Video URL" />
                <button onClick={handleFetchClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r">Fetch Video Data</button>
            </div>
            <div className="flex items-center mb-4">
                <input type="file" onChange={e => setCsvFile(e.target.files ? e.target.files[0] : null)} id="csv-file" accept=".csv" className="form-input rounded-l py-2 px-4" />
                <button onClick={handleUploadCsv} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r">Upload CSV</button>
            </div>
            <div className="flex items-center mb-4">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input rounded-l py-2 px-4" placeholder="Search..." />
                <span className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r cursor-default">
                    <i className="fas fa-search"></i>
                </span>
            </div>
            <button onClick={handleExportToExcel} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 mb-4 rounded">Export to Excel</button>
            <div id="video-list">
                {renderVideoList(filteredVideos)}
            </div>

            {deleteModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg font-medium text-gray-900" id="modal-title">Delete Video Data</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">Are you sure you want to delete this video data?</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button onClick={confirmDelete} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">Delete</button>
                                <button onClick={cancelDelete} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {fileTypeErrorModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m0-4h.01M12 6h.01M8 8h8m-4 4h.01M12 16h.01M12 4v16m0 0H4m8 0h8" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Unsupported File Type</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">The file type you uploaded is not supported. Please upload a CSV, XLS, or XLSX file.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setFileTypeErrorModal(false)}>OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {successNotification && (
                <div id="success-notification" className="alert alert-success centered-alert" role="alert">
                    <strong>Success:</strong> Video data has been successfully added.
                </div>
            )}

            {errorNotification && (
                <div id="error-notification" className="alert alert-danger centered-alert" role="alert">
                    <strong>Error:</strong> This video data already exists.
                </div>
            )}

            {csvAlert && (
                <div id="csv-alert" className="alert alert-info centered-alert" role="alert">
                    <strong>Info:</strong> Uploading and processing CSV file...
                </div>
            )}
        </div>
    );
};

export default App;