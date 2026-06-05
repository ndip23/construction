import { Response } from 'express';
import Project from '../models/Project';
import BOQ from '../models/BOQ';
import PriceFeedback from '../models/PriceFeedback';

/**
 * @desc    Company-wide analytics overview (BOQ value, verification, budgets, AI adoption)
 * @route   GET /api/v1/analytics/overview
 */
export const getOverview = async (req: any, res: Response) => {
  try {
    const companyId = req.user.companyId;

    const [projects, boqs, feedback] = await Promise.all([
      Project.find({ company: companyId } as any).lean(),
      BOQ.find({ company: companyId } as any).lean(),
      PriceFeedback.find({ company: companyId } as any).lean(),
    ]);

    // --- Projects by status + budgets ---
    const byStatus: Record<string, number> = {
      Planning: 0, 'In Progress': 0, Completed: 0, 'On Hold': 0,
    };
    let totalBudget = 0;
    let totalSpent = 0;
    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      totalBudget += p.budget || 0;
      totalSpent += p.spent || 0;
    }

    // --- BOQ value + item breakdown ---
    let totalValue = 0, verifiedValue = 0, pendingValue = 0;
    let itemsTotal = 0, itemsVerified = 0, itemsPending = 0, itemsRejected = 0;
    const sources: Record<string, number> = { user: 0, marketplace: 0, ai: 0 };
    const boqValueByProject: Record<string, number> = {};

    for (const b of boqs) {
      totalValue += b.totalAmount || 0;
      boqValueByProject[String(b.project)] = (boqValueByProject[String(b.project)] || 0) + (b.totalAmount || 0);
      for (const it of (b.items || [])) {
        itemsTotal++;
        const line = (it.qty || 0) * (it.rate || 0);
        if (it.status === 'verified') { itemsVerified++; verifiedValue += line; }
        else if (it.status === 'rejected') { itemsRejected++; }
        else { itemsPending++; pendingValue += line; }
        sources[it.source] = (sources[it.source] || 0) + 1;
      }
    }

    // --- Top projects by BOQ value (for the bar chart) ---
    const topProjects = projects
      .map((p: any) => ({
        name: p.name,
        budget: p.budget || 0,
        spent: p.spent || 0,
        utilization: p.budget ? (p.spent || 0) / p.budget : 0,
        boqValue: boqValueByProject[String(p._id)] || 0,
      }))
      .sort((a, b) => b.boqValue - a.boqValue)
      .slice(0, 6);

    // --- Learning loop: AI suggestion feedback ---
    const fbCounts: Record<string, number> = { accepted: 0, edited: 0, rejected: 0 };
    let accuracySum = 0, accuracyN = 0;
    for (const f of feedback) {
      fbCounts[f.action] = (fbCounts[f.action] || 0) + 1;
      // Accuracy = how close the AI was, for accepted/edited (rejected has no final rate)
      if (f.action !== 'rejected') {
        accuracySum += Math.abs(f.deltaPct || 0);
        accuracyN++;
      }
    }
    const totalFb = feedback.length;
    const learning = {
      total: totalFb,
      accepted: fbCounts.accepted,
      edited: fbCounts.edited,
      rejected: fbCounts.rejected,
      // Share accepted as-is (no edit)
      acceptRate: totalFb ? fbCounts.accepted / totalFb : 0,
      // Avg AI accuracy: 1 - mean absolute deviation between suggested and final
      accuracy: accuracyN ? Math.max(0, 1 - accuracySum / accuracyN) : null,
    };

    res.status(200).json({
      learning,
      projects: { total: projects.length, byStatus },
      budget: {
        total: totalBudget,
        spent: totalSpent,
        utilization: totalBudget ? totalSpent / totalBudget : 0,
      },
      boq: {
        totalValue,
        verifiedValue,
        pendingValue,
        itemsTotal,
        itemsVerified,
        itemsPending,
        itemsRejected,
        verificationRate: itemsTotal ? itemsVerified / itemsTotal : 0,
      },
      sources,
      aiAdoptionRate: itemsTotal ? (sources.ai || 0) / itemsTotal : 0,
      topProjects,
    });
  } catch (error: any) {
    console.error('❌ ANALYTICS ERROR:', error.message);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
};