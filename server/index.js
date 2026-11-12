// Optional Node/Express/MongoDB API starter. The published static portfolio uses browser storage.
import express from 'express';
import mongoose from 'mongoose';
const app=express();app.disable('x-powered-by');app.use(express.json({limit:'16kb'}));
const campaignSchema=new mongoose.Schema({name:{type:String,required:true,maxLength:45},title:{type:String,required:true,maxLength:80},desc:{type:String,required:true,maxLength:1500},category:{type:String,enum:['Climate','Education','Technology'],required:true},goal:{type:Number,min:1,max:100000000,required:true}},{timestamps:true});
const Campaign=mongoose.model('Campaign',campaignSchema);
app.get('/api/health',(_req,res)=>res.json({status:'ok',database:mongoose.connection.readyState===1?'connected':'disconnected'}));
app.get('/api/campaigns',async(_req,res,next)=>{try{res.json(await Campaign.find().sort({createdAt:-1}).limit(100).lean())}catch(e){next(e)}});
// Authoring deliberately disabled without explicit opt-in: add real authentication before production.
app.post('/api/campaigns',async(req,res,next)=>{if(process.env.ENABLE_LOCAL_AUTHORING!=='true')return res.status(403).json({error:'Authoring disabled. Configure authentication before production.'});try{let{name,title,desc,category,goal}=req.body;const c=await Campaign.create({name,title,desc,category,goal});res.status(201).json(c)}catch(e){next(e)}});
app.use(express.static('dist'));
app.use((err,req,res,next)=>res.status(err.name==='ValidationError'?400:500).json({error:err.name==='ValidationError'?'Invalid campaign fields':'Request could not be completed'}));
if(!process.env.MONGODB_URI)throw new Error('Set MONGODB_URI to your own MongoDB connection string.');
await mongoose.connect(process.env.MONGODB_URI);app.listen(process.env.PORT||3000,()=>console.log('RaiseFlow server ready'));
