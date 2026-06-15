import React, { useState } from "react";
import { UserProfile, Withdrawal } from "../types";
import { Wallet, ShieldCheck, ShieldAlert, CreditCard, Send, Lock, History, Gift, CheckCircle } from "lucide-react";

interface ProfileWalletProps {
  user: UserProfile | null;
  withdrawals: Withdrawal[];
  predictionsCount: number;
  onWithdrawSubmit: (payload: { amount: number; method: string; wallet_address: string }) => Promise<void>;
  onVerifyEmailMock: () => void; // A helper to trigger Verification state
}

export default function ProfileWallet({
  user,
  withdrawals,
  predictionsCount,
  onWithdrawSubmit,
  onVerifyEmailMock,
}: ProfileWalletProps) {
  const [method, setMethod] = useState("PayPal");
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);

  // Tournament end July 19, 2026
  const tournamentEndDate = new Date("2026-07-19T00:00:00");
  const now = new Date();
  const isTournamentEnded = now >= tournamentEndDate;

  // Withdrawal rules
  const withdrawalMinima: Record<string, number> = {
    "Visa": 15,
    "Virtual Visa": 20,
    "PayPal": 10,
    "Google Play Card": 15,
    "Crypto Binance": 10,
  };

  const minimumAmountNeeded = withdrawalMinima[method] || 10;

  // Criteria validation
  const isEmailVerified = user?.is_verified || false;
  const hasEnoughPredictions = predictionsCount >= 50;
  const isBalanceSufficient = user ? user.balance >= minimumAmountNeeded : false;

  const canWithdraw = isEmailVerified && hasEnoughPredictions && isTournamentEnded && isBalanceSufficient;

  // Calculate countdown days until July 19, 2026
  const diffTime = tournamentEndDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canWithdraw) {
      console.error("عذراً، لم تستوف كافة شروط السحب. يرجى تلبية جميع المتطلبات أولاً.");
      return;
    }

    if (amount < minimumAmountNeeded) {
      console.error(`عذراً، الحد الأدنى للسحب لطريقة ${method} هو $${minimumAmountNeeded}`);
      return;
    }

    if (amount > user.balance) {
      console.error("عذراً، ليس لديك رصيد كاف في محفظتك لإتمام السحب.");
      return;
    }

    if (!walletAddress.trim()) {
      console.error("يرجى إدخال عنوان محفظتك أو تفاصيل بطاقتك لتسليم الأرباح.");
      return;
    }

    try {
      setSubmitting(true);
      await onWithdrawSubmit({
        amount,
        method,
        wallet_address: walletAddress,
      });
      setWalletAddress("");
    } catch (err: any) {
      console.error("فشل تقديم الطلب: ", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#111827] border border-[#1f293b] rounded-xl p-8 text-center shadow-lg my-6">
        <Lock className="w-12 h-12 text-[#10b981] mx-auto mb-3 animate-bounce" />
        <h4 className="font-bold text-gray-200 text-sm">برجاء تسجيل الدخول أولاً للوصول إلى المحفظة وأرباح المسابقات</h4>
        <p className="text-xs text-gray-500 mt-2">يمكنك إنشاء حساب جديد مجاناً في دقيقة واحدة للمشاركة في جوائز كأس العالم.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-right">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Points */}
        <div className="bg-gradient-to-l from-yellow-500/10 to-[#111827] border border-yellow-500/30 rounded-xl p-5 shadow-md flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-bold">نقاط التوقع المكتسبة</span>
            <span className="text-2xl font-black text-yellow-500 mt-1 block">{user.points} نقطة</span>
          </div>
        </div>

        {/* Card Balance */}
        <div className="bg-gradient-to-l from-[#10b981]/10 to-[#111827] border border-[#10b981]/30 rounded-xl p-5 shadow-md flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981] border border-[#10b981]/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-bold">الرصيد المتاح للسحب ($)</span>
            <span className="text-2xl font-black text-white mt-1 block">${user.balance} USD</span>
          </div>
        </div>

        {/* Card Verified state */}
        <div className="bg-[#111827] border border-[#1f293b] rounded-xl p-5 shadow-md flex items-center justify-between">
          <div>
            {isEmailVerified ? (
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-[#10b981] border border-red-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
            )}
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-bold">حالة توثيق Gmail</span>
            {isEmailVerified ? (
              <span className="text-xs font-black text-green-400 mt-1 flex items-center gap-1">
                ✓ حساب موثق بالكامل
              </span>
            ) : (
              <div className="flex flex-col items-end gap-1 mt-1">
                <span className="text-xs font-black text-[#10b981]">غير مؤكد! التوثيق إلزامي للسحب</span>
                <button
                  onClick={onVerifyEmailMock}
                  className="text-[9px] text-blue-400 hover:underline font-bold"
                >
                  انقر هنا لمحاكاة تأكيد بريد Gmail فوراً
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checklist constraints panel */}
      <div className="bg-[#111827] border border-[#1f293b] rounded-xl p-6 shadow-md text-right relative">
        <h3 className="font-extrabold text-white text-base mb-4 border-b border-gray-800 pb-2 flex items-center gap-2 justify-end font-sans">
          <span>شروط السحب والأحكام المونديالية</span>
          <CreditCard className="w-5 h-5 text-[#10b981]" />
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Rules left */}
          <div className="flex flex-col gap-3 py-2">
            {/* Condition 1: Verify Email */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0e1a]/60 border border-[#1f293b]">
              <span className={`font-bold ${isEmailVerified ? 'text-green-400' : 'text-yellow-500'}`}>
                {isEmailVerified ? "مكتمل ✓" : "مطلوب تأكيده"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-300">توثيق حساب Gmail عبر رمز التأكيد</span>
                <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px]">1</span>
              </div>
            </div>

            {/* Condition 2: Predictions count */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0e1a]/60 border border-[#1f293b]">
              <span className={`font-bold ${hasEnoughPredictions ? 'text-green-400' : 'text-gray-500'}`}>
                {predictionsCount} / 50 توقعات
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-300">تسجيل 50 توقعاً على مباريات المونديال على الأقل</span>
                <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px]">2</span>
              </div>
            </div>
          </div>

          {/* Rules right */}
          <div className="flex flex-col gap-3 py-2">
            {/* Condition 3: Tournament end */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0e1a]/60 border border-[#1f293b]">
              <span className={`font-bold ${isTournamentEnded ? 'text-green-400' : 'text-yellow-500'}`}>
                {isTournamentEnded ? "انتهى المونديال ✓" : `متبقي ${diffDays} يوم`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-300">السحب فقط بعد انتهاء بطولة كأس العالم (19 يوليو 2026)</span>
                <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px]">3</span>
              </div>
            </div>

            {/* Condition 4: Sufficiency check */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0e1a]/60 border border-[#1f293b]">
              <span className={`font-bold ${isBalanceSufficient ? 'text-green-400' : 'text-gray-500'}`}>
                {isBalanceSufficient ? "مستوفى الحساب ✓" : "أقل من الحد الأدنى"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-300">رصيدك الحالي يتجاوز الحد الأدنى لطريقة السحب المحددة</span>
                <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px]">4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual flow form block (Withdrawal form and history) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Withdrawal history */}
        <div className="bg-[#111827] border border-[#1f293b] rounded-xl p-6 shadow-md text-right">
          <h4 className="font-extrabold text-white text-base mb-4 border-b border-gray-800 pb-2 flex items-center gap-2 justify-end font-sans">
            <span>سجل عمليات السحب وطلباتك</span>
            <History className="w-5 h-5 text-[#10b981]" />
          </h4>

          {withdrawals.length === 0 ? (
            <div className="bg-[#0a0e1a]/40 border border-[#1f293b]/40 rounded-xl p-8 text-center text-xs text-gray-500">
              لا توجد أي طلبات سحب منشأة بعد. قم بربح النقاط في مسابقات المونديال ليعمل رصيدك!
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="bg-[#0a0e1a] border border-[#1f293b] rounded-xl p-4 flex items-center justify-between text-xs"
                >
                  <div className="text-left font-bold">
                    <span className="text-green-400 font-black">${w.amount} USD</span>
                    <span className="text-[10px] text-gray-500 block font-mono">{new Date(w.created_at).toLocaleDateString("ar-SA")}</span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {w.status === "pending" ? (
                        <span className="bg-yellow-950/40 text-yellow-400 px-2 py-0.5 rounded border border-yellow-800 font-extrabold text-[10px]">
                          قيد المراجعة اليدوية
                        </span>
                      ) : (
                        <span className="bg-green-950/40 text-green-400 px-2 py-0.5 rounded border border-green-800 font-extrabold text-[10px]">
                          تم الدفع بنجاح ✓
                        </span>
                      )}
                      <h5 className="font-bold text-gray-200">{w.method}</h5>
                    </div>
                    <span className="text-[10px] text-gray-500 truncate block max-w-[200px] mt-1 font-mono">{w.wallet_address}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Request form */}
        <div className="bg-[#111827] border border-[#1f293b] rounded-xl p-6 shadow-md text-right relative">
          {!canWithdraw && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center rounded-xl">
              <Lock className="w-12 h-12 text-[#10b981] mb-3 animate-pulse" />
              <h5 className="font-bold text-white text-sm">عمليات سحب الأرباح مغلقة ومؤمنة مؤقتاً</h5>
              <p className="text-xs text-gray-400 max-w-sm mt-1.5 leading-relaxed">
                سيتم تفعيل تقديم الطلبات فور ايفاء جميع المتطلبات الخاصة بك كأس العالم وتخطي مرحلة التوقع. يرجى توثيق Gmail وإطلاق {hasEnoughPredictions ? "توقعك" : `${50 - predictionsCount} توقعات إضافية`}.
              </p>
              {!isEmailVerified && (
                <button
                  onClick={onVerifyEmailMock}
                  className="mt-4 px-4 py-2 bg-gradient-to-l from-[#10b981] to-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  نقرة سريعة لمحاكاة توثيق بريد Gmail
                </button>
              )}
            </div>
          )}

          <h4 className="font-extrabold text-white text-base mb-4 border-b border-gray-800 pb-2 flex items-center gap-2 justify-end font-sans">
            <span>طلب سحب نقدي جديد</span>
            <Send className="w-5 h-5 text-[#10b981]" />
          </h4>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Method Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">طريقة سداد الأرباح المفضلة:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#1f293b] hover:border-gray-700 text-xs font-extrabold text-white rounded-lg px-3.5 py-2.5 focus:outline-none"
              >
                <option value="Visa">Visa البنكية (حد أدنى $15)</option>
                <option value="Virtual Visa">Visa الافتراضية (حد أدنى $20)</option>
                <option value="PayPal">PayPal للمدفوعات الرقمية (حد أدنى $10)</option>
                <option value="Google Play Card">بطاقات جوجل بلاي بقيمة متساوية (حد أدنى $15)</option>
                <option value="Crypto Binance">عملات كريبتو بينانس Binance (حد أدنى $10)</option>
              </select>
            </div>

            {/* Wallet Address / information text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">
                {method.includes("Visa") 
                  ? "تفاصيل بطاقة الفيزا ورقم الحساب البنكي:" 
                  : method.includes("PayPal")
                  ? "بريد PayPal الإلكتروني لاستقبال الأرباح:"
                  : method.includes("Google")
                  ? "البريد الإلكتروني لإرسال كود البطاقة:"
                  : "رقم محفظة Binance (TRC20 أو ERC20):"}
              </label>
              <input
                type="text"
                placeholder="أدخل عنوان تفاصيل المحفظة / الحساب هنا بدقة"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#1f293b] focus:border-[#10b981] text-xs font-extrabold text-white rounded-lg px-3.5 py-2.5 focus:outline-none text-right"
              />
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold">الحد الأدنى: ${minimumAmountNeeded}</span>
                <label className="font-bold text-gray-400">المبلغ المراد سحبه بالدولار ($):</label>
              </div>
              <input
                type="number"
                min={minimumAmountNeeded}
                max={user.balance}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0a0e1a] border border-[#1f293b] focus:border-[#10b981] text-xs font-black text-white rounded-lg px-3.5 py-2.5 focus:outline-none text-right"
              />
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-gradient-to-l from-[#10b981] to-emerald-800 hover:brightness-110 text-xs font-black text-white py-3 rounded-lg transition-all shadow-md active:translate-y-0.5 text-center flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>تقديم طلب السحب المالي المعتمد</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
