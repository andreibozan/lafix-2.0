import { z } from 'zod';
export const requestSchema = z.object({
 contactName:z.string().trim().min(2).max(100),
 contactEmail:z.email().max(200),
 contactPhone:z.string().trim().min(8).max(25),
 category:z.enum(['Construcții','Renovări','Acoperișuri','Panouri solare','Încălzire','Ferestre și uși','Curățenie','Mutări','Reparații auto']),
 county:z.string().trim().min(2).max(80),
 locality:z.string().trim().min(2).max(80),
 description:z.string().trim().min(15).max(3000),
 budgetMin:z.number().int().nonnegative().optional(),
 budgetMax:z.number().int().nonnegative().optional()
}).refine(v=>v.budgetMin===undefined || v.budgetMax===undefined || v.budgetMin<=v.budgetMax,{message:'Buget invalid'});
