import React from "react";
import { LeaderboardUser } from "../types";
import { Trophy, Star, Zap, Medal } from "lucide-react";

interface LeaderboardProps {
  currentUsername?: string;
  currentUserPoints?: number;
  users: LeaderboardUser[];
  loading: boolean;
}

export default function Leaderboard({ currentUsername, currentUserPoints = 0, users, loading }: LeaderboardProps) {
  // Map database users to ensure structural integrity
  const dbUsers = [...users];

  // If the current user is logged in, ensure they are in the database list
  if (currentUsername) {
    const hasMe = dbUsers.some(
      (u) => u.username.toLowerCase() === currentUsername.toLowerCase()
    );
    if (!hasMe) {
      dbUsers.push({
        username: currentUsername,
        points: currentUserPoints,
        correct_count: Math.floor(currentUserPoints / 10),
      });
    } else {
      // Keep points fully synchronized
      const idx = dbUsers.findIndex(u => u.username.toLowerCase() === currentUsername.toLowerCase());
      if (idx !== -1) {
        dbUsers[idx].points = currentUserPoints;
        dbUsers[idx].correct_count = Math.floor(currentUserPoints / 10);
      }
    }
  }

  // Sort strictly by points descending
  const sortedAndRanked = [...dbUsers]
    .sort((a, b) => b.points - a.points)
    .map((usr, index) => ({
      ...usr,
      rank: index + 1,
    }));

  if (loading) {
    return (
      <div className="w-full bg-[#111827] border border-[#1f293b] rounded-xl p-8 text-center shadow-lg">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500 animate-spin" />
          <span className="text-sm text-gray-300 font-bold">جاري تحديث لوحة المتصدرين الفورية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-[#1f293b] rounded-xl overflow-hidden shadow-xl text-right">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-[#10b981] to-emerald-950 p-6 flex items-center justify-between">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">لوحة قادة المونديال المتصدرين</h3>
          <p className="text-xs text-white/80 font-bold mt-1">توقع بدقة وتنافس للظفر بالجائزة الكبرى بقيمة $10</p>
        </div>
      </div>

      {sortedAndRanked.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center gap-3">
          <Star className="w-8 h-8 text-[#10b981] animate-pulse" />
          <p className="text-xs text-gray-300 font-bold">لوحة المتصدرين فارغة حالياً.</p>
          <p className="text-[10px] text-gray-400">سجل حسابك اليوم وتوقع المباريات لتكون أول من يظهر ويتصدر الترتيب الحقيقي للجميع!</p>
        </div>
      ) : (
        <>
          {/* Podium Top 3 Grid view */}
          <div className="p-6 border-b border-[#1f293b]/60 bg-[#0a0e1a]/30 grid grid-cols-3 gap-4 items-end">
            {/* Rank 2 */}
            {sortedAndRanked[1] && (
              <div className="flex flex-col items-center text-center p-3.5 bg-[#111827] border border-[#1f293b] rounded-xl relative order-1">
                <Medal className="w-8 h-8 text-slate-300 drop-shadow mb-1" />
                <span className="text-[10px] text-gray-400 font-bold truncate max-w-full">
                  {sortedAndRanked[1].username}
                </span>
                <span className="text-xs font-black text-white mt-1">{sortedAndRanked[1].points} ن</span>
                <div className="w-7 h-7 rounded-full bg-slate-300/10 text-slate-300 text-xs font-bold flex items-center justify-center mt-2 border border-slate-300/20">
                  2nd
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {sortedAndRanked[0] && (
              <div className="flex flex-col items-center text-center p-5 bg-gradient-to-b from-[#10b981]/10 to-[#111827] border border-[#10b981] rounded-xl relative order-2 scale-105 z-10 shadow-lg shadow-[#10b981]/5">
                <div className="absolute -top-3.5 right-1/2 translate-x-1/2 p-1 bg-[#10b981] text-white rounded-full">
                  <Trophy className="w-4 h-4 text-yellow-300" />
                </div>
                <Trophy className="w-10 h-10 text-yellow-500 drop-shadow-lg mb-2" />
                <span className="text-xs font-black text-white truncate max-w-full">
                  {sortedAndRanked[0].username}
                </span>
                <span className="text-sm font-black text-[#10b981] mt-1">{sortedAndRanked[0].points} نقطة</span>
                <div className="w-10 h-6 bg-[#10b981]/20 text-[#10b981] text-[10px] font-black rounded-full flex items-center justify-center mt-2 border border-[#10b981]/40">
                  البطل
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {sortedAndRanked[2] && (
              <div className="flex flex-col items-center text-center p-3.5 bg-[#111827] border border-[#1f293b] rounded-xl relative order-3">
                <Medal className="w-8 h-8 text-amber-600 drop-shadow mb-1" />
                <span className="text-[10px] text-gray-400 font-bold truncate max-w-full">
                  {sortedAndRanked[2].username}
                </span>
                <span className="text-xs font-black text-white mt-1">{sortedAndRanked[2].points} ن</span>
                <div className="w-7 h-7 rounded-full bg-amber-600/10 text-amber-600 text-xs font-bold flex items-center justify-center mt-2 border border-amber-600/20">
                  3rd
                </div>
              </div>
            )}
          </div>

          {/* Main Table list */}
          <div className="p-4">
            <div className="flex flex-col gap-1.5">
              {sortedAndRanked.slice(0, 10).map((user, idx) => {
                const isMe = currentUsername && user.username === currentUsername;
                const rank = user.rank || idx + 1;
                
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isMe
                        ? "bg-[#10b981]/10 border-[#10b981] shadow-md shadow-[#10b981]/5"
                        : "bg-[#0a0e1a]/40 border-[#1f293b]/60 hover:border-gray-700"
                    }`}
                  >
                    {/* Score stats */}
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <span className="text-xs font-black text-gray-100">{user.points} نقطة</span>
                        <span className="text-[10px] text-gray-500 block">{user.correct_count} توقعات صحيحة</span>
                      </div>
                      {isMe && (
                        <span className="text-[9px] bg-[#10b981] text-white font-black px-2 py-0.5 rounded">أنت</span>
                      )}
                    </div>

                    {/* Profile detail */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-200">{user.username}</span>
                      
                      {/* Rank Circle badge */}
                      <div
                        className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                          rank === 1
                            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                            : rank === 2
                            ? "bg-slate-300/10 text-slate-300 border border-slate-300/30"
                            : rank === 3
                            ? "bg-amber-600/10 text-amber-600 border border-amber-600/30"
                            : "bg-[#111827] text-gray-400 border border-[#1f293b]"
                        }`}
                      >
                        {rank}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
