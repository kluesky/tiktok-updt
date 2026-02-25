// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Video, Copy, Loader2, 
  ChevronDown, Heart, Share2, Clock, Eye,
  MessageCircle, Sparkles, Zap, Shield, Globe, CheckCircle,
  X, ChevronRight, Moon, Sun, Image
} from 'lucide-react';

// Interface untuk data TikTok
interface TikTokData {
  title?: string;
  play?: string;
  hdplay?: string;
  music?: string;
  images?: string[];
  author?: {
    unique_id?: string;
    nickname?: string;
    avatar?: string;
  };
  duration?: number;
  digg_count?: number;
  share_count?: number;
  play_count?: number;
  comment_count?: number;
  create_time?: number;
  region?: string;
}

function App() {
  // State management
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [downloadingMp3, setDownloadingMp3] = useState(false);
  const [downloadingSlide, setDownloadingSlide] = useState(false);
  const [videoData, setVideoData] = useState<TikTokData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quality, setQuality] = useState<'sd' | 'hd'>('hd');
  
  // State untuk modal slide
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [slideSelection, setSlideSelection] = useState('all');
  const [totalSlides, setTotalSlides] = useState(0);
  
  // State untuk info banner
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  
  // Refs
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to result when data is loaded
  useEffect(() => {
    if (videoData && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [videoData]);

  // Auto-hide notifications
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Validate TikTok URL
  const isValidTikTokUrl = (url: string): boolean => {
    return url.includes('tiktok.com') && url.trim().length > 0;
  };

  // Format number
  const formatNumber = (num?: number): string => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Format date
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Generate random filename
  const generateFilename = (author?: string): string => {
    const date = new Date();
    const random = Math.floor(Math.random() * 10000);
    const cleanAuthor = author?.replace(/[^a-zA-Z0-9]/g, '') || 'TikTok';
    return `chisato_${cleanAuthor}_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${random}`;
  };

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      if (inputRef.current) {
        inputRef.current.value = text;
        inputRef.current.focus();
      }
      setSuccess('✅ Link berhasil ditempel!');
    } catch (err) {
      const pastedText = prompt('Tempel link TikTok di sini:');
      if (pastedText) {
        setUrl(pastedText);
        if (inputRef.current) {
          inputRef.current.value = pastedText;
          inputRef.current.focus();
        }
      }
    }
  };

  // Clear input
  const clearInput = () => {
    setUrl('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch TikTok data dengan multi-API fallback
  const fetchTikTokData = async (url: string): Promise<TikTokData> => {
    const apis = [
      {
        name: 'TikWM',
        url: `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
        parser: (data: any) => ({
          play: data.data.play,
          hdplay: data.data.hdplay || data.data.play,
          music: data.data.music,
          author: {
            nickname: data.data.author.nickname,
            unique_id: data.data.author.unique_id,
            avatar: data.data.author.avatar
          },
          title: data.data.title,
          images: data.data.images,
          digg_count: data.data.digg_count,
          play_count: data.data.play_count,
          comment_count: data.data.comment_count,
          share_count: data.data.share_count,
          duration: data.data.duration,
          create_time: data.data.create_time,
          region: data.data.region
        })
      },
      {
        name: 'TikMate',
        url: `https://api.tikmate.io/api/tiktok?url=${encodeURIComponent(url)}`,
        parser: (data: any) => ({
          play: data.video_url,
          hdplay: data.video_url_hd || data.video_url,
          music: data.audio_url,
          author: {
            nickname: data.author_name,
            unique_id: data.author_username,
            avatar: data.author_avatar
          },
          title: data.title,
          images: data.images,
          digg_count: data.like_count,
          play_count: data.view_count,
          comment_count: data.comment_count,
          share_count: data.share_count,
          duration: data.duration,
          create_time: data.create_time,
          region: data.region
        })
      },
      {
        name: 'SnapTik',
        url: `https://api.snaptik.app/video?url=${encodeURIComponent(url)}`,
        parser: (data: any) => ({
          play: data.video,
          hdplay: data.video_hd || data.video,
          music: data.audio,
          author: {
            nickname: data.author.name,
            unique_id: data.author.username,
            avatar: data.author.avatar
          },
          title: data.title,
          images: data.images,
          digg_count: data.stats?.likes,
          play_count: data.stats?.views,
          comment_count: data.stats?.comments,
          share_count: data.stats?.shares,
          duration: data.duration,
          create_time: data.create_time,
          region: data.region
        })
      }
    ];

    // Coba API satu per satu
    for (const api of apis) {
      try {
        console.log(`🔄 Mencoba API: ${api.name}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(api.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Validasi data
        if (!data || (api.name === 'TikWM' && data.code !== 0)) {
          throw new Error('Data tidak valid');
        }

        const parsedData = api.parser(data);
        
        // Validasi URL video
        if (!parsedData.play && !parsedData.hdplay) {
          throw new Error('Tidak ada URL video');
        }

        console.log(`✅ API ${api.name} berhasil!`);
        return parsedData;
        
      } catch (error) {
        console.warn(`⚠️ API ${api.name} gagal:`, error);
        // Lanjut ke API berikutnya
      }
    }

    throw new Error('Semua API gagal. Coba lagi nanti');
  };

  // Download file helper
  const downloadFile = async (url: string, filename: string, expectedType: 'video' | 'audio' | 'image' = 'video'): Promise<void> => {
    try {
      console.log(`📥 Downloading from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'video/mp4, video/webm, video/*, audio/*, image/*, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': 'bytes=0-'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      console.log('📦 Content-Type:', contentType);
      console.log('📏 Content-Length:', contentLength, 'bytes');
      
      const blob = await response.blob();
      
      // Validasi ukuran file
      if (blob.size < 1024) { // Kurang dari 1KB
        throw new Error('File terlalu kecil');
      }
      
      // Validasi tipe file
      if (expectedType === 'video' && blob.type.includes('audio')) {
        throw new Error('Server mengirim audio, bukan video');
      }
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidTikTokUrl(url)) {
      setError('⚠️ Masukkan link TikTok yang valid');
      return;
    }

    setLoading(true);
    setError(null);
    setVideoData(null);

    try {
      const data = await fetchTikTokData(url);
      setVideoData(data);
      setSuccess('✅ Video berhasil ditemukan!');
    } catch (error) {
      setError(`❌ ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle download video dengan validasi
  const handleDownloadVideo = async () => {
    if (!videoData?.play && !videoData?.hdplay) return;

    setDownloadingVideo(true);
    setError(null);

    try {
      const filename = generateFilename(videoData.author?.nickname) + '.mp4';
      let videoUrl = quality === 'hd' && videoData.hdplay ? videoData.hdplay : videoData.play;
      
      console.log('🎥 Mencoba download video dari:', videoUrl);
      
      // Cek tipe konten sebelum download
      try {
        const headResponse = await fetch(videoUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const contentType = headResponse.headers.get('content-type');
        const contentLength = headResponse.headers.get('content-length');
        
        console.log('📦 Content-Type:', contentType);
        console.log('📏 Content-Length:', contentLength, 'bytes');
        
        // Kalau content-type audio, coba pake API lain
        if (contentType?.includes('audio') || (contentLength && parseInt(contentLength) < 50000)) {
          console.warn('⚠️ Video URL mengembalikan audio/file kecil, mencoba refresh data...');
          
          // Refresh data dari API
          const freshData = await fetchTikTokData(url);
          setVideoData(freshData);
          
          // Coba lagi dengan data baru
          videoUrl = quality === 'hd' && freshData.hdplay ? freshData.hdplay : freshData.play;
        }
      } catch (headError) {
        console.warn('HEAD request gagal, lanjut download:', headError);
      }
      
      // Download dengan validasi
      await downloadFile(videoUrl, filename, 'video');
      
      setSuccess('✅ Video berhasil diunduh!');
    } catch (error) {
      console.error('❌ Download error:', error);
      
      // Coba alternatif URL
      if (quality === 'hd' && videoData.play) {
        try {
          console.log('🔄 Mencoba dengan URL SD...');
          const filename = generateFilename(videoData.author?.nickname) + '.mp4';
          await downloadFile(videoData.play, filename, 'video');
          setSuccess('✅ Video berhasil diunduh (SD)!');
          setDownloadingVideo(false);
          return;
        } catch (sdError) {
          console.error('SD juga gagal:', sdError);
        }
      }
      
      setError('❌ Gagal mengunduh video. Silahkan gunakan tombol download manual di pojok kanan bawah video.');
    } finally {
      setDownloadingVideo(false);
    }
  };

  // Handle download MP3
  const handleDownloadMP3 = async () => {
    if (!videoData?.music) return;

    setDownloadingMp3(true);
    setError(null);

    try {
      const filename = generateFilename(videoData.author?.nickname) + '.mp3';
      await downloadFile(videoData.music, filename, 'audio');
      setSuccess('✅ MP3 berhasil diunduh!');
    } catch (error) {
      setError('❌ Gagal mengunduh MP3');
    } finally {
      setDownloadingMp3(false);
    }
  };

  // Handle download slide dengan pilihan
  const handleSlideDownload = async (selection: string, images: string[], author?: string) => {
    try {
      setDownloadingSlide(true);
      
      let selectedIndices: number[] = [];
      
      if (selection.toLowerCase() === 'all' || selection === '') {
        selectedIndices = images.map((_, i) => i);
      } else {
        const parts = selection.split(',');
        
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= images.length) {
                selectedIndices.push(i - 1);
              }
            }
          } else {
            const num = Number(part);
            if (num >= 1 && num <= images.length) {
              selectedIndices.push(num - 1);
            }
          }
        }
      }
      
      selectedIndices = [...new Set(selectedIndices)].sort((a, b) => a - b);
      
      if (selectedIndices.length === 0) {
        setError('❌ Tidak ada slide yang dipilih');
        setDownloadingSlide(false);
        return;
      }
      
      for (let i = 0; i < selectedIndices.length; i++) {
        const idx = selectedIndices[i];
        const imageUrl = images[idx];
        const filename = `${generateFilename(author)}_slide_${idx + 1}.jpg`;
        
        await downloadFile(imageUrl, filename, 'image');
        
        // Kasih jeda biar gak overload
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setSuccess(`✅ ${selectedIndices.length} slide berhasil diunduh!`);
    } catch (error) {
      setError('❌ Gagal mengunduh slide');
    } finally {
      setDownloadingSlide(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
        darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`absolute inset-0 rounded-xl blur-md transition-opacity ${
                  darkMode ? 'bg-purple-500/30' : 'bg-purple-200'
                }`}></div>
                <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-purple-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Chisato<span className="text-purple-500">.</span>
                </h1>
                <p className={`text-xs ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  TikTok Downloader
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className={`text-sm font-medium transition-colors ${
                darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
                Home
              </a>
              <a href="#features" className={`text-sm font-medium transition-colors ${
                darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
                Features
              </a>
              <a href="#howto" className={`text-sm font-medium transition-colors ${
                darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
                How to Use
              </a>
              <a href="#faq" className={`text-sm font-medium transition-colors ${
                darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}>
                FAQ
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className={`p-2 rounded-xl transition-colors ${
                darkMode 
                  ? 'bg-gray-800 text-slate-300 hover:bg-gray-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-16">
        
       {/* INFO BANNER - FULL WIDTH */}
{showInfoBanner && (
  <div className="max-w-4xl mx-auto mb-8 animate-slide-down">
    <div className="relative group">
      {/* Background glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-30"></div>
      
      {/* Main banner card */}
      <div className={`relative rounded-2xl shadow-2xl overflow-hidden ${
        darkMode 
          ? 'bg-gray-800/95 backdrop-blur-xl border border-gray-700/50' 
          : 'bg-white/95 backdrop-blur-xl border border-white/20'
      }`}>
        
        {/* Gradient top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
        
        {/* Close button */}
        <button 
          onClick={() => setShowInfoBanner(false)}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            darkMode 
              ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-600 hover:text-white' 
              : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }`}
        >
          <X size={16} />
        </button>
        
        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-5">
            
            {/* Icon */}
            <div className="relative flex-shrink-0 mx-auto md:mx-0">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-md opacity-60"></div>
              <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl ${
                darkMode
                  ? 'bg-gray-900/80 border border-gray-700'
                  : 'bg-white/80 border border-white/50'
              }`}>
                <span className="filter drop-shadow-lg">️🚨</span>
              </div>
            </div>
            
            {/* Text content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                <h3 className={`font-bold text-xl md:text-2xl ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Informasi Penting
                </h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  darkMode 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-green-100 text-green-600 border border-green-200'
                }`}>
                  UPDATE
                </span>
              </div>
              
              <p className={`text-base md:text-lg leading-relaxed max-w-3xl ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                ✅ <span className="font-semibold text-green-600 dark:text-green-400">Mode SD (Standard) sudah work normal!</span> Jika mengalami kendala dengan video HD, silahkan gunakan mode SD terlebih dahulu.
              </p>
              
              <p className={`text-base md:text-lg leading-relaxed max-w-3xl mt-3 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">📏 Perhatikan size file:</span> Jika size kecil (~100-500KB) dan format MP4 tetapi hasilnya MP3, itu adalah bug dari API. Silahkan gunakan tombol download manual di pojok kanan bawah player.
              </p>
              
              <p className={`text-base md:text-lg leading-relaxed max-w-3xl mt-3 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className="font-semibold text-purple-600 dark:text-purple-400">🔄 Solusi sementara jika tetap ingin download video HD:</span> Klik ikon <span className="font-bold px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md mx-1">⋮</span> di pojok kanan bawah video, lalu pilih <span className="font-bold text-purple-600 dark:text-purple-400">Download</span>.
              </p>
              
              {/* Author signature */}
              <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  darkMode ? 'bg-purple-400' : 'bg-purple-500'
                }`}></div>
                <p className={`text-sm italic ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  ~ Team Lyora (terus berusaha memperbaiki)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
        
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
            <Sparkles size={16} />
            <span>#1 TikTok Downloader 2025 • 100% Gratis</span>
          </div>
          
          <h1 className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Download TikTok
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              Tanpa Watermark
            </span>
          </h1>
          
          <p className={`text-lg md:text-xl ${
            darkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Video HD, MP3, dan Slideshow • Gratis selamanya • Tanpa ribet
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-3xl mx-auto">
          <div className={`relative rounded-3xl shadow-2xl transition-colors ${
            darkMode ? 'bg-gray-800/90' : 'bg-white'
          }`}>
            
            {/* Decorative Elements */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-20"></div>
            
            <div className="relative p-8">
              
              {/* Input Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <label className={`block text-sm font-medium ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Masukkan Link TikTok
                  </label>
                  
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste a TikTok video URL here..."
                      className={`w-full px-6 py-4 pr-36 text-lg rounded-2xl border-2 transition-all outline-none ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-slate-400 focus:border-purple-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100'
                      }`}
                    />
                    
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      {url && (
                        <button
                          type="button"
                          onClick={clearInput}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'hover:bg-gray-600 text-slate-400' 
                              : 'hover:bg-slate-100 text-slate-500'
                          }`}
                        >
                          <X size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={pasteFromClipboard}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode 
                            ? 'hover:bg-gray-600 text-slate-400' 
                            : 'hover:bg-slate-100 text-slate-500'
                        }`}
                        title="Tempel link"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                          darkMode
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={18} />
                            <span>Process</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Advanced Options */}
              <div className="flex items-center justify-end mt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`text-sm flex items-center space-x-1 transition-colors ${
                    darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Advanced</span>
                  <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className={`mt-4 p-4 rounded-xl border animate-slide-down ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'
                }`}>
                  <label className={`block text-sm font-medium mb-3 ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Video Quality
                  </label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setQuality('sd')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        quality === 'sd'
                          ? darkMode
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                          : darkMode
                            ? 'bg-gray-600 text-slate-300 hover:bg-gray-500'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      Standard (SD)
                    </button>
                    <button
                      onClick={() => setQuality('hd')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        quality === 'hd'
                          ? darkMode
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                          : darkMode
                            ? 'bg-gray-600 text-slate-300 hover:bg-gray-500'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      High Quality (HD)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl animate-slide-down">
              <div className="flex items-center space-x-3">
                <div className="text-red-500">❌</div>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl animate-slide-down">
              <div className="flex items-center space-x-3">
                <div className="text-green-500">✅</div>
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            </div>
          )}

          {/* Video Result */}
          {videoData && (
            <div ref={resultRef} className="mt-8 animate-scale-in">
              <div className={`rounded-3xl overflow-hidden border transition-colors ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
              }`}>
                
                {/* Author Header */}
                <div className={`p-6 border-b ${
                  darkMode ? 'border-gray-700' : 'border-slate-100'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={videoData.author?.avatar || `https://ui-avatars.com/api/?name=${videoData.author?.nickname || 'User'}&background=8B5CF6&color=fff&bold=true`}
                        alt={videoData.author?.nickname}
                        className="w-14 h-14 rounded-2xl object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {videoData.author?.nickname || 'TikTok User'}
                      </h3>
                      <p className={`text-sm ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        @{videoData.author?.unique_id || 'username'} • {formatDate(videoData.create_time)}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(url)}
                      className={`p-2 rounded-xl transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-700 text-slate-400' 
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className={`grid grid-cols-4 gap-px ${
                  darkMode ? 'bg-gray-700' : 'bg-slate-200'
                }`}>
                  {[
                    { icon: Heart, label: 'Likes', value: videoData.digg_count, color: 'text-pink-500' },
                    { icon: MessageCircle, label: 'Comments', value: videoData.comment_count, color: 'text-blue-500' },
                    { icon: Share2, label: 'Shares', value: videoData.share_count, color: 'text-green-500' },
                    { icon: Eye, label: 'Views', value: videoData.play_count, color: 'text-purple-500' }
                  ].map((stat, i) => (
                    <div key={i} className={`p-4 text-center ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <stat.icon size={18} className={`mx-auto mb-1 ${stat.color}`} />
                      <div className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {formatNumber(stat.value)}
                      </div>
                      <div className={`text-xs ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Video Player */}
                <div className="relative bg-black aspect-video">
                  <video
                    src={videoData.play}
                    controls
                    className="w-full h-full object-contain"
                    poster={videoData.play}
                  />
                  
                  {/* Watermark Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg">
                    <span className="text-xs font-medium text-white">
                      {quality === 'hd' && videoData.hdplay ? 'HD Available' : 'SD'}
                    </span>
                  </div>
                </div>

                {/* Caption */}
                {videoData.title && (
                  <div className={`p-6 border-b ${
                    darkMode ? 'border-gray-700' : 'border-slate-100'
                  }`}>
                    <p className={`text-sm leading-relaxed ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {videoData.title}
                    </p>
                  </div>
                )}

                {/* Download Actions */}
                <div className="p-6 space-y-3">
                  <button
                    onClick={handleDownloadVideo}
                    disabled={downloadingVideo}
                    className={`w-full py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group ${
                      darkMode
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {downloadingVideo ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Video size={20} />
                    )}
                    <span>Download Video {quality === 'hd' ? 'HD' : 'SD'}</span>
                  </button>

                  {videoData.music && (
                    <button
                      onClick={handleDownloadMP3}
                      disabled={downloadingMp3}
                      className={`w-full py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group ${
                        darkMode
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {downloadingMp3 ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Music size={20} />
                      )}
                      <span>Download MP3</span>
                    </button>
                  )}

                  {/* SLIDE DOWNLOAD BUTTON */}
                  {videoData.images && videoData.images.length > 0 ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setTotalSlides(videoData.images.length);
                          setSlideSelection('all');
                          setShowSlideModal(true);
                        }}
                        disabled={downloadingSlide}
                        className={`w-full py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group ${
                          darkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {downloadingSlide ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Image size={20} />
                        )}
                        <span>Pilih Slide ({videoData.images.length} foto)</span>
                      </button>
                      
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        💡 Klik untuk memilih slide (contoh: 1,3,5 atau 1-5)
                      </p>
                    </div>
                  ) : (
                    <button
                      disabled
                      className={`w-full py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 opacity-50 cursor-not-allowed ${
                        darkMode
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Image size={20} />
                      <span>Slide Tidak Tersedia</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Modal untuk Pilih Slide - Glassmorphism ala iPhone */}
        {showSlideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
              onClick={() => setShowSlideModal(false)}
            ></div>
            
            <div className={`relative w-full max-w-md rounded-3xl shadow-2xl transform transition-all animate-scale-in
              ${darkMode 
                ? 'bg-gray-900/80 backdrop-blur-xl border border-white/10' 
                : 'bg-white/80 backdrop-blur-xl border border-white/20'
              }`}
              style={{
                boxShadow: darkMode 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'
              }}
            >
              {/* Header Modal - Glass */}
              <div className={`p-6 border-b ${
                darkMode ? 'border-white/10' : 'border-white/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center
                      ${darkMode 
                        ? 'bg-blue-500/20 border border-white/10' 
                        : 'bg-blue-500/10 border border-white/30'
                      }`}
                      style={{
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      <Image className="text-blue-500" size={24} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Pilih Slide
                      </h3>
                      <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Total {totalSlides} foto tersedia
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSlideModal(false)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${darkMode 
                        ? 'bg-white/10 text-gray-400 hover:bg-white/20' 
                        : 'bg-black/5 text-gray-500 hover:bg-black/10'
                      }`}
                    style={{ backdropFilter: 'blur(8px)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body Modal */}
              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Nomor Slide
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={slideSelection}
                      onChange={(e) => setSlideSelection(e.target.value)}
                      placeholder="Contoh: 1,3,5 atau 1-5 atau all"
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none
                        ${darkMode 
                          ? 'bg-white/10 border-white/10 text-white placeholder-gray-500 focus:border-blue-500/50' 
                          : 'bg-white/50 border-white/30 text-gray-900 placeholder-gray-400 focus:border-blue-500/50'
                        }`}
                      style={{
                        backdropFilter: 'blur(8px)',
                        boxShadow: darkMode 
                          ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
                          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset'
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick Options - Glass buttons */}
                <div>
                  <p className={`text-xs mb-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Pilihan cepat:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['all', '1-5', '1,3,5', '1-10'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSlideSelection(opt)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all
                          ${slideSelection === opt
                            ? 'bg-blue-500 text-white border border-white/20'
                            : darkMode
                              ? 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/5'
                              : 'bg-white/50 text-gray-600 hover:bg-white/70 border border-white/30'
                          }`}
                        style={{ backdropFilter: 'blur(8px)' }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Format - Glass card */}
                <div className={`p-4 rounded-xl ${
                  darkMode 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-white/30 border border-white/30'
                }`}
                style={{ backdropFilter: 'blur(8px)' }}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <span className="font-semibold">📋 Format:</span><br />
                    • <span className="font-mono">all</span> - Download semua slide<br />
                    • <span className="font-mono">1,3,5</span> - Slide 1, 3, dan 5<br />
                    • <span className="font-mono">1-5</span> - Slide 1 sampai 5<br />
                    • <span className="font-mono">1,3,5-7</span> - Kombinasi (1,3,5,6,7)
                  </p>
                </div>

                {/* Preview slide numbers */}
                <div className={`flex flex-wrap gap-1 p-2 rounded-xl ${
                  darkMode ? 'bg-white/5' : 'bg-white/30'
                }`}>
                  {Array.from({ length: Math.min(totalSlides, 10) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const current = slideSelection === 'all' ? '' : slideSelection;
                        const newSelection = current ? `${current},${i+1}` : `${i+1}`;
                        setSlideSelection(newSelection);
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        darkMode
                          ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                          : 'bg-white/50 text-gray-600 hover:bg-white/70'
                      }`}
                    >
                      {i+1}
                    </button>
                  ))}
                  {totalSlides > 10 && (
                    <span className={`text-xs px-2 flex items-center ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      +{totalSlides - 10}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer Modal - Glass */}
              <div className={`p-6 border-t flex gap-3 ${
                darkMode ? 'border-white/10' : 'border-white/30'
              }`}>
                <button
                  onClick={() => setShowSlideModal(false)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all
                    ${darkMode 
                      ? 'bg-white/10 text-white hover:bg-white/20 border border-white/5' 
                      : 'bg-black/5 text-gray-700 hover:bg-black/10 border border-white/30'
                    }`}
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowSlideModal(false);
                    if (videoData?.images) {
                      handleSlideDownload(slideSelection, videoData.images, videoData.author?.nickname);
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all relative overflow-hidden group
                    ${darkMode
                      ? 'bg-blue-500/80 text-white hover:bg-blue-500'
                      : 'bg-blue-500/80 text-white hover:bg-blue-500'
                    }`}
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <span className="relative z-10">Download</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div id="features" className="max-w-5xl mx-auto mt-20">
          <h2 className={`text-2xl font-bold text-center mb-12 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Kenapa Pilih Chisato?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Super Cepat',
                desc: 'Proses dalam hitungan detik, langsung download',
                color: 'purple'
              },
              {
                icon: Shield,
                title: '100% Aman',
                desc: 'Tanpa virus, tanpa iklan, tanpa ribet',
                color: 'pink'
              },
              {
                icon: Globe,
                title: 'Gratis Selamanya',
                desc: 'Download unlimited, tanpa biaya',
                color: 'orange'
              }
            ].map((feature, i) => (
              <div key={i} className={`group relative p-6 rounded-2xl transition-all hover:scale-105 ${
                darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
              }`}>
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-4`}>
                  <feature.icon className={`text-${feature.color}-500`} size={24} />
                </div>
                <h3 className={`font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How to Use */}
        <div id="howto" className="max-w-4xl mx-auto mt-20">
          <h2 className={`text-2xl font-bold text-center mb-12 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Cara Pakai (Gampang Banget!)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Copy Link', desc: 'Buka TikTok, copy link video' },
              { step: '2', title: 'Paste & Process', desc: 'Tempel link, klik tombol Process' },
              { step: '3', title: 'Download', desc: 'Pilih kualitas, klik Download' }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20`}></div>
                <div className={`relative p-6 rounded-2xl ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 font-bold text-purple-600 dark:text-purple-400">
                    {item.step}
                  </div>
                  <h3 className={`font-semibold mb-2 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="max-w-3xl mx-auto mt-20">
          <h2 className={`text-2xl font-bold text-center mb-12 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'Apakah ini gratis?',
                a: 'Ya, 100% gratis selamanya! Tidak ada biaya tersembunyi.'
              },
              {
                q: 'Bisa download video tanpa watermark?',
                a: 'Bisa! Semua video yang didownload tanpa watermark TikTok.'
              },
              {
                q: 'Bisa download di HP?',
                a: 'Bisa! Chisato bekerja di semua device: HP, tablet, laptop.'
              }
            ].map((faq, i) => (
              <div key={i} className={`p-6 rounded-2xl border transition-colors ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 hover:border-purple-600' 
                  : 'bg-white border-slate-200 hover:border-purple-300'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {faq.q}
                </h3>
                <p className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-20 border-t transition-colors ${
        darkMode ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white'
      }`}>
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center`}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className={`font-bold ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Chisato
                </span>
              </div>
              <p className={`text-sm mb-4 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Download TikTok video tanpa watermark dengan mudah dan cepat. Gratis selamanya!
              </p>
              <div className="flex space-x-4">
                <a href="/privacy.html" className={`text-sm hover:underline ${
                  darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}>
                  Privacy
                </a>
                <a href="/terms.html" className={`text-sm hover:underline ${
                  darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}>
                  Terms
                </a>
              </div>
            </div>
            
            <div>
              <h4 className={`font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Features
              </h4>
              <ul className="space-y-2">
                {['Video HD', 'MP3 Audio', 'Slide/Foto', 'No Watermark'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className={`text-sm transition-colors ${
                      darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className={`mt-12 pt-8 border-t text-center text-sm ${
            darkMode ? 'border-gray-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <p>© 2025 Chisato TikTok Downloader Easy And No ADS Love u all</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;