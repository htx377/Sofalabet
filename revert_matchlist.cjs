const fs = require('fs');
let content = fs.readFileSync('src/components/MatchList.tsx', 'utf8');

const oldHeader = `      {/* 3. Section Title: Jogos de Hoje */}
      <div className="flex items-center justify-between pt-1 px-0.5">
        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Jogos de Hoje</span>
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {matches.length} {matches.length === 1 ? 'partida' : 'partidas'}
        </span>
      </div>`;

const regexHeader = /\{\/\* 3\. Section Title: Jogos de Hoje \*\/\}[\s\S]*?<\/div>/;
content = content.replace(regexHeader, oldHeader);

const oldMatchCard = `          return (
            <div
              key={match.id}
              className={\`w-full max-w-full overflow-hidden bg-slate-900 border rounded-2xl p-3 sm:p-3.5 transition-all duration-500 shadow-sm \${
                isJustUpdated
                  ? 'border-emerald-400/80 shadow-md shadow-emerald-500/20 bg-emerald-950/20 ring-1 ring-emerald-500/40'
                  : !isBettingOpen
                  ? 'border-slate-800/70 bg-slate-900/70'
                  : 'border-slate-800 hover:border-slate-700/80'
              }\`}
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
                          matchTitle: \`\${match.homeTeam} vs \${match.awayTeam}\`,
                          competitionName: match.competitionName,
                          kickoff: \`\${match.kickoffDate} \${match.kickoffTime}\`,
                          marketId: market!.id,
                          marketName: market!.name,
                          selectionId: homeSelection.id,
                          outcome: '1',
                          selectionLabel: match.homeTeam,
                          odds: homeSelection.odds,
                        })
                      }
                      className={\`group relative py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all touch-manipulation min-h-[46px] \${
                        isSelectionInSlip(homeSelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isBettingOpen
                          ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-white active:scale-95'
                          : 'bg-slate-900/60 border-slate-800/60 opacity-40 cursor-not-allowed text-slate-500'
                      }\`}
                    >
                      <span className={\`text-[10px] font-bold mb-0.5 \${
                        isSelectionInSlip(homeSelection.id) ? 'text-slate-950' : 'text-slate-400'
                      }\`}>
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
                          matchTitle: \`\${match.homeTeam} vs \${match.awayTeam}\`,
                          competitionName: match.competitionName,
                          kickoff: \`\${match.kickoffDate} \${match.kickoffTime}\`,
                          marketId: market!.id,
                          marketName: market!.name,
                          selectionId: drawSelection.id,
                          outcome: 'X',
                          selectionLabel: 'Empate',
                          odds: drawSelection.odds,
                        })
                      }
                      className={\`group relative py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all touch-manipulation min-h-[46px] \${
                        isSelectionInSlip(drawSelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isBettingOpen
                          ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-white active:scale-95'
                          : 'bg-slate-900/60 border-slate-800/60 opacity-40 cursor-not-allowed text-slate-500'
                      }\`}
                    >
                      <span className={\`text-[10px] font-bold mb-0.5 \${
                        isSelectionInSlip(drawSelection.id) ? 'text-slate-950' : 'text-slate-400'
                      }\`}>
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
                          matchTitle: \`\${match.homeTeam} vs \${match.awayTeam}\`,
                          competitionName: match.competitionName,
                          kickoff: \`\${match.kickoffDate} \${match.kickoffTime}\`,
                          marketId: market!.id,
                          marketName: market!.name,
                          selectionId: awaySelection.id,
                          outcome: '2',
                          selectionLabel: match.awayTeam,
                          odds: awaySelection.odds,
                        })
                      }
                      className={\`group relative py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all touch-manipulation min-h-[46px] \${
                        isSelectionInSlip(awaySelection.id)
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : isBettingOpen
                          ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-white active:scale-95'
                          : 'bg-slate-900/60 border-slate-800/60 opacity-40 cursor-not-allowed text-slate-500'
                      }\`}
                    >
                      <span className={\`text-[10px] font-bold mb-0.5 \${
                        isSelectionInSlip(awaySelection.id) ? 'text-slate-950' : 'text-slate-400'
                      }\`}>
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
          );`;

const regexMatchCard = /return \(\s*<div\s*key=\{match\.id\}[\s\S]*?<\/div>\s*\);\s*\}\)\}\s*<\/div>/;
content = content.replace(regexMatchCard, oldMatchCard + '\n        })}\n      </div>');

fs.writeFileSync('src/components/MatchList.tsx', content);
