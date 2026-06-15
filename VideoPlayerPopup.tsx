import React, { useEffect, useRef, useState } from "react";
import { X, Play, ShieldAlert, Monitor, Volume2, Info, ListFilter } from "lucide-react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Channel } from "../types";

interface VideoPlayerPopupProps {
  onClose: () => void;
  initialChannelName?: string; // e.g. 'beIN Sports HD 1' or 'SSC'
  onAddStreamPoints?: () => void; // Call whenever stream loads successfully (rewards 5 points)
}

export default function VideoPlayerPopup({
  onClose,
  initialChannelName = "",
  onAddStreamPoints,
}: VideoPlayerPopupProps) {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("HD");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const videoNode = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any | null>(null);

  // Load all playlist channels from proxy API
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/iptv/channels");
        if (res.ok) {
          const channelsList: Channel[] = await res.json();
          setAllChannels(channelsList);

          // Find optimal initial channel based on match preference
          let initial: Channel | null = null;
          if (initialChannelName) {
            // Find channel that matches name/tvgName or contains it
            const queryClean = initialChannelName.toLowerCase().replace(/sports|hd/gi, "").trim();
            initial = channelsList.find(
              (c) =>
                c.name.toLowerCase().includes(queryClean) ||
                c.tvgName.toLowerCase().includes(queryClean)
            ) || null;
          }
          
          if (!initial && channelsList.length > 0) {
            initial = channelsList[0];
          }

          setSelectedChannel(initial);
        }
      } catch (error) {
        console.error("Failed to load IPTV playlist in Popup:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [initialChannelName]);

  // Filter channels based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChannels(allChannels.slice(0, 500)); // Show up to 500 channels for rapid scrolling access
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = allChannels.filter(
        (c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
      );
      setFilteredChannels(filtered.slice(0, 500)); // Show up to 500 matching channels
    }
  }, [allChannels, searchQuery]);

  // Initialize and update Video.js player
  useEffect(() => {
    if (!selectedChannel || !videoNode.current) return;

    // Destroy existing player if any
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    // Reward points for watching match (5 points)
    if (!rewardClaimed && onAddStreamPoints) {
      onAddStreamPoints();
      setRewardClaimed(true);
    }

    // Construct quality-modified stream URL if possible, or use standard URL from stream playlist
    // Custom template URLs from server: http://maventv.one:80/live/nagy4158/elsafti8596/{stream_id}.m3u8
    // Note: Free qualities mock switching is done by simulating FHD/4K configurations or playing
    // the stable playlist source URL seamlessly.
    const streamUrl = selectedChannel.url;

    // videojs options
    const options = {
      autoplay: true,
      controls: true,
      fluid: true,
      preload: "auto",
      responsive: true,
      sources: [
        {
          src: streamUrl,
          type: "application/x-mpegURL", // HLS type
        },
      ],
    };

    // Instantiate Video.js
    const player = videojs(videoNode.current, options, () => {
      console.log("VideoJS Player Ready!");
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [selectedChannel, selectedQuality, rewardClaimed, onAddStreamPoints]);

  const qualitiesList = ["SD", "HD", "FHD", "4K"];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col md:flex-row items-stretch justify-center p-0 md:p-4 animate-fadeIn">
      {/* Right Column: Channels directory selection */}
      <div className="w-full md:w-80 bg-[#111827] border-b md:border-b-0 md:border-l border-[#1f293b] flex flex-col justify-between p-4 flex-shrink-0">
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          {/* Logo & Close button on small screens */}
          <div className="flex items-center justify-between md:mb-2">
            <h3 className="font-extrabold text-white text-base">دليل قنوات GAOLWIN</h3>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search channel */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن قناة (مثال: beIN, SSC)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-[#1f293d] focus:border-[#10b981] focus:outline-none rounded-lg px-3 py-2 text-xs text-white text-right placeholder-gray-500"
            />
          </div>

          {/* Channels list */}
          <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-1 text-right max-h-[30vh] md:max-h-none">
            {loading ? (
              <div className="text-center py-6 text-xs text-gray-400">جاري تحميل دليل القنوات المشفرة...</div>
            ) : filteredChannels.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">لا توجد قنوات مناسبة للبحث</div>
            ) : (
              filteredChannels.map((c) => {
                const isSelected = selectedChannel?.streamId === c.streamId;
                return (
                  <button
                    key={c.streamId}
                    onClick={() => setSelectedChannel(c)}
                    className={`w-full text-right p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-[#10b981]/10 border-[#10b981] text-white"
                        : "bg-[#0a0e1a]/40 border-[#1f293d]/60 text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-[10px] text-gray-500 font-mono px-1.5 py-0.5 bg-gray-800/60 rounded">
                      {c.group.substring(0, 10)}
                    </span>
                    <span className="truncate max-w-[150px]">{c.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Extra credit info on sidebar */}
        <div className="mt-4 pt-3 border-t border-[#1f293b] hidden md:flex flex-col gap-2 text-right text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5 text-yellow-500/80 font-bold">
            <Info className="w-3.5 h-3.5" />
            <span>كسبت 5 نقاط لمشاهدتك البث!</span>
          </div>
          <p>البث متوافق مع كافة سرعات الإنتيرنت. سيقوم المشغل بالتبديل التلقائي تبعاً لجودتك.</p>
        </div>
      </div>

      {/* Left Column: Video player center screen */}
      <div className="flex-grow flex flex-col justify-between p-4 md:p-6 relative">
        {/* Header Options */}
        <div className="flex items-center justify-between border-b border-[#1f293b] pb-3 mb-4">
          <div className="hidden md:block">
            <button
              onClick={onClose}
              className="p-2 bg-[#111827] text-gray-400 hover:text-white border border-[#1f293d] hover:border-[#10b981] rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs"
            >
              <span>إغلاق المشغل</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connected Stream Info / Quality Selection */}
          <div className="flex items-center gap-3 ml-auto md:ml-0" dir="ltr">
            {/* Qualities Pills */}
            <div className="flex items-center bg-[#111827] p-1 rounded-lg border border-[#1f293d]">
              {qualitiesList.map((q) => {
                const isQ = selectedQuality === q;
                return (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={`px-3 py-1 rounded text-xs font-black transition-all ${
                      isQ
                        ? "bg-[#10b981] text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col text-right">
            <div className="flex items-center gap-2 justify-end mb-0.5">
              <span className="text-xs text-[#10b981] font-bold bg-[#10b981]/10 px-2.5 py-0.5 rounded-full">
                🔴 بث حي ومباشر
              </span>
              <h4 className="font-extrabold text-white text-base">
                {selectedChannel ? selectedChannel.name : "جاري تجهيز البث الحي"}
              </h4>
            </div>
            <p className="text-xs text-gray-400 font-bold">
              مخدم بث حي ممتاز • جودة تلقائية عالية الاستقرار
            </p>
          </div>
        </div>

        {/* Streaming Video Block */}
        <div className="flex-grow flex items-center justify-center bg-black rounded-2xl overflow-hidden border border-[#1f293b] shadow-2xl relative group">
          {selectedChannel ? (
            <div data-vjs-player className="w-full h-full relative" id="video-js-container">
              <video
                ref={videoNode}
                className="video-js vjs-default-skin vjs-big-play-centered w-full h-full"
                playsInline
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-[#10b981] flex items-center justify-center animate-bounce">
                <Play className="w-5 h-5 text-[#10b981]" />
              </div>
              <h5 className="font-bold text-gray-200 text-sm">بانتظار تحديد القناة الرياضية الموفرة</h5>
              <p className="text-xs text-gray-500 max-w-sm">
                اختر القناة المفضلة لديك من الدليل المتوفر على اليمين لتشغيل البث في التو واللحظة.
              </p>
            </div>
          )}
        </div>

        {selectedChannel && (
          <div className="mt-3 bg-gradient-to-r from-emerald-950/40 to-blue-950/40 border border-[#10b981]/40 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-right">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-white">🔄 هل البث متوقف أو لا يظهر بسبب حظر المتصفح للمحتوى المشفر (Mixed Content)؟</span>
              <p className="text-[11px] text-gray-300 font-bold">
                تبث محطات IPTV ببروتوكول HTTP غير المشفر. لتخطي قيود حماية المتصفح، يمكنك تشغيل القناة الحالية مباشرة في علامة تبويب جديدة أو على مشغلات الفيديو الخارجية مثل VLC/MX Player بنقرة واحدة فائقة السرعة!
              </p>
            </div>
            <a
              href={selectedChannel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-[#10b981] hover:bg-emerald-600 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center gap-2 shadow shadow-emerald-500/20 whitespace-nowrap"
            >
              <span>تشغيل البث المباشر الخارجي ↗</span>
            </a>
          </div>
        )}

        {/* Security Warning / Disclaimers block below stream */}
        <div className="mt-4 bg-[#111827] border border-[#1f293b] rounded-xl p-3 flex flex-col md:flex-row items-center gap-3 justify-between text-right">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <span className="text-xs text-gray-400 font-bold leading-normal">
              تنبيه: لتجنب تعليق البث أثناء مباراة كأس العالم، تأكد من استقرار اتصالك أو تفضل بفتح المشغل بمتصفح حديث.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
