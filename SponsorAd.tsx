import React from "react";

interface SponsorAdProps {
  id: "ad-header" | "ad-sidebar" | "ad-between" | "ad-footer";
}

export default function SponsorAd({ id }: SponsorAdProps) {
  // Return tailored beautiful sport sponsor ads
  if (id === "ad-header") {
    return (
      <div
        id="ad-header"
        className="w-full h-[90px] md:max-w-[728px] mx-auto bg-gradient-to-r from-[#111827] via-[#10b981]/10 to-[#111827] border border-[#1f293d] rounded-xl overflow-hidden flex items-center justify-between px-6 py-2 shadow-lg mb-6 relative group cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-2 h-full bg-[#10b981]" />
        <div className="flex flex-col text-right">
          <span className="text-[10px] text-gray-500 tracking-wider">إعلان راعي</span>
          <span className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">
            طيران الرياض - شريك المونديال الرسمي
          </span>
          <span className="text-xs text-gray-400">سافر بشغف وتواصل معنا لحضور النهائي التاريخي</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-l from-[#10b981] to-emerald-800 text-xs font-bold text-white rounded-lg shadow-inner group-hover:scale-105 transition-transform">
            احجز الآن
          </div>
          <span className="text-2xl font-black text-[#10b981]/30 select-none font-mono">RIYADH AIR</span>
        </div>
      </div>
    );
  }

  if (id === "ad-sidebar") {
    return (
      <div
        id="ad-sidebar"
        className="w-full h-[250px] bg-gradient-to-b from-[#111827] to-[#0a0e1a] border border-[#1f293d] rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group cursor-pointer text-right"
      >
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-[#10b981] to-transparent" />
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 tracking-wider uppercase">إعلان ومسابقات</span>
          <span className="text-xs text-yellow-500 font-extrabold bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">خصم %30</span>
        </div>

        <div className="my-auto flex flex-col gap-1.5">
          <h4 className="font-extrabold text-white text-base group-hover:text-emerald-400 transition-colors leading-snug">
            أديداس المونديال 2026
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            الكرة الرسمية لكأس العالم والملابس الرياضية لجميع المنتخبات متوفرة الآن في المتجر الإلكتروني.
          </p>
        </div>

        <div className="flex justify-between items-center mt-2 border-t border-[#1f293d] pt-3">
          <span className="text-xs text-gray-400 font-bold">المتجر الرسمي</span>
          <button className="px-3.5 py-1.5 bg-[#1f293d] hover:bg-[#10b981] text-white text-xs font-extrabold rounded-lg transition-all shadow-md">
            تسوق اليوم
          </button>
        </div>
      </div>
    );
  }

  if (id === "ad-between") {
    return (
      <div
        id="ad-between"
        className="w-full h-[150px] md:h-[120px] bg-gradient-to-r from-[#111827] via-[#10b981]/5 to-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md relative overflow-hidden group cursor-pointer text-right mb-4"
      >
        <div className="absolute top-0 right-0 bg-[#10b981] text-[8px] text-white font-bold px-2 py-0.5 rounded-bl">إعلان</div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#10b981] to-emerald-950 flex items-center justify-center text-white text-xl font-black shadow shadow-emerald-500/20">
            EA
          </div>
          <div>
            <h5 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
              لعبة FIFA World Cup 2026
            </h5>
            <p className="text-xs text-gray-400 max-w-[450px]">
              عش متعة التحدي والمنافسة محاكاة واقعية للمونديال مع أقوى المنتخبات العربية والعالمية. متوفرة للاستحواذ الآن.
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-[#10b981] hover:bg-emerald-600 text-white text-xs font-bold rounded-lg whitespace-nowrap transition-all shadow-lg active:translate-y-0.5">
          ابدأ اللعب ومميزات حصرية
        </button>
      </div>
    );
  }

  // Footer Ad
  return (
    <div
      id="ad-footer"
      className="w-full bg-gradient-to-r from-[#090d16] via-[#111827] to-[#090d16] border-t border-b border-[#1f293d] py-4 shadow-inner relative overflow-hidden text-center cursor-pointer group"
    >
      <div className="text-[9px] text-gray-600 mb-1">إعلانات الشركاء</div>
      <p className="text-xs text-gray-400 font-medium group-hover:text-white transition-colors">
        برعاية <span className="font-bold text-yellow-500">شحن رصيد بين سبورت وتجديد الاشتراكات</span> بأسعار تفضيلية مع الكود ومكافآت مجانية.
      </p>
    </div>
  );
}
