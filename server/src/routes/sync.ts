import { Router } from 'express';
import { UserData } from '../models/UserData';

export const syncRouter = Router();

syncRouter.get('/:userId', async (req, res) => {
  const data = await UserData.findOne({ userId:req.params.userId }).lean();
  res.json(data ?? null);
});

syncRouter.put('/:userId', async (req, res) => {
  const data = await UserData.findOneAndUpdate(
    { userId:req.params.userId },
    { ...req.body, userId:req.params.userId },
    { upsert:true, new:true, runValidators:true }
  ).lean();
  res.json(data);
});
