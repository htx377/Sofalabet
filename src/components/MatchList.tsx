import React, { useState, useEffect } from 'react';
import { Match, Competition, CompetitionCategory } from '../types.ts';
import { api } from '../api.ts';
import { useBetSlip } from '../context/BetSlipContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { TeamBadge } from './TeamBadge.tsx';
import { Trophy, Clock, RefreshCw, AlertCircle, Award, Shield, Radio, Lock } from 'lucide-react';
import { isMatchBettingOpen, isMatchStarted } from '../utils/matchUtils.ts';
import { subscribeToSettlement } from '../utils/settlementEvents.ts';

export const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedTier, setSelectedTier] = useState<'ALL' | CompetitionCategory>('ALL');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pulsingMatchId, setPulsingMatchId] = useState<string | null>(null);
  const [, setTick] = useState<number>(Date.now());

  const { items: slipItems, toggleSelection, updateSelectionOdds } = useBetSlip();
  const { isLiveConnected, onMatchChange } = useRealtime();

  // Relógio a cada 10 segundos para verificar imediatamente o início das partidas e bloquear apostas
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchMatches = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params: { competitionId?: string; category?: string } = {};
      if (selectedCompetition !== 'all') {
        params.competitionId = selectedCompetition;
      } else if (selectedTier !== 'ALL') {
        params.category = selectedTier;
      }

      const [matchRes, compRes] = await Promise.all([
        api.getMatches(Object.keys(params).length > 0 ? params : undefined),
        api.getCompetitions(),
      ]);
      setMatches(matchRes.matches);
      setCompetitions(compRes.competitions);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Erro ao carregar os jogos');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedCompetition, selectedTier]);

  // Subscrição em tempo real com o Supabase Realtime
  useEffect(() => {
    const unsubscribe = onMatchChange((updatedMatch, eventType) => {
      console.log('[MatchList Realtime] Jogo recebido via Supabase:', updatedMatch.id, eventType);

      // Efeito visual de destaque na partida atualizada
      setPulsingMatchId(updatedMatch.id);
      setTimeout(() => {
        setPulsingMatchId((curr) => (curr === updatedMatch.id ? null : curr));
      }, 3000);

      // Atualizar odds de seleções que estejam abertas no boletim de apostas
      const market = updatedMatch.markets?.find((m) => m.type === '1X2');
      if (market && market.selections) {
        for (const sel of market.selections) {
          updateSelectionOdds(updatedMatch.id, sel.id, sel.odds);
        }
      }

      // Atualizar a lista local de jogos sem recarregar a página
      setMatches((prevMatches) => {
        if (eventType === 'DELETE') {
          return prevMatches.filter((m) => m.id !== updatedMatch.id);
        }
        const index = prevMatches.findIndex((m) => m.id === updatedMatch.id);
        if (index >= 0) {
          const next = [...prevMatches];
          next[index] = updatedMatch;
          return next;
        } else {
          // Novo jogo inserido
          return [updatedMatch, ...prevMatches];
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [onMatchChange, updateSelectionOdds]);

  // Subscrição a eventos de liquidação de resultados inseridos pelo administrador
  useEffect(() => {
    const unsubscribe = subscribeToSettlement((payload) => {
      console.log('[MatchList] Notificação de liquidação de partida recebida:', payload);
      setPulsingMatchId(payload.matchId);
      setTimeout(() => {
        setPulsingMatchId((curr) => (curr === payload.matchId ? null : curr));
      }, 4000);

      // Atualiza imediatamente o jogo para FINISHED com os respetivos golos
      setMatches((prevMatches) =>
        prevMatches.map((m) => {
          if (m.id === payload.matchId) {
            return {
              ...m,
              status: 'FINISHED',
              homeScore: payload.homeScore,
              awayScore: payload.awayScore,
            };
          }
          return m;
        })
      );
      // Recarrega em plano de fundo para sincronizar dados adicionais
      fetchMatches(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleTierChange = (tier: 'ALL' | CompetitionCategory) => {
    setSelectedTier(tier);
    setSelectedCompetition('all');
  };

  const isSelectionInSlip = (selectionId: string) => {
    return slipItems.some((i) => i.selectionId === selectionId);
  };

  // Filter competitions matching the selected tier
  const visibleCompetitions = competitions.filter((comp) => {
    if (selectedTier === 'ALL') return true;
    return comp.category === selectedTier;
  });

  return (
    <div className="space-y-3">
      {/* 1. Header: Futebol Moçambicano */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Futebol Moçambicano</span>
          </h1>
          {isLiveConnected && (
            <span
              title="Ligação em tempo real com o Supabase ativa"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse"
            >
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Ao Vivo</span>
            </span>
          )}
        </div>
        <button
          onClick={() => fetchMatches(false)}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-colors"
          title="Atualizar Odds"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* 2. Category Navigation Tabs: Todos | Moçambola | Provinciais | Distritais */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-1.5 sm:p-2.5 shadow-sm w-full">
        <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full">
          <button
            onClick={() => handleTierChange('ALL')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black min-h-[42px] sm:min-h-[44px] transition-all ${
              selectedTier === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Todos</span>
          </button>

          <button
            onClick={() => handleTierChange('MOCAMBOLA')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black min-h-[42px] sm:min-h-[44px] transition-all ${
              selectedTier === 'MOCAMBOLA'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="shrink-0 text-xs">🇲🇿</span>
            <span className="truncate">Moçambola</span>
          </button>

          <button
            onClick={() => handleTierChange('PROVINCIAL')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black min-h-[42px] sm:min-h-[44px] transition-all ${
              selectedTier === 'PROVINCIAL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-950 shrink-0" />
            <span className="truncate">Provinciais</span>
          </button>

          <button
            onClick={() => handleTierChange('DISTRITAL')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black min-h-[42px] sm:min-h-[44px] transition-all ${
              selectedTier === 'DISTRITAL'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-sky-950 shrink-0" />
            <span className="truncate">Distritais</span>
          </button>
        </div>

        {/* Specific Competition Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 mt-2 border-t border-slate-800/60 scrollbar-none w-full max-w-full">
          <button
            onClick={() => setSelectedCompetition('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedCompetition === 'all'
                ? 'bg-slate-700 text-white font-black'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
            }`}
          >
            {selectedTier === 'ALL'
              ? 'Todos os Campeonatos'
              : selectedTier === 'MOCAMBOLA'
              ? 'Todos Moçambola'
              : selectedTier === 'PROVINCIAL'
              ? 'Todas as Províncias'
              : 'Todos os Distritos'}
          </button>

          {visibleCompetitions.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedCompetition(comp.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCompetition === comp.id
                  ? 'bg-slate-700 text-white font-bold border border-slate-600'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                comp.category === 'MOCAMBOLA' ? 'bg-emerald-400' : comp.category === 'PROVINCIAL' ? 'bg-amber-400' : 'bg-sky-400'
              }`}></span>
              <span>{comp.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Section Title: Jogos de Hoje */}
      <div className="flex items-center justify-between pt-1 px-0.5">
        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Jogos de Hoje</span>
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {matches.length} {matches.length === 1 ? 'partida' : 'partidas'}
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-500 mb-2" />
          <p className="text-xs font-medium">A carregar jogos e odds...</p>
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="py-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">Nenhum jogo disponível nesta categoria</p>
          <p className="text-xs text-slate-500 mt-1">
            Novos jogos serão agendados pelo administrador em breve.
          </p>
        </div>
      )}

      {/* Match Cards List */}
      <div className="space-y-2.5">
        {matches.map((match) => {
          const market = match.markets.find((m) => m.type === '1X2');
          const homeSelection = market?.selections.find((s) => s.outcome === '1');
          const drawSelection = market?.selections.find((s) => s.outcome === 'X');
          const awaySelection = market?.selections.find((s) => s.outcome === '2');

          const isBettingOpen = isMatchBettingOpen(match);
          const started = isMatchStarted(match);
          const isFinished = match.status === 'FINISHED';
          const isJustUpdated = pulsingMatchId === match.id;

          return (
            <div
              key={match.id}
              className={`w-full max-w-full overflow-hidden bg-slate-900 border rounded-2xl p-3 sm:p-3.5 transition-all duration-500 shadow-sm ${
                isJustUpdated
                  ? 'border-emerald-400/80 shadow-md shadow-emerald-500/20 bg-emerald-950/20 ring-1 ring-emerald-500/40'
                  : !isBettingOpen
                  ? 'border-slate-800/70 bg-slate-900/70'
                  : 'border-slate-800 hover:border-slate-700/80'
              }`}
            >
              {/* Card Header: League Name & Kickoff Date/Time & Status */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-800/80 text-xs flex-wrap w-full">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  <span className="font-black text-[11px] text-emerald-400 uppercase tracking-wide truncate">
                    {match.competitionName}
                  </span>
                  {isFinished ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shrink-0">
                      🏁 Encerrado ({match.homeScore ?? 0} - {match.awayScore ?? 0})
                    </span>
                  ) : started || !isBettingOpen ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3 text-rose-400" /> Partida Iniciada • Apostas Bloqueadas
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      Apostas Abertas
                    </span>
                  )}
                  {isJustUpdated && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse shrink-0">
                      Atualizado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium shrink-0 ml-auto">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{match.kickoffDate}, {match.kickoffTime}</span>
                </div>
              </div>

              {/* Match Teams + 1X2 Odds Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center w-full">
                
                {/* Teams Info with Badges and Names */}
                <div className="md:col-span-6 space-y-2 min-w-0 w-full">
                  {/* Home Team */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <TeamBadge teamName={match.homeTeam} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                      <span className="font-extrabold text-sm text-white tracking-tight truncate" title={match.homeTeam}>
                        {match.homeTeam}
                      </span>
                    </div>
                    {match.homeScore !== null && match.homeScore !== undefined && (
                      <span className="font-black text-base text-emerald-400 shrink-0 ml-1">{match.homeScore}</span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <TeamBadge teamName={match.awayTeam} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                      <span className="font-extrabold text-sm text-slate-200 tracking-tight truncate" title={match.awayTeam}>
                        {match.awayTeam}
                      </span>
                    </div>
                    {match.awayScore !== null && match.awayScore !== undefined && (
                      <span className="font-black text-base text-emerald-400 shrink-0 ml-1">{match.awayScore}</span>
                    )}
                  </div>
                </div>

                {/* 1X2 Odds Buttons */}
                <div className="md:col-span-6 grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
                  {/* 1: Home Win */}
                  {homeSelection && (
                    <button
                      disabled={!isBettingOpen}
                      onClick={() =>
                        toggleSelection({
                          matchId: match.id,
                          matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                          competitionName: match.competitionName,
                          kickoff: `${match.kickoffDate} ${match.kickoffTime}`,
                          marketId: market!.id,
                          marketName: market!.name,
                          selectionId: homeSelection.id,
                          outcome: '1',
                          selectionLabel: match.homeTeam,
                          odds: homeSelection.odds,
                        })
                      }
                      className={`group relative py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all touch-manipulation min-h-[46px] ${
                        isSelectionInSlip(homeSelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isBettingOpen
                          ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-white active:scale-95'
                          : 'bg-slate-900/60 border-slate-800/60 opacity-40 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <span className={`text-[10px] font-bold mb-0.5 ${
                        isSelectionInSlip(homeSelection.id) ? 'text-slate-950' : 'text-slate-400'
                      }`}>
                        1
                      </span>
                      <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
                        {homeSelection.odds.toFixed(2)}
                      </span>
                      {!isBettingOpen && (
                        <span className="text-[8px] font-bold text-slate-500 flex items-center gap-0.5 mt-0.5">
                          <Lock className="w-2.5 h-2.5" /> Bloqueado
                        </span>
                      )}
                    </button>
                  )}

                  {/* X: Draw */}
                  {drawSelection && (
                    <button
                      disabled={!isBettingOpen}
                      onClick={() =>
                        toggleSelection({
                          matchId: match.id,
                          matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                          competitionName: match.competitionName,
                          kickoff: `${match.kickoffDate} ${match.kickoffTime}`,
                          marketId: market!.id,
                          marketName: market!.name,
                          selectionId: drawSelection.id,
                          outcome: 'X',
                          selectionLabel: 'Empate',
                          odds: drawSelection.odds,
                        })
                      }
                      className={`group relative py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all touch-manipulation min-h-[46px] ${
                        isSelectionInSlip(drawSelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isBettingOpen
                          ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-white active:scale-95'
                          : 'bg-slate-900/60 border-slate-800/60 opacity-40 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <span className={`text-[10px] font-bold mb-0.5 ${
                        isSelectionInSlip(drawSelection.id) ? 'text-slate-950' : 'text-slate-400'
                      }`}>
                        X
                      </span>
                      <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
                        {drawSelection.odds.toFixed(2)}
                      </span>
                      {!isBettingOpen && (
                        <span className="text-[8px] font-bold text-slate-500 flex items-center gap-0.5 mt-0.5">
                          <Lock className="w-2.5 h-2.5" /> Bloqueado
                        </span>
                      )}
                    </button>
                  )}

                  {/* 2: Away Win */}
                  {awaySelection && (
                    <button
                      disabled={!isBettingOpen}
                      onClick={() =>
                        toggleSelection({
                          matchId: match.id,
                          matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                          competitionName: match.competitionName,
                          kickoff: `${match.kickoffDate} ${match.kickoffTime}`,
                          marketId: market!.id,
                          marketName: market!.name,
                          selectionId: awaySelection.id,
                          outcome: '2',
                          selectionLabel: match.awayTeam,
                          odds: awaySelection.odds,
                        })
                      }
                      className={`group relative py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all touch-manipulation min-h-[46px] ${
                        isSelectionInSlip(awaySelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isBettingOpen
                          ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-white active:scale-95'
                          : 'bg-slate-900/60 border-slate-800/60 opacity-40 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <span className={`text-[10px] font-bold mb-0.5 ${
                        isSelectionInSlip(awaySelection.id) ? 'text-slate-950' : 'text-slate-400'
                      }`}>
                        2
                      </span>
                      <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
                        {awaySelection.odds.toFixed(2)}
                      </span>
                      {!isBettingOpen && (
                        <span className="text-[8px] font-bold text-slate-500 flex items-center gap-0.5 mt-0.5">
                          <Lock className="w-2.5 h-2.5" /> Bloqueado
                        </span>
                      )}
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
