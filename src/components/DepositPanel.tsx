import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import {
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  ChevronRight,
  Info,
  Upload,
  FileCheck,
  X,
  FileText,
  Trash2,
  Eye,
  Paperclip,
} from 'lucide-react';

interface DepositPanelProps {
  onSuccess?: (newBalance: number) => void;
  onClose?: () => void;
  isModal?: boolean;
}

type DepositMethod = 'MPESA' | 'EMOLA' | 'MKESH' | 'BANK';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2500, 5000];

export const DepositPanel: React.FC<DepositPanelProps> = ({
  onSuccess,
  onClose,
  isModal = false,
}) => {
  const { user, updateBalance, refreshUserData } = useAuth();

  const [method, setMethod] = useState<DepositMethod>('MPESA');
  const [amount, setAmount] = useState<string>('500');
  const [phone, setPhone] = useState<string>(() => {
    if (user?.phone) {
      // Remove country code if present for cleaner input
      return user.phone.replace(/^\+258\s*/, '').replace(/\s+/g, '');
    }
    return '';
  });

  // Proof / Receipt state for administration
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptReference, setReceiptReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    reference: string;
    amount: number;
    methodLabel: string;
    phone: string;
    newBalance: number;
    hasReceipt?: boolean;
    receiptFileName?: string;
    receiptPreview?: string | null;
    receiptReference?: string;
  } | null>(null);

  const numericAmount = parseFloat(amount) || 0;

  const handleFile = (file: File) => {
    setError(null);
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('O comprovativo selecionado ultrapassa o limite de 10 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setError('Formato inválido. Por favor envie uma imagem (PNG, JPG, WEBP) ou documento PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptPreview(reader.result as string);
      setReceiptFile(file);
    };
    reader.onerror = () => {
      setError('Não foi possível ler o arquivo do comprovativo.');
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount < 10) {
      setError('O montante mínimo de depósito é de 10,00 MZN.');
      return;
    }

    if (numericAmount > 100000) {
      setError('O montante máximo permitido por operação é de 100.000,00 MZN.');
      return;
    }

    if (method !== 'BANK') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 8) {
        setError('Por favor, introduza um número de celular válido para debitar os fundos.');
        return;
      }
    }

    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+258') ? phone : `+258 ${phone.trim()}`;
      const res = await api.deposit({
        amount: numericAmount,
        method,
        phoneNumber: formattedPhone,
        receiptImage: receiptPreview || undefined,
        receiptFileName: receiptFile?.name || undefined,
        receiptFileSize: receiptFile?.size || undefined,
        receiptReference: receiptReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      const updatedBalance = res.wallet?.balance ?? (user ? user.balance + numericAmount : numericAmount);
      updateBalance(updatedBalance);
      await refreshUserData();

      let methodLabel = 'M-Pesa (Vodacom)';
      if (method === 'EMOLA') methodLabel = 'e-Mola (Movitel)';
      if (method === 'MKESH') methodLabel = 'mKesh (Tmcel)';
      if (method === 'BANK') methodLabel = 'Transferência Bancária';

      setSuccessData({
        reference: res.transaction?.reference || `DEP-${Date.now().toString().slice(-6)}`,
        amount: numericAmount,
        methodLabel,
        phone: formattedPhone,
        newBalance: updatedBalance,
        hasReceipt: Boolean(receiptFile || receiptReference.trim()),
        receiptFileName: receiptFile?.name,
        receiptPreview: receiptPreview || undefined,
        receiptReference: receiptReference.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess(updatedBalance);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar o depósito.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setError(null);
    setAmount('500');
    removeReceipt();
    setReceiptReference('');
    setNotes('');
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-xl mx-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Painel de Depósito</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Instantâneo
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Carregue a sua carteira em Meticais (MZN) através das carteiras móveis ou bancos moçambicanos.
            </p>
          </div>
        </div>

        {user && (
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Saldo Atual</span>
            <span className="font-extrabold text-sm text-emerald-400">
              {user.balance.toFixed(2)} MZN
            </span>
          </div>
        )}
      </div>

      {/* Success Receipt State */}
      {successData ? (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Depósito Confirmado com Sucesso!
            </span>
            <div className="text-3xl font-black text-white mt-1">
              +{successData.amount.toFixed(2)} <span className="text-base text-slate-400">MZN</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Os fundos já foram creditados e estão prontos para apostas desportivas.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Referência da Transação:</span>
              <span className="text-white font-bold">{successData.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Método de Pagamento:</span>
              <span className="text-emerald-300 font-sans font-bold">{successData.methodLabel}</span>
            </div>
            {method !== 'BANK' && (
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Número de Celular:</span>
                <span className="text-white font-sans">{successData.phone}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-800 font-sans">
              <span className="text-slate-400 font-bold">Novo Saldo Disponível:</span>
              <span className="text-emerald-400 font-black">{successData.newBalance.toFixed(2)} MZN</span>
            </div>
          </div>

          {/* Receipt Submission Badge & Confirmation */}
          {successData.hasReceipt && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Comprovativo Enviado para a Administração</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                O seu comprovativo {successData.receiptFileName ? `(${successData.receiptFileName})` : ''} foi arquivado no sistema com sucesso. A equipa de tesouraria da SofalaBet tem acesso imediato para conferência e auditoria.
              </p>
              {successData.receiptReference && (
                <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/20">
                  <span className="text-slate-400 font-sans block text-[10px]">Cód. Referência da Operadora:</span>
                  <strong>{successData.receiptReference}</strong>
                </div>
              )}
              {successData.receiptPreview && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-bold underline underline-offset-2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar comprovativo enviado</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            {onClose && (
              <button
                id="deposit-success-close-btn"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Apostar Agora</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              id="deposit-success-repeat-btn"
              onClick={resetForm}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Efetuar Outro Depósito</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleDeposit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Method Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              1. Selecione o Método de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* M-Pesa */}
              <button
                type="button"
                id="deposit-method-mpesa"
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
                  <span className="text-[10px] text-slate-400 block">84 / 85</span>
                </div>
              </button>

              {/* e-Mola */}
              <button
                type="button"
                id="deposit-method-emola"
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
                  <span className="text-[10px] text-slate-400 block">86 / 87</span>
                </div>
              </button>

              {/* mKesh */}
              <button
                type="button"
                id="deposit-method-mkesh"
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
                  <span className="text-[10px] text-slate-400 block">82 / 83</span>
                </div>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                id="deposit-method-bank"
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
                  <span className="font-black text-xs sm:text-sm text-white block">Ponto24 / NIB</span>
                  <span className="text-[10px] text-slate-400 block">BIM • BCI • SB</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Amount Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                2. Montante a Depositar (MZN)
              </label>
              <span className="text-[11px] text-slate-400">Mín: 10 MZN • Máx: 100.000 MZN</span>
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-2.5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors border ${
                    numericAmount === val
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="relative">
              <input
                id="deposit-amount-input"
                type="number"
                min="10"
                max="100000"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 500"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 tracking-tight"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                MZN (Meticais)
              </span>
            </div>
          </div>

          {/* 3. Account / Phone Details */}
          {method !== 'BANK' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  3. Número de Celular da Carteira Móvel
                </label>
                <span className="text-[10px] text-slate-400">
                  {method === 'MPESA' && 'Prefixo 84 ou 85'}
                  {method === 'EMOLA' && 'Prefixo 86 ou 87'}
                  {method === 'MKESH' && 'Prefixo 82 ou 83'}
                </span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1.5 text-slate-400 font-bold text-xs pointer-events-none">
                  <span>🇲🇿</span>
                  <span>+258</span>
                </div>
                <input
                  id="deposit-phone-input"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="84 123 4567"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-20 pr-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  Receberá uma solicitação push no seu telemóvel para digitar o seu PIN e validar o depósito.
                </span>
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-blue-500/20 rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-blue-300 font-bold">
                <Building2 className="w-4 h-4" />
                <span>Dados Oficiais para Transferência Bancária / Ponto24:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block font-sans">Banco:</span>
                  <strong>Millennium BIM</strong>
                </div>
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block font-sans">NIB SofalaBet:</span>
                  <strong>0001 0000 0123 4567 8901 2</strong>
                </div>
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block font-sans">Banco:</span>
                  <strong>BCI Moçambique</strong>
                </div>
                <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block font-sans">NIB SofalaBet:</span>
                  <strong>0008 0000 0987 6543 2109 8</strong>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Ao clicar em confirmar, o sistema regista a referência para conferência imediata e crédito em conta.
              </p>
            </div>
          )}

          {/* 4. Proof of Payment Upload for Administration */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Comprovativo para a Administração</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {method === 'BANK' ? 'Recomendado' : 'Opcional / Auditoria'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Anexe o talão, captura de ecrã (screenshot) da mensagem SMS da Vodacom/Movitel/Tmcel ou o comprovativo bancário para revisão direta da administração.
            </p>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              id="deposit-receipt-file-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {/* Drag & Drop Area */}
            {!receiptFile ? (
              <div
                id="deposit-receipt-dropzone"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-950/30 scale-[1.01]'
                    : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-950/80'
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-slate-850 border border-slate-700 text-emerald-400 mx-auto flex items-center justify-center mb-2 shadow-inner">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-200 mb-1">
                  Arraste o comprovativo para aqui ou <span className="text-emerald-400 underline underline-offset-2">clique para selecionar</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Formatos aceites: PNG, JPG, WEBP, PDF (Máx. 10 MB)
                </p>
              </div>
            ) : (
              /* Uploaded Receipt Preview Card */
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {receiptPreview && receiptFile.type.startsWith('image/') ? (
                      <div
                        onClick={() => setShowPreviewModal(true)}
                        className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 cursor-pointer relative group bg-black"
                        title="Clique para ampliar"
                      >
                        <img
                          src={receiptPreview}
                          alt="Miniatura do comprovativo"
                          className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-rose-400 shrink-0">
                        <FileText className="w-7 h-7" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">
                        {receiptFile.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {formatFileSize(receiptFile.size)}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-0.5">
                        <FileCheck className="w-3 h-3" />
                        <span>Pronto para envio à administração</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {receiptPreview && receiptFile.type.startsWith('image/') && (
                      <button
                        type="button"
                        id="deposit-receipt-view-btn"
                        onClick={() => setShowPreviewModal(true)}
                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Ver Comprovativo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      id="deposit-receipt-remove-btn"
                      onClick={removeReceipt}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remover Comprovativo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Supplemental details: SMS Code / Transaction Ref & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  ID / Ref da Operadora ou do Talão (Opcional)
                </label>
                <input
                  id="deposit-receipt-ref-input"
                  type="text"
                  value={receiptReference}
                  onChange={(e) => setReceiptReference(e.target.value)}
                  placeholder="Ex: MP260907.1337.B99"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Mensagem / Observação para a Administração (Opcional)
                </label>
                <input
                  id="deposit-receipt-notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Efetuado via agente M-Pesa..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Fee & Calculation Summary */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Montante Solicitado:</span>
              <span className="font-bold text-white">{numericAmount.toFixed(2)} MZN</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxa de Processamento (Promo SofalaBet):</span>
              <span className="font-bold text-emerald-400">0,00 MZN (Grátis)</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-800">
              <span className="text-white">Total a Creditar:</span>
              <span className="text-emerald-400">+{numericAmount.toFixed(2)} MZN</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="deposit-submit-btn"
            type="submit"
            disabled={loading || numericAmount < 10}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>A processar com a operadora...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Confirmar Depósito de {numericAmount.toFixed(2)} MZN</span>
              </>
            )}
          </button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Transação segura e criptografada com liquidação em Meticais</span>
          </div>
        </form>
      )}

      {/* Full-Screen Receipt Preview Modal */}
      {showPreviewModal && (receiptPreview || successData?.receiptPreview) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  Visualização do Comprovativo
                </span>
              </div>
              <button
                type="button"
                id="deposit-receipt-close-modal-btn"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={receiptPreview || successData?.receiptPreview || ''}
                alt="Comprovativo ampliado"
                className="max-h-[60vh] w-auto max-w-full rounded-lg object-contain border border-slate-800"
              />
            </div>

            <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[220px]">
                {receiptFile?.name || successData?.receiptFileName || 'Comprovativo de Depósito'}
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
