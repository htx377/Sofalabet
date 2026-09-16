import type { Request, Response } from 'express';
import { db } from '../db/store.ts';
import { MatchService } from '../services/matchService.ts';

export class MatchController {
  static async listMatches(req: Request, res: Response): Promise<void> {
    const { status, competitionId, category } = req.query;
    const matches = await MatchService.getAllMatches({
      status: typeof status === 'string' ? status : undefined,
      competitionId: typeof competitionId === 'string' ? competitionId : undefined,
      category: typeof category === 'string' ? category : undefined,
    });
    res.status(200).json({ matches });
  }

  static async getMatch(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const match = await MatchService.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Jogo não encontrado' });
      return;
    }
    res.status(200).json({ match });
  }

  static getCompetitions(req: Request, res: Response): void {
    res.status(200).json({ competitions: db.competitions });
  }

  static getTeams(req: Request, res: Response): void {
    res.status(200).json({ teams: db.teams });
  }
}
