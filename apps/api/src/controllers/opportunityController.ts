import { Response } from 'express';
import Opportunity, { IOpportunity } from '../models/Opportunity';
import Company from '../models/Company';
import { runAllConnectors } from '../services/opportunityConnectors';
import {
  isConstructionRelated,
  guessCategory,
} from '../utils/constructionFilter';
import { computeMatchScore, matchReasons } from '../utils/matchScore';

type OppInput = Partial<IOpportunity>;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function upsertOpportunities(items: OppInput[]) {
  let ingested = 0;
  const bySource: Record<string, number> = {};

  for (const raw of items) {
    if (!raw.externalId || !raw.title) continue;

    const text = `${raw.title || ''} ${raw.description || ''} ${raw.category || ''}`;

    const item: OppInput = { ...raw };
    if (item.isConstruction === undefined) {
      item.isConstruction = isConstructionRelated(text);
    }
    if (!item.category) {
      item.category = guessCategory(text);
    }

    // Use (Opportunity as any) to bypass TypeScript strict typing
    await (Opportunity as any).updateOne(
      { externalId: item.externalId },
      { $set: item },
      { upsert: true }
    );

    ingested++;
    const src = item.source || 'Unknown';
    bySource[src] = (bySource[src] || 0) + 1;
  }

  return { ingested, bySource };
}

export const ingestOpportunities = async (req: any, res: Response) => {
  try {
    const items = await runAllConnectors();
    const { ingested, bySource } = await upsertOpportunities(items);
    res.status(200).json({ ingested, bySource });
  } catch (error: any) {
    console.error('❌ OPPORTUNITY INGEST ERROR:', error.message);
    res.status(500).json({ message: 'Failed to ingest opportunities' });
  }
};

export const getOpportunities = async (req: any, res: Response) => {
  try {
    const count = await Opportunity.estimatedDocumentCount();
    if (count === 0) {
      await upsertOpportunities(await runAllConnectors());
    }

    const { type, country, category, q, sector } = req.query;

    const filter: any = {};
    if (type) filter.type = type;
    if (sector) filter.sector = sector;
    if (country) filter.country = new RegExp(`^${escapeRegex(String(country))}$`, 'i');
    if (category) filter.category = new RegExp(`^${escapeRegex(String(category))}$`, 'i');
    if (q) {
      const rx = new RegExp(escapeRegex(String(q)), 'i');
      filter.$or = [{ title: rx }, { description: rx }];
    }

    let company: any = null;
    if (req.user?.companyId) {
      company = await Company.findById(req.user.companyId)
        .select('country city sector')
        .lean();
    }

    const now = new Date();
    const docs = await Opportunity.find(filter).limit(200).lean();

    const opportunities = docs
      .map((opp: any) => ({
        ...opp,
        matchScore: computeMatchScore(opp, company, now),
        matchReasons: matchReasons(opp, company, now),
      }))
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      });

    res.status(200).json({ opportunities, total: opportunities.length });
  } catch (error: any) {
    console.error('❌ OPPORTUNITY FETCH ERROR:', error.message);
    res.status(500).json({ message: 'Failed to load opportunities' });
  }
};