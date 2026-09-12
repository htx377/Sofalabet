const fs = require('fs');
let content = fs.readFileSync('src/components/MatchList.tsx', 'utf8');

const replacement = `      </div>

      {/* Specific Competition Pills Filter (e.g. Maputo, Beira, Nampula) */}
      {selectedTier !== 'ALL' && visibleCompetitions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full py-1">
          <button
            onClick={() => setSelectedCompetition('all')}
            className={\`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all \${
              selectedCompetition === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-transparent border border-slate-800 text-slate-400 hover:bg-slate-800/80'
            }\`}
          >
            Todas de \${selectedTier === 'MOCAMBOLA' ? 'Moçambola' : selectedTier === 'PROVINCIAL' ? 'Provinciais' : 'Distritais'}
          </button>
          {visibleCompetitions.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedCompetition(comp.id)}
              className={\`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all \${
                selectedCompetition === comp.id
                  ? 'bg-slate-700 text-white'
                  : 'bg-transparent border border-slate-800 text-slate-400 hover:bg-slate-800/80'
              }\`}
            >
              {comp.name.replace('Campeonato Provincial de ', '').replace('Campeonato Distrital d', 'Distrito d')}
            </button>
          ))}
        </div>
      )}

      {/* 3. Section Title: Jogos de Hoje */}`;

content = content.replace('      </div>\n\n      {/* 3. Section Title: Jogos de Hoje */}', replacement);

fs.writeFileSync('src/components/MatchList.tsx', content);
