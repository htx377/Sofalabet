import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import {
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Wallet,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';

interface WithdrawalPanelProps {
  onSuccess?: (newBalance: number) => void;
  onClose?: () => void;
  isModal?: boolean;
}

type WithdrawalMethod = 'MPESA' | 'EMOLA' | 'MKESH' | 'BANK';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];

const MZ_BANKS = [
  'Millennium BIM',
  'BCI (Banco Comercial e de Investimentos)',
  'Standard Bank Moçambique',
  'Moza Banco',
  'Nedbank Moçambique',
  'FNB Moçambique',
];

export const WithdrawalPanel: React.FC<WithdrawalPanelProps> = ({
  onSuccess,
  onClose,
  isModal = false,
}) => {
  const { user, updateBalance, refreshUserData } = useAuth();

  const [method, setMethod] = useState<WithdrawalMethod>('MPESA');
  const [amount, setAmount] = useState<string>('250');
  const [phone, setPhone] = useState<string>(() => {
    if (user?.phone) {
      return user.phone.replace(/^\+258\s*/, '').replace(/\s+/g, '');
    }
    return '';
  });

  // Bank transfer states
  const [selectedBank, setSelectedBank] = useState<string>(MZ_BANKS[0]);
  const [nib, setNib] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>(user?.name || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    reference: string;
    amount: number;
    methodLabel: string;
    destination: string;
    newBalance: number;
  } | null>(null);

  const availableBalance = user?.balance ?? 0;
  const numericAmount = parseFloat(amount) || 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount < 20) {
      setError('O montante mínimo de levantamento é de 20,00 MZN.');
      return;
    }

    if (numericAmount > availableBalance) {
      setError(`Saldo insuficiente. O seu saldo disponível é de ${availableBalance.toFixed(2)} MZN.`);
      return;
    }

    let destinationInfo = '';

    if (method !== 'BANK') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 8) {
        setError('Por favor, introduza o número de celular de destino válido.');
        return;
      }
      destinationInfo = phone.startsWith('+258') ? phone : `+258 ${phone.trim()}`;
    } else {
      const cleanNib = nib.replace(/\s+/g, '');
      if (cleanNib.length < 10) {
        setError('Por favor, introduza um NIB ou número de conta bancária válido.');
        return;
      }
      if (!accountHolder.trim()) {
        setError('Por favor, introduza o nome do titular da conta bancária.');
        return;
      }
      destinationInfo = `${selectedBank} • NIB: ${cleanNib} (${accountHolder.trim()})`;
    }

    setLoading(true);

    try {
      const res = await api.withdraw({
        amount: numericAmount,
        method,
        phoneNumber: method !== 'BANK' ? destinationInfo : undefined,
        bankDetails: method === 'BANK' ? destinationInfo : undefined,
      });

      const updatedBalance = res.wallet?.balance ?? (availableBalance - numericAmount);
      updateBalance(updatedBalance);
      await refreshUserData();

      let methodLabel = 'M-Pesa (Vodacom)';
      if (method === 'EMOLA') methodLabel = 'e-Mola (Movitel)';
      if (method === 'MKESH') methodLabel = 'mKesh (Tmcel)';
      if (method === 'BANK') methodLabel = `Transferência Bancária (${selectedBank})`;

      setSuccessData({
        reference: res.transaction?.reference || `LEV-${Date.now().toString().slice(-6)}`,
        amount: numericAmount,
        methodLabel,
        destination: destinationInfo,
        newBalance: updatedBalance,
      });

      if (onSuccess) {
        onSuccess(updatedBalance);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar o levantamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxBalance = () => {
    if (availableBalance > 0) {
      setAmount(Math.floor(availableBalance).toString());
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setError(null);
    setAmount('250');
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-xl mx-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Painel de Levantamento</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Seguro & Rápido
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Levante os seus ganhos diretamente para a sua conta M-Pesa, e-Mola, mKesh ou conta bancária.
            </p>
          </div>
        </div>

        {/* Live Balance */}
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Saldo Disponível</span>
          <span className="font-extrabold text-sm sm:text-base text-emerald-400">
            {availableBalance.toFixed(2)} MZN
          </span>
        </div>
      </div>

      {/* Success Receipt State */}
      {successData ? (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Levantamento Solicitado com Sucesso!
            </span>
            <div className="text-3xl font-black text-white mt-1">
              -{successData.amount.toFixed(2)} <span className="text-base text-slate-400">MZN</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              O pagamento foi processado pela tesouraria SofalaBet e transferido para o seu destino.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Referência de Payout:</span>
              <span className="text-white font-bold">{successData.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Canal de Pagamento:</span>
              <span className="text-emerald-300 font-sans font-bold">{successData.methodLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Destino:</span>
              <span className="text-white font-sans truncate max-w-[240px]">{successData.destination}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 font-sans">
              <span className="text-slate-400 font-bold">Saldo Restante na Conta:</span>
              <span className="text-emerald-400 font-black">{successData.newBalance.toFixed(2)} MZN</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            {onClose && (
              <button
                id="withdraw-success-close-btn"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Concluído</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              id="withdraw-success-repeat-btn"
              onClick={resetForm}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Novo Levantamento</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleWithdraw} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Balance notification card */}
          {availableBalance < 20 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                O seu saldo atual é de {availableBalance.toFixed(2)} MZN. O montante mínimo exigido para levantamentos é de 20,00 MZN.
              </span>
            </div>
          )}

          {/* 1. Method Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              1. Selecione o Canal de Recebimento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* M-Pesa */}
              <button
                type="button"
                id="withdraw-method-mpesa"
                onClick={() => setMethod('MPESA')}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  method === 'MPESA'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50 ring-1 ring-rose-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow">
                    M
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    Vodacom
                  </span>
                </div>
                <div>
                  <span className="font-black text-xs sm:text-sm text-white block">M-Pesa</span>
                  <span className="text-[10px] text-slate-400 block">Instantâneo</span>
                </div>
              </button>

              {/* e-Mola */}
              <button
                type="button"
                id="withdraw-method-emola"
                onClick={() => setMethod('EMOLA')}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  method === 'EMOLA'
                    ? 'bg-amber-950/40 border-orange-500 shadow-md shadow-orange-950/50 ring-1 ring-orange-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow">
                    e
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">
                    Movitel
                  </span>
                </div>
                <div>
                  <span className="font-black text-xs sm:text-sm text-white block">e-Mola</span>
                  <span className="text-[10px] text-slate-400 block">Instantâneo</span>
                </div>
              </button>

              {/* mKesh */}
              <button
                type="button"
                id="withdraw-method-mkesh"
                onClick={() => setMethod('MKESH')}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  method === 'MKESH'
                    ? 'bg-yellow-950/40 border-yellow-500 shadow-md shadow-yellow-950/50 ring-1 ring-yellow-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500 text-slate-950 flex items-center justify-center font-black text-xs shadow">
                    K
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                    Tmcel
                  </span>
                </div>
                <div>
                  <span className="font-black text-xs sm:text-sm text-white block">mKesh</span>
                  <span className="text-[10px] text-slate-400 block">Instantâneo</span>
                </div>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                id="withdraw-method-bank"
                onClick={() => setMethod('BANK')}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  method === 'BANK'
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/50 ring-1 ring-blue-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Bancos
                  </span>
                </div>
                <div>
                  <span className="font-black text-xs sm:text-sm text-white block">Conta / NIB</span>
                  <span className="text-[10px] text-slate-400 block">Transferência</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Amount Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                2. Montante a Levantar (MZN)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Mín: 20 MZN</span>
                <button
                  type="button"
                  onClick={handleMaxBalance}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
                >
                  Levantar Tudo
                </button>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-5 gap-1.5 mb-2.5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={val > availableBalance}
                  onClick={() => setAmount(val.toString())}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors border ${
                    numericAmount === val
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700 disabled:opacity-30'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="relative">
              <input
                id="withdraw-amount-input"
                type="number"
                min="20"
                max={availableBalance}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 250"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500 tracking-tight"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                MZN (Meticais)
              </span>
            </div>
          </div>

          {/* 3. Destination Details */}
          {method !== 'BANK' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  3. Número de Celular para Receber os Fundos
                </label>
                <span className="text-[10px] text-slate-400">
                  {method === 'MPESA' && 'Carteira M-Pesa (84/85)'}
                  {method === 'EMOLA' && 'Carteira e-Mola (86/87)'}
                  {method === 'MKESH' && 'Carteira mKesh (82/83)'}
                </span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1.5 text-slate-400 font-bold text-xs pointer-events-none">
                  <span>🇲🇿</span>
                  <span>+258</span>
                </div>
                <input
                  id="withdraw-phone-input"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="84 123 4567"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-20 pr-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  O valor será creditado diretamente no saldo da carteira do telemóvel indicado.
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-900/90 border border-blue-500/20 rounded-xl p-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Selecione o seu Banco Moçambicano
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-blue-500"
                >
                  {MZ_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  NIB / Número de Conta Bancária
                </label>
                <input
                  type="text"
                  required
                  value={nib}
                  onChange={(e) => setNib(e.target.value)}
                  placeholder="Ex: 0001 0000 1234 5678 9012 3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome Completo do Titular da Conta
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Nome idêntico ao registado no banco"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Fee & Calculation Summary */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Montante a Levantar:</span>
              <span className="font-bold text-white">{numericAmount.toFixed(2)} MZN</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Comissão de Levantamento:</span>
              <span className="font-bold text-emerald-400">0,00 MZN (Sem Taxas)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Saldo Após Operação:</span>
              <span className="font-bold text-slate-300">
                {Math.max(0, availableBalance - numericAmount).toFixed(2)} MZN
              </span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-800">
              <span className="text-white">Total a Receber:</span>
              <span className="text-amber-400">{numericAmount.toFixed(2)} MZN</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="withdraw-submit-btn"
            type="submit"
            disabled={loading || numericAmount < 20 || numericAmount > availableBalance}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>A comunicar com a tesouraria...</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>Solicitar Levantamento de {numericAmount.toFixed(2)} MZN</span>
              </>
            )}
          </button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Processamento verificado pelo sistema de liquidação e tesouraria SofalaBet</span>
          </div>
        </form>
      )}
    </div>
  );
};
