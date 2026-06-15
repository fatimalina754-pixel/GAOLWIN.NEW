import React, { useState } from "react";
import { UserProfile, Match, Prediction } from "../types";
import { Trophy, HelpCircle, CheckCircle2, XCircle, Clock, ChevronRight, Sparkles, Zap, Award } from "lucide-react";

interface PredictionCenterProps {
  user: UserProfile | null;
  worldCupMatches: Match[];
  predictions: Prediction[];
  onPredictSubmit: (matchId: string, payload: {
    predicted_winner: string;
    home_score: number;
    away_score: number;
    predicted_scorer: string;
  }) => Promise<void>;
  openAuthModal: () => void;
}

export default function PredictionCenter({
  user,
  worldCupMatches,
  predictions,
  onPredictSubmit,
  openAuthModal,
}: PredictionCenterProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Local state for the inputs per match
  const [inputs, setInputs] = useState<Record<string, {
    home_score: string;
    away_score: string;
    predicted_scorer: string;
    predicted_winner: string;
  }>>({});

  const handleInputChange = (matchId: string, field: string, value: string) => {
    setInputs((prev) => {
      const current = prev[matchId] || { home_score: "0", away_score: "0", predicted_scorer: "", predicted_winner: "draw" };
      const updated = { ...current, [field]: value };
      
      // Auto-set predicted winner based on score inputs if they are numbers
      if (field === "home_score" || field === "away_score") {
        const homeVal = parseInt(field === "home_score" ? value : updated.home_score) || 0;
        const awayVal = parseInt(field === "away_score" ? value : updated.away_score) || 0;
        if (homeVal > awayVal) {
          updated.predicted_winner = "home";
        } else if (awayVal > homeVal) {
          updated.predicted_winner = "away";
        } else {
          updated.predicted_winner = "draw";
        }
      }

      return { ...prev, [matchId]: updated };
    });
  };

  const handleSubmit = async (matchId: string, matchTimeStr: string, matchDateStr: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      setSubmittingId(matchId);
      const matchInput = inputs[matchId] || { home_score: "0", away_score: "0", predicted_scorer: "", predicted_winner: "draw" };
      
      await onPredictSubmit(matchId, {
        predicted_winner: matchInput.predicted_winner,
        home_score: parseInt(matchInput.home_score) || 0,
        away_score: parseInt(matchInput.away_score) || 0,
        predicted_scorer: matchInput.predicted_scorer || "غير محدد",
      });
    } catch (err: any) {
      console.error("Prediction submission error:", err);
    } finally {
      setSubmittingId(null);
    }
  };

  // Helper: check if prediction list closes (closes 5 minutes before match starts)
  const isPredictionClosed = (matchDate: string, matchTime: string) => {
    try {
      // Parse match scheduled time "17:00" and date "2026-06-15"
      const matchDateTime = new Date(`${matchDate}T${matchTime.length === 5 ? matchTime : "18:00"}:00`);
      const now = new Date();
      // Difference in ms
      const diffMs = matchDateTime.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);
      
      return diffMins <= 5;
    } catch (_) {
      return false;
    }
  };

  // Calcul statistics of streak
  const getPredictionStreak = () => {
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Predictions from newest to oldest or vice-versa
    const sorted = [...predictions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const pred of sorted) {
      if (pred.is_correct) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else if (pred.is_correct === false) {
        currentStreak = 0;
      }
    }
    return { currentStreak, maxStreak };
  };

  const { currentStreak, maxStreak } = getPredictionStreak();

  return (
    <div className="flex flex-col gap-8">
      {/* Upper Area: Rules and Point System */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak & User Stats card */}
        <div className="bg-[#111827] border border-[#1f293b] rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden text-right lg:col-span-1">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-[#10b981] to-yellow-500" />
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-[#10b981] font-extrabold bg-[#10b981]/10 px-2.5 py-0.5 rounded-full">إحصائياتك</span>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>

            <h4 className="text-sm font-black text-gray-200 mb-4 border-b border-[#1f293b]/60 pb-2 font-sans">توقعاتك للمونديال</h4>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-yellow-500 font-extrabold text-sm">{predictions.length} / 50</span>
                <span className="text-gray-400">إجمالي التوقعات:</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-400 font-extrabold text-sm">
                  {predictions.filter(p => p.is_correct).length}
                </span>
                <span className="text-gray-400">التوقعات الصحيحة:</span>
              </div>
              <div className="flex justify-between items-center text-xs text-yellow-500 font-black">
                <span className="text-sm">{currentStreak} مباريات</span>
                <span className="text-gray-300">السلسلة الحالية (Streak):</span>
              </div>
              <div className="flex justify-between items-center text-xs text-orange-400 font-bold">
                <span className="text-sm">{maxStreak} مباريات</span>
                <span className="text-gray-400">أعلى سلسلة متتالية:</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1f293b]/60 text-[11px] text-gray-500">
            {predictions.length >= 50 ? (
              <span className="text-emerald-400 font-bold">✓ حققت الحد الأدنى (50 توقعاً) للسحب!</span>
            ) : (
              <span>يتبقى لك {50 - predictions.length} توقعاً لفتح إمكانية السحب بعد المونديال.</span>
            )}
          </div>
        </div>

        {/* Scoring Table card */}
        <div className="bg-[#111827] border border-[#1f293b] rounded-xl p-5 flex flex-col justify-between shadow-lg text-right lg:col-span-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <h4 className="text-sm font-black text-white">جدول احتساب النقاط ومكافآت السلسلة الرياضية</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Point allocation */}
              <div className="bg-[#0a0e1a]/60 rounded-lg p-3 border border-[#1f293b]">
                <span className="text-xs text-gray-400 block mb-2 border-b border-gray-800 pb-1 font-bold">النقاط العادية</span>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#10b981] font-bold">10 نقاط</span>
                    <span className="text-gray-300">توقع الفائز الصحيح (W/D/W)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#10b981] font-bold">50 نقطة</span>
                    <span className="text-gray-300">توقع النتيجة الدقيقة للمباراة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#10b981] font-bold">25 نقطة</span>
                    <span className="text-gray-300">توقع مسجل الأهداف الرئيسي</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-400 font-bold">5 نقاط</span>
                    <span className="text-gray-300">زيارة ومشاهدة البث المباشر</span>
                  </div>
                </div>
              </div>

              {/* Bonus streak */}
              <div className="bg-[#0a0e1a]/60 rounded-lg p-3 border border-[#1f293b]">
                <span className="text-xs text-yellow-500 block mb-2 border-b border-gray-800 pb-1 font-bold">مكافآت المتتاليات (Streak Bonuses)</span>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-yellow-500 font-bold">75 نقطة بونص</span>
                    <span className="text-gray-300">5 توقعات صحيحة متتالية</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-500 font-bold">150 نقطة بونص</span>
                    <span className="text-gray-300">10 توقعات صحيحة متتالية</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-400 font-extrabold">الجائزة الكبرى $10</span>
                    <span className="text-gray-300">البطل الأول في المتصدرين</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-yellow-500/80 text-xs font-bold bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/20">
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            <span>نصيحة: تغلق التوقعات تماماً قبل 5 دقائق من صافرة الانطلاق الرسمية لكل مباراة!</span>
          </div>
        </div>
      </div>

      {/* Real matches listing for active predictions */}
      <div className="flex flex-col gap-5">
        <h3 className="text-md font-bold text-gray-200 text-right border-r-4 border-[#10b981] pr-2.5">المباريات الحقيقية المتاحة للتوقع والمسابقة</h3>

        {worldCupMatches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد مباريات حقيقية مجدولة لهذا التاريخ حالياً.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {worldCupMatches.map((m) => {
              const closed = isPredictionClosed(m.date, m.time);
              const alreadyPredicted = predictions.find((p) => p.match_id === m.id);
              
              // Local inputs reference for this match id
              const tempInput = inputs[m.id] || { home_score: "0", away_score: "0", predicted_scorer: "", predicted_winner: "draw" };

              return (
                <div
                  key={m.id}
                  className="bg-[#111827] border border-[#1f293b] rounded-xl p-5 flex flex-col justify-between shadow-md relative"
                >
                  {closed && (
                    <div className="absolute top-2 left-2 bg-emerald-950/80 border border-[#10b981]/40 text-[#10b981] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      مغلق التوقع
                    </div>
                  )}

                  {!closed && alreadyPredicted && (
                    <div className="absolute top-2 left-2 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      تم التوقع بنجاح
                    </div>
                  )}

                  {/* Header info */}
                  <div className="flex justify-between items-center text-xs text-gray-400 pb-2 border-b border-[#1f293b] mb-4">
                    <span className="font-mono text-gray-500">{m.date} - {m.time}</span>
                    <span className="text-xs text-[#10b981] font-bold">{m.league}</span>
                  </div>

                  {/* Core Match Row visual */}
                  <div className="flex items-center justify-between gap-6 py-2">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-1.5 w-1/3 text-center">
                      <img
                        src={m.homeLogo}
                        alt={m.homeTeam}
                        className="w-10 h-10 object-contain drop-shadow"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs font-bold text-gray-100">{m.homeTeam}</span>
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center">
                      <span className="text-gray-500 font-black text-sm">VS</span>
                      <span className="text-[10px] text-gray-400 mt-1">كأس العالم</span>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-1.5 w-1/3 text-center">
                      <img
                        src={m.awayLogo}
                        alt={m.awayTeam}
                        className="w-10 h-10 object-contain drop-shadow"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs font-bold text-gray-100">{m.awayTeam}</span>
                    </div>
                  </div>

                  {/* Predictions Form inputs */}
                  <div className="mt-4 pt-4 border-t border-[#1f293b]/60 text-right">
                    {alreadyPredicted ? (
                      <div className="bg-[#0a0e1a]/80 p-3 rounded-lg border border-emerald-800/30 text-xs text-gray-300">
                        <div className="flex justify-between mb-1.5">
                          <span className="font-bold text-emerald-400">
                            {alreadyPredicted.home_score} - {alreadyPredicted.away_score}
                          </span>
                          <span className="text-gray-400">توقعك للنتيجة:</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-yellow-500">{alreadyPredicted.predicted_scorer}</span>
                          <span className="text-gray-400">الهداف المتوقع:</span>
                        </div>
                      </div>
                    ) : closed ? (
                      <div className="text-center py-2.5 bg-emerald-950/20 text-[#10b981] text-xs rounded-lg font-bold">
                        توقفت عمليات التوقع قبل 5 دقائق من انطلاق اللقاء. حظاً أوفق في اللقاءات القادمة!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {/* Score Inputs row */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">نتيجة {m.awayTeam}</span>
                            <input
                              type="number"
                              min="0"
                              value={tempInput.away_score}
                              onChange={(e) => handleInputChange(m.id, "away_score", e.target.value)}
                              className="w-12 bg-[#0a0e1a] border border-[#1f293b] focus:border-[#10b981] rounded-md py-1 px-1.5 text-center text-xs font-bold text-white focus:outline-none"
                            />
                          </div>

                          <div className="border border-gray-700/60 p-1.5 rounded-md bg-[#0a0e1a] text-[10px] text-gray-400">
                            {tempInput.predicted_winner === "home" ? `فوز ${m.homeTeam}` : tempInput.predicted_winner === "away" ? `فوز ${m.awayTeam}` : "تعادل"}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={tempInput.home_score}
                              onChange={(e) => handleInputChange(m.id, "home_score", e.target.value)}
                              className="w-12 bg-[#0a0e1a] border border-[#1f293b] focus:border-[#10b981] rounded-md py-1 px-1.5 text-center text-xs font-bold text-white focus:outline-none"
                            />
                            <span className="text-[10px] text-gray-400">نتيجة {m.homeTeam}</span>
                          </div>
                        </div>

                        {/* Top Scorer text field */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="اسم اللاعب المتوقع أن يحرز الأهداف (مثال: الدوسري، ميسي)"
                            value={tempInput.predicted_scorer}
                            onChange={(e) => handleInputChange(m.id, "predicted_scorer", e.target.value)}
                            className="flex-grow bg-[#0a0e1a] border border-[#1f293b] focus:border-[#10b981] rounded-md py-1.5 px-3 text-xs text-white placeholder-gray-600 focus:outline-none text-right"
                          />
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">اسم الهداف:</span>
                        </div>

                        {/* Action submission button */}
                        <button
                          onClick={() => handleSubmit(m.id, m.time, m.date)}
                          disabled={submittingId === m.id}
                          className="w-full mt-1.5 bg-[#10b981] hover:bg-emerald-600 text-xs text-white font-black py-2 rounded-lg transition-all shadow-md hover:scale-[1.01] active:translate-y-0.5 text-center"
                        >
                          {submittingId === m.id ? "جاري الحفظ والتسجيل..." : user ? "سجل توقعك الآن وكسب النقاط" : "سجل الدخول للتوقع"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historic predictions list */}
      <div className="flex flex-col gap-4">
        <h3 className="text-md font-bold text-gray-200 text-right border-r-4 border-yellow-500 pr-2.5">سجل توقعاتك والنتائج</h3>
        
        {predictions.length === 0 ? (
          <div className="bg-[#111827] border border-[#1f293b] rounded-xl p-6 text-center text-xs text-gray-500">
            لم تقم بتسجيل أي توقعات حتى الآن. توقع مباريات كأس العالم بالأعلى واكسب جوائز مادية ونقاط المتصدرين!
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1f293b] rounded-xl overflow-hidden shadow-lg text-right">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0a0e1a] text-gray-400 border-b border-[#1f293b]">
                  <tr>
                    <th className="p-3.5">تاريخ التوقع</th>
                    <th className="p-3.5">المباراة</th>
                    <th className="p-3.5">النتيجة المتوقعة</th>
                    <th className="p-3.5">أول مسجل متوقع</th>
                    <th className="p-3.5">حالة التوقع</th>
                    <th className="p-3.5">النقاط المكتسبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293b]/60">
                  {predictions.map((p) => {
                    // Try to find matching match badge
                    const matchObj = worldCupMatches.find((m) => m.id === p.match_id);
                    const matchLabel = matchObj ? `${matchObj.homeTeam} x ${matchObj.awayTeam}` : "مباراة كأس العالم";
                    
                    return (
                      <tr key={p.id} className="hover:bg-gray-800/10 transition-colors">
                        <td className="p-3.5 font-mono text-gray-500">
                          {new Date(p.created_at).toLocaleDateString("ar-SA")}
                        </td>
                        <td className="p-3.5 font-bold text-gray-200">{matchLabel}</td>
                        <td className="p-3.5 font-mono text-yellow-500 font-bold">
                          {p.home_score} - {p.away_score} ({p.predicted_winner === "home" ? "Home" : p.predicted_winner === "away" ? "Away" : "Draw"})
                        </td>
                        <td className="p-3.5 font-bold text-gray-300">{p.predicted_scorer}</td>
                        <td className="p-3.5">
                          {p.is_correct === true ? (
                            <span className="text-[#10b981] bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-800 font-bold flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3.5 h-3.5" /> صحيح
                            </span>
                          ) : p.is_correct === false ? (
                            <span className="text-gray-400 bg-[#0a0e1a]/80 px-2 py-0.5 rounded border border-gray-800 font-bold flex items-center gap-1 w-max">
                              <XCircle className="w-3.5 h-3.5 text-gray-500" /> غير دقيق
                            </span>
                          ) : (
                            <span className="text-gray-400 bg-[#0a0e1a] px-2 py-0.5 rounded border border-gray-800 font-bold flex items-center gap-1 w-max">
                              <Clock className="w-3.5 h-3.5" /> بانتظار الإشارة
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-black text-emerald-400">+{p.points_earned || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
