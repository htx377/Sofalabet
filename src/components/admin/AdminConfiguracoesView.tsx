import React, { useState } from 'react';
import { AuditLog } from '../../types.ts';
import {
  Settings,
  Shield,
  Smartphone,
  Database,
  FileText,
  Copy,
  Check,
  RefreshCw,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface AdminConfiguracoesViewProps {
  auditLogs: AuditLog[];
  supabaseStatus: any;
  supabaseSchemaSql: string;
  syncingSupabase: boolean;
  pullingSupabase: boolean;
  copiedSql: boolean;
  handleSyncToSupabase: () => Promise<void>;
  handlePullFromSupabase: () => Promise<void>;
  handleCopySql: () => Promise<void>;
}

export const AdminConfiguracoesView: React.FC<AdminConfiguracoesViewProps> = ({
  auditLogs,
  supabaseStatus,
  supabaseSchemaSql,
  syncingSupabase,
  pullingSupabase,
  copiedSql,
  handleSyncToSupabase,
  handlePullFromSupabase,
  handleCopySql,
}) => {
  const [subTab, setSubTab] = useState<'parametros' | 'contas' | 'auditoria' | 'supabase'>('parametros');

  return (
    <div className="space-y-5">
      {/* Sub-navigation bar matching tree hierarchy */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-700/80 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-300 font-bold text-xs sm:text-sm">⚙️ CONFIGURAÇÕES</span>
          <span className="text-slate-500">/</span>
          <span className="text-xs text-slate-300 font-semibold">
            {subTab === 'parametros' && 'Parâmetros Operacionais da Banca'}
            {subTab === 'contas' && 'Canais de Pagamento & e-Mola'}
            {subTab === 'auditoria' && `Registo Central de Auditoria (${auditLogs.length})`}
            {subTab === 'supabase' && 'Supabase Cloud & Base de Dados'}
          </span>
        </div>

        {/* Tree Sub-tabs buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSubTab('parametros')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'parametros'
                ? 'bg-slate-200 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Parâmetros da Casa</span>
          </button>

          <button
            onClick={() => setSubTab('contas')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'contas'
                ? 'bg-slate-200 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Contas Oficiais</span>
          </button>

          <button
            onClick={() => setSubTab('auditoria')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'auditoria'
                ? 'bg-slate-200 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Auditoria ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setSubTab('supabase')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'supabase'
                ? 'bg-slate-200 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud</span>
          </button>
        </div>
      </div>

      {/* ================= SUB-TAB 1: PARAMETROS DA BANCA ================= */}
      {subTab === 'parametros' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Regras de Apostas & Limites</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Moeda Oficial:</span>
                <span className="font-mono font-bold text-white">MZN (Metical de Moçambique)</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Aposta Mínima por Bilhete:</span>
                <span className="font-mono font-bold text-emerald-400">10,00 MZN</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Aposta Máxima por Bilhete:</span>
                <span className="font-mono font-bold text-amber-400">50.000,00 MZN</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Ganho Máximo por Bilhete:</span>
                <span className="font-mono font-bold text-cyan-400">500.000,00 MZN</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Políticas Financeiras & Bónus</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Bónus de Convite (Referral):</span>
                <span className="font-mono font-bold text-emerald-400">5,0% sobre depósitos</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Taxa de Levantamento e-Mola:</span>
                <span className="font-mono font-bold text-rose-400">5,0% (automática)</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Liquidação de Apostas:</span>
                <span className="font-mono font-bold text-white">Instantânea e Automática</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Anulação de Jogos (VOID):</span>
                <span className="font-mono font-bold text-cyan-400">Reembolso 100% imediato</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: CONTAS OFICIAIS ================= */}
      {subTab === 'contas' && (
        <div className="max-w-2xl mx-auto p-5 sm:p-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Conta e-Mola Oficial ZONABET</h3>
              <p className="text-xs text-slate-400">
                Canal autorizado para recebimento de depósitos e validação de comprovativos.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Operadora:</span>
              <span className="font-bold text-orange-400">e-Mola (Movitel Moçambique)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Número Oficial:</span>
              <span className="font-mono font-black text-white text-base">867090687</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Titular Registada:</span>
              <span className="font-bold text-white">Aninha Basto</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Instruções aos Apostadores:</span>
              <span className="text-slate-300 font-medium text-right max-w-xs">
                Enviar dinheiro para 867090687 e submeter o talão na tela de depósito para crédito imediato.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: AUDITORIA ================= */}
      {subTab === 'auditoria' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-300">
            Rastreamento imutável de todas as ações de gestão (criação de eventos desportivos, alteração de odds, liquidação de bilhetes, ajustes de saldo e bloqueios).
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Data / Hora</th>
                  <th className="py-3 px-3">Administrador</th>
                  <th className="py-3 px-3">Ação</th>
                  <th className="py-3 px-3">Entidade & ID</th>
                  <th className="py-3 px-3">Modificação</th>
                  <th className="py-3 px-3 text-right">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhum registo de auditoria encontrado.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-PT')}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-bold">{log.adminEmail}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {log.entity} ({log.entityId.substring(0, 8)}...)
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                        {log.oldValue && <span className="text-rose-400 line-through mr-1">{log.oldValue}</span>}
                        {log.newValue && <span className="text-emerald-400">{log.newValue}</span>}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[10px] text-slate-500">{log.ip}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: SUPABASE CLOUD ================= */}
      {subTab === 'supabase' && (
        <div className="space-y-4">
          <div className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Integração com Supabase Cloud & PostgreSQL</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Estado da ligação e sincronização bidirecional entre a memória da aplicação e a base de dados em nuvem.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncToSupabase}
                disabled={syncingSupabase}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingSupabase ? 'animate-spin' : ''}`} />
                <span>Sincronizar para Nuvem</span>
              </button>

              <button
                onClick={handlePullFromSupabase}
                disabled={pullingSupabase}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <HardDrive className={`w-3.5 h-3.5 ${pullingSupabase ? 'animate-spin' : ''}`} />
                <span>Puxar da Nuvem</span>
              </button>
            </div>
          </div>

          {/* Status Details */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Estado da Ligação:</span>
              <span className={`font-bold flex items-center gap-1.5 ${
                supabaseStatus?.connected ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  supabaseStatus?.connected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}></span>
                <span>{supabaseStatus?.connected ? 'Conectado à Nuvem Supabase' : 'Modo Seguro Local / Memória'}</span>
              </span>
            </div>

            {supabaseStatus?.url && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">URL do Projeto:</span>
                <span className="font-mono text-cyan-300">{supabaseStatus.url}</span>
              </div>
            )}
          </div>

          {/* Schema SQL */}
          {supabaseSchemaSql && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Esquema SQL do Banco de Dados:</span>
                <button
                  onClick={handleCopySql}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-48">
                {supabaseSchemaSql}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
