import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabase } from '../lib/supabase.ts';
import { Match, Bet } from '../types.ts';
import { useAuth } from './AuthContext.tsx';

interface RealtimeContextType {
  isLiveConnected: boolean;
  lastEventTime: number | null;
  latestUpdatedMatchId: string | null;
  latestUpdatedBetId: string | null;
  // Subscribers callback registration
  onMatchChange: (handler: (match: Match, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) => () => void;
  onBetChange: (handler: (bet: Bet, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, refreshUserData } = useAuth();
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<number | null>(null);
  const [latestUpdatedMatchId, setLatestUpdatedMatchId] = useState<string | null>(null);
  const [latestUpdatedBetId, setLatestUpdatedBetId] = useState<string | null>(null);

  // Subscribed callbacks
  const matchHandlers = React.useRef<Set<(match: Match, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void>>(new Set());
  const betHandlers = React.useRef<Set<(bet: Bet, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void>>(new Set());

  const onMatchChange = (handler: (match: Match, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) => {
    matchHandlers.current.add(handler);
    return () => {
      matchHandlers.current.delete(handler);
    };
  };

  const onBetChange = (handler: (bet: Bet, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) => {
    betHandlers.current.add(handler);
    return () => {
      betHandlers.current.delete(handler);
    };
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLiveConnected(false);
      return;
    }

    // Helper to transform Supabase matches row to Match interface
    const transformSupabaseMatch = (row: any): Match => ({
      id: row.id,
      competitionId: row.competition_id || '',
      competitionName: row.competition_name,
      competitionCategory: row.competition_category,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      kickoffDate: row.kickoff_date,
      kickoffTime: row.kickoff_time,
      status: row.status,
      homeScore: row.home_score,
      awayScore: row.away_score,
      markets: Array.isArray(row.markets) ? row.markets : [],
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    });

    // Helper to transform Supabase bets row to Bet interface
    const transformSupabaseBet = (row: any): Bet => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name || 'Apostador SofalaBet',
      userEmail: row.user_email || '',
      type: row.type || 'SINGLE',
      stake: Number(row.stake || 0),
      totalOdds: Number(row.total_odds || 1),
      potentialReturn: Number(row.potential_win || 0),
      status: row.status || 'PENDING',
      items: Array.isArray(row.selections) ? row.selections : [],
      settledAt: row.settled_at || null,
      createdAt: row.placed_at || new Date().toISOString(),
    });

    const channelName = `sofalabet-realtime-${Date.now()}`;
    const channel = supabase.channel(channelName);

    // 1. Escutar alterações em tempo real na tabela de jogos (matches)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches' },
      (payload) => {
        console.log('[Supabase Realtime] Evento na tabela matches:', payload.eventType, payload.new);
        setLastEventTime(Date.now());
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const rawMatch = (eventType === 'DELETE' ? payload.old : payload.new) as any;
        if (!rawMatch || !rawMatch.id) return;

        const matchObj = transformSupabaseMatch(rawMatch);
        setLatestUpdatedMatchId(matchObj.id);

        // Disparar handlers registados
        matchHandlers.current.forEach((handler) => {
          try {
            handler(matchObj, eventType);
          } catch (e) {
            console.error('[Supabase Realtime] Erro no handler de matches:', e);
          }
        });
      }
    );

    // 2. Escutar alterações em tempo real na tabela de apostas (bets)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bets' },
      (payload) => {
        console.log('[Supabase Realtime] Evento na tabela bets:', payload.eventType, payload.new);
        setLastEventTime(Date.now());
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const rawBet = (eventType === 'DELETE' ? payload.old : payload.new) as any;
        if (!rawBet || !rawBet.id) return;

        const betObj = transformSupabaseBet(rawBet);
        setLatestUpdatedBetId(betObj.id);

        // Se a aposta pertencer ao utilizador logado e tiver sido liquidada, atualizar dados de utilizador/saldo
        if (user && rawBet.user_id === user.id) {
          refreshUserData().catch(console.error);
        }

        // Disparar handlers registados
        betHandlers.current.forEach((handler) => {
          try {
            handler(betObj, eventType);
          } catch (e) {
            console.error('[Supabase Realtime] Erro no handler de bets:', e);
          }
        });
      }
    );

    // 3. Escutar alterações de saldo na tabela de carteiras (wallets) para o utilizador
    if (user) {
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('[Supabase Realtime] Evento na carteira do utilizador:', payload.new);
          setLastEventTime(Date.now());
          refreshUserData().catch(console.error);
        }
      );
    }

    channel.subscribe((status) => {
      console.log('[Supabase Realtime] Estado da subscrição:', status);
      if (status === 'SUBSCRIBED') {
        setIsLiveConnected(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsLiveConnected(false);
      }
    });

    return () => {
      console.log('[Supabase Realtime] Desmontando canal...');
      channel.unsubscribe();
      supabase.removeChannel(channel);
      setIsLiveConnected(false);
    };
  }, [user?.id]);

  return (
    <RealtimeContext.Provider
      value={{
        isLiveConnected,
        lastEventTime,
        latestUpdatedMatchId,
        latestUpdatedBetId,
        onMatchChange,
        onBetChange,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
