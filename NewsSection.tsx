import React, { useState, useEffect } from "react";
import { Newspaper, Calendar, ExternalLink } from "lucide-react";
import { NewsItem } from "../types";

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/news");
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch (error) {
        console.error("Failed to load RSS sport news in React component:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-[#111827] rounded-xl border border-[#1f293d] p-6 text-center shadow-lg my-6">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <Newspaper className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-sm text-gray-400 font-extrabold">جاري جلب أحدث الأخبار الرياضية العربية...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="my-8">
      {/* Sector Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-emerald-950/20 rounded-xl border border-[#10b981]/20">
          <Newspaper className="w-5 h-5 text-[#10b981]" />
        </div>
        <div className="flex flex-col text-right">
          <h3 className="text-lg font-black text-white">جريدة مراسل المونديال والأخبار الرياضية</h3>
          <p className="text-xs text-gray-400 font-bold">آخر مستجدات الملاعب والمنتخبات العربية والعالمية</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item, idx) => (
          <div
            key={idx}
            className="group bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:border-emerald-500/30 transition-all flex flex-col justify-between"
          >
            {/* Image */}
            <div className="h-44 overflow-hidden relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 bg-[#10b981] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                أحدث خبر
              </div>
            </div>

            {/* Content info */}
            <div className="p-4 flex flex-col gap-2.5 text-right flex-grow">
              {/* Date */}
              <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>{item.pubDate}</span>
              </div>

              {/* Title */}
              <h4 className="font-bold text-sm text-gray-100 group-hover:text-[#10b981] transition-colors leading-relaxed line-clamp-2">
                {item.title}
              </h4>

              {/* Description */}
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                {item.description}
              </p>
            </div>

            {/* Link Footer */}
            <div className="p-4 border-t border-[#1f293d]/65 bg-[#0a0e1a]/50 flex items-center justify-end">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-300 group-hover:text-[#10b981] font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>اقرأ التغطية الكاملة</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
