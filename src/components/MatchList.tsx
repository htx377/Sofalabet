import React, { useState, useEffect } from 'react';
import { Match, Competition, CompetitionCategory } from '../types.ts';
import { api } from '../api.ts';
import { useBetSlip } from '../context/BetSlipContext.tsx';
import { Trophy, Calendar, Clock, RefreshCw, AlertCircle, MapPin, Award, Shield } from 'lucide-react';

export const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedTier, setSelectedTier] = useState<'ALL' | CompetitionCategory>('ALL');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { items: slipItems, toggleSelection } = useBetSlip();

  const fetchMatches = async () => {
    setLoading(true);
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
      setError(err.message || 'Erro ao carregar os jogos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedCompetition, selectedTier]);

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

  const getCategoryBadge = (match: Match) => {
    const isMocambola = match.competitionCategory === 'MOCAMBOLA' || match.competitionName.includes('Moçambola');
    const isProvincial = match.competitionCategory === 'PROVINCIAL' || match.competitionName.includes('Provincial');

    if (isMocambola) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md text-[11px]">
          <span className="text-xs">🇲🇿</span>
          <span>{match.competitionName}</span>
          <span className="text-[10px] text-emerald-300/80 uppercase font-extrabold tracking-wide">• 1ª Divisão</span>
        </span>
      );
    }
    if (isProvincial) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md text-[11px]">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>{match.competitionName}</span>
          <span className="text-[10px] text-amber-300/80 uppercase font-extrabold tracking-wide">• Provincial</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-md text-[11px]">
        <Shield className="w-3 h-3 text-sky-400" />
        <span>{match.competitionName}</span>
        <span className="text-[10px] text-sky-300/80 uppercase font-extrabold tracking-wide">• Distrital</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Futebol Moçambicano & Mercados 1X2
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Moçambola, Campeonatos Provinciais e Campeonatos Distritais de Moçambique
          </p>
        </div>

        <button
          onClick={fetchMatches}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Atualizar Odds</span>
        </button>
      </div>

      {/* Main Championship Category Navigation Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:p-2.5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => handleTierChange('ALL')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
              selectedTier === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Todos os Jogos</span>
          </button>

          <button
            onClick={() => handleTierChange('MOCAMBOLA')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
              selectedTier === 'MOCAMBOLA'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>🇲🇿</span>
            <span>Moçambola</span>
          </button>

          <button
            onClick={() => handleTierChange('PROVINCIAL')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
              selectedTier === 'PROVINCIAL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>Provinciais</span>
          </button>

          <button
            onClick={() => handleTierChange('DISTRITAL')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
              selectedTier === 'DISTRITAL'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Shield className="w-4 h-4 text-sky-300" />
            <span>Distritais</span>
          </button>
        </div>

        {/* Specific Competition Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-2 border-t border-slate-800/70 scrollbar-none">
          <button
            onClick={() => setSelectedCompetition('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-medium">A carregar jogos e odds atualizadas...</p>
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-300">Nenhum jogo disponível nesta categoria</p>
          <p className="text-xs text-slate-500 mt-1">
            Novos jogos serão agendados pelo administrador em breve.
          </p>
        </div>
      )}

      {/* Match Cards List */}
      <div className="space-y-3.5">
        {matches.map((match) => {
          const market = match.markets.find((m) => m.type === '1X2');
          const homeSelection = market?.selections.find((s) => s.outcome === '1');
          const drawSelection = market?.selections.find((s) => s.outcome === 'X');
          const awaySelection = market?.selections.find((s) => s.outcome === '2');

          const isOpen = match.status === 'OPEN';

          return (
            <div
              key={match.id}
              className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 transition-all shadow-sm hover:shadow-md"
            >
              {/* Card Header: Competition & Kickoff */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {getCategoryBadge(match)}
                  <div className="flex items-center gap-1 text-slate-400 text-[11px] sm:text-xs">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{match.kickoffDate}</span>
                    <Clock className="w-3 h-3 ml-1 text-slate-500" />
                    <span className="font-medium text-slate-300">{match.kickoffTime}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {match.status === 'OPEN' && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ABERTO
                    </span>
                  )}
                  {match.status === 'SUSPENDED' && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      SUSPENSO
                    </span>
                  )}
                  {match.status === 'CLOSED' && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      FECHADO
                    </span>
                  )}
                  {match.status === 'FINISHED' && (
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      TERMINADO ({match.homeScore} - {match.awayScore})
                    </span>
                  )}
                  {match.status === 'CANCELLED' && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      CANCELADO (VOID)
                    </span>
                  )}
                </div>
              </div>

              {/* Match Teams and Odds Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* Team Names */}
                <div className="md:col-span-6 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-white">{match.homeTeam}</span>
                    {match.homeScore !== null && match.homeScore !== undefined && (
                      <span className="font-black text-lg text-emerald-400 ml-2">{match.homeScore}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-slate-200">{match.awayTeam}</span>
                    {match.awayScore !== null && match.awayScore !== undefined && (
                      <span className="font-black text-lg text-emerald-400 ml-2">{match.awayScore}</span>
                    )}
                  </div>
                  {match.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">{match.description}</p>
                  )}
                </div>

                {/* 1X2 Market Odds Buttons */}
                <div className="md:col-span-6 grid grid-cols-3 gap-1.5 sm:gap-2">
                  {/* 1: Home Win */}
                  {homeSelection && (
                    <button
                      disabled={!isOpen}
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
                      className={`group relative p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                        isSelectionInSlip(homeSelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isOpen
                          ? 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 text-white'
                          : 'bg-slate-800/40 border-slate-800/60 opacity-50 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <span className={`text-[10px] font-bold mb-0.5 whitespace-nowrap ${
                        isSelectionInSlip(homeSelection.id) ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        1 • Casa
                      </span>
                      <span className="text-sm sm:text-base font-black tracking-tight">
                        {homeSelection.odds.toFixed(2)}
                      </span>
                    </button>
                  )}

                  {/* X: Draw */}
                  {drawSelection && (
                    <button
                      disabled={!isOpen}
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
                      className={`group relative p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                        isSelectionInSlip(drawSelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isOpen
                          ? 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 text-white'
                          : 'bg-slate-800/40 border-slate-800/60 opacity-50 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <span className={`text-[10px] font-bold mb-0.5 whitespace-nowrap ${
                        isSelectionInSlip(drawSelection.id) ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        X • Empate
                      </span>
                      <span className="text-sm sm:text-base font-black tracking-tight">
                        {drawSelection.odds.toFixed(2)}
                      </span>
                    </button>
                  )}

                  {/* 2: Away Win */}
                  {awaySelection && (
                    <button
                      disabled={!isOpen}
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
                      className={`group relative p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                        isSelectionInSlip(awaySelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isOpen
                          ? 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 text-white'
                          : 'bg-slate-800/40 border-slate-800/60 opacity-50 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <span className={`text-[10px] font-bold mb-0.5 whitespace-nowrap ${
                        isSelectionInSlip(awaySelection.id) ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        2 • Fora
                      </span>
                      <span className="text-sm sm:text-base font-black tracking-tight">
                        {awaySelection.odds.toFixed(2)}
                      </span>
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
