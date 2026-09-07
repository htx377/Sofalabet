import React, { useState } from 'react';
import { useBetSlip } from '../context/BetSlipContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Ticket, Trash2, X, AlertCircle, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';

interface BetSlipProps {
  onOpenAuth: () => void;
}

export const BetSlip: React.FC<BetSlipProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const {
    items,
    stake,
    totalOdds,
    potentialReturn,
    isSubmitting,
    isOpenMobile,
    setIsOpenMobile,
    removeSelection,
    clearSlip,
    setStake,
    placeBet,
  } = useBetSlip();

  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleConfirmBet = async () => {
    setFeedback(null);
    if (!user) {
      onOpenAuth();
      return;
    }

    const res = await placeBet();
    if (res.success) {
      setFeedback({ success: true, message: res.message || 'Aposta registada!' });
      setTimeout(() => setFeedback(null), 5000);
    } else {
      setFeedback({ success: false, message: res.message || 'Erro ao processar' });
    }
  };

  const isMultiple = items.length > 1;

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
        <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 text-white">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-emerald-400" />
              <h2 className="font-extrabold text-base tracking-tight">Boletim de Apostas</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {items.length}
              </span>
            </div>

            {items.length > 0 && (
              <button
                onClick={clearSlip}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                title="Limpar seleções"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* Bet Type Badge */}
          {items.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-slate-400">Tipo de Aposta:</span>
              <span className={isMultiple ? 'text-cyan-400 font-bold' : 'text-emerald-400 font-bold'}>
                {isMultiple ? `MÚLTIPLA (${items.length} Jogos)` : 'SIMPLES'}
              </span>
            </div>
          )}

          {/* Selection Items */}
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Ticket className="w-10 h-10 mx-auto stroke-1 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">O seu boletim está vazio</p>
              <p className="text-xs text-slate-500">
                Clique nas odds de qualquer jogo para adicionar seleções ao boletim.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.selectionId}
                  className="relative p-3 rounded-xl bg-slate-800/90 border border-slate-700/80 group"
                >
                  <button
                    onClick={() => removeSelection(item.selectionId)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <p className="text-[10px] font-semibold text-emerald-400">{item.competitionName}</p>
                  <p className="text-xs font-bold text-white mt-0.5 pr-5 line-clamp-1">{item.matchTitle}</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {item.outcome}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{item.selectionLabel}</span>
                    </div>
                    <span className="text-sm font-black text-emerald-400">{item.odds.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Calculation & Stake Section */}
          {items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              {/* Total Odds */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Odd Total:</span>
                <span className="font-black text-lg text-emerald-400">{totalOdds.toFixed(2)}</span>
              </div>

              {/* Stake Input */}
              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <label htmlFor="stake-input" className="font-semibold text-slate-300">Montante da Aposta (MZN):</label>
                  {user && (
                    <span className="text-slate-400 text-[11px]">
                      Disp: <strong className="text-emerald-400">{user.balance.toFixed(2)} MZN</strong>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="stake-input"
                    type="number"
                    min="10"
                    max="50000"
                    step="10"
                    value={stake || ''}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="100"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">MZN</span>
                </div>

                {/* Quick Chips */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setStake(amt)}
                      className={`py-1 rounded-lg text-xs font-bold border transition-colors ${
                        stake === amt
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Possible Return */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Possível Retorno</span>
                  <span className="text-base font-black text-emerald-400 tracking-tight">
                    {potentialReturn.toFixed(2)} MZN
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 text-right">
                  Retorno = Stake × Odd Total
                </span>
              </div>

              {/* Feedback messages */}
              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    feedback.success
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                  }`}
                >
                  {feedback.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Confirm Bet Button */}
              <button
                id="confirm-bet-desktop-btn"
                onClick={handleConfirmBet}
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting
                  ? 'A verificar saldo e odds...'
                  : user
                  ? `CONFIRMAR APOSTA (${stake} MZN)`
                  : 'INICIAR SESSÃO PARA APOSTAR'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE BOTTOM STICKY SHEET ================= */}
      <div className="lg:hidden">
        {/* Floating Mini Bar when items exist (positioned right above mobile nav bar) */}
        {items.length > 0 && !isOpenMobile && (
          <div className="fixed bottom-14 left-0 right-0 z-30 p-2.5 sm:p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl">
            <div className="max-w-md mx-auto flex items-center justify-between gap-3">
              <button
                id="mobile-open-slip-btn"
                onClick={() => setIsOpenMobile(true)}
                className="flex items-center gap-2.5 text-left flex-1"
              >
                <div className="relative p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Ticket className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                    {items.length}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">Boletim</span>
                    <span className="text-[10px] text-emerald-400 font-black">({totalOdds.toFixed(2)} Odd)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Possível Retorno: {potentialReturn.toFixed(2)} MZN</span>
                </div>
              </button>

              <button
                onClick={() => setIsOpenMobile(true)}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1 shadow-md shadow-emerald-500/20"
              >
                <span>Ver Boletim</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Expanded Mobile Sheet */}
        {isOpenMobile && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsOpenMobile(false)}
          >
            <div
              className="w-full max-w-lg mx-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl p-4 sm:p-5 text-white max-h-[88vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Mobile Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-emerald-400" />
                  <h2 className="font-extrabold text-base">Boletim de Apostas ({items.length})</h2>
                </div>

                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button
                      onClick={clearSlip}
                      className="text-xs text-rose-400 hover:underline px-2 py-1"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpenMobile(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                {items.length === 0 ? (
                  <div className="text-center py-10 space-y-1.5">
                    <p className="text-slate-400 text-sm font-semibold">O teu boletim está vazio</p>
                    <p className="text-xs text-slate-500">Clica nas odds de qualquer jogo para adicionar seleções.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.selectionId}
                      className="relative p-3 rounded-xl bg-slate-800 border border-slate-700"
                    >
                      <button
                        onClick={() => removeSelection(item.selectionId)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-[10px] text-emerald-400 font-semibold">{item.competitionName}</p>
                      <p className="text-xs font-bold text-white pr-6">{item.matchTitle}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                        <span className="text-xs font-bold text-slate-300">
                          {item.outcome}: {item.selectionLabel}
                        </span>
                        <span className="text-sm font-black text-emerald-400">{item.odds.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Mobile Inputs & Confirmation */}
              {items.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Odd Total:</span>
                    <span className="font-black text-emerald-400 text-base">{totalOdds.toFixed(2)}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="stake-input-mobile" className="block text-xs font-semibold text-slate-300">
                        Valor Apostado (MZN)
                      </label>
                      {user && (
                        <span className="text-[11px] text-slate-400">
                          Disponível: <strong className="text-emerald-400">{user.balance.toFixed(2)} MZN</strong>
                        </span>
                      )}
                    </div>
                    <input
                      id="stake-input-mobile"
                      type="number"
                      min="10"
                      value={stake || ''}
                      onChange={(e) => setStake(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Quick stake chips for mobile */}
                  <div className="flex items-center gap-1.5">
                    {[50, 100, 250, 500].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setStake(amount)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          stake === amount
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
                        }`}
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Possível Retorno:</span>
                    <span className="font-black text-emerald-400 text-sm">{potentialReturn.toFixed(2)} MZN</span>
                  </div>

                  {feedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        feedback.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                      }`}
                    >
                      {feedback.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      <span>{feedback.message}</span>
                    </div>
                  )}

                  <button
                    id="confirm-bet-mobile-btn"
                    onClick={handleConfirmBet}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? 'A processar...' : user ? `CONFIRMAR APOSTA (${stake} MZN)` : 'ENTRAR PARA APOSTAR'}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
};
