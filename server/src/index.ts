import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { syncRouter } from './routes/sync';

async function main(){
  if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI não configurada');
  await mongoose.connect(process.env.MONGODB_URI);
  const app=express();
  app.use(cors()); app.use(express.json({limit:'2mb'}));
  app.get('/health',(_req,res)=>res.json({ok:true}));
  app.use('/api/sync',syncRouter);
  const port=Number(process.env.PORT||4000);
  app.listen(port,()=>console.log(`API em http://localhost:${port}`));
}
main().catch(err=>{console.error(err);process.exit(1)});
