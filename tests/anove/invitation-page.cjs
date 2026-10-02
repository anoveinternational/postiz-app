const assert=require('node:assert/strict');
const http=require('node:http');
const {spawn}=require('node:child_process');
process.env.JWT_SECRET=require('node:crypto').randomBytes(32).toString('hex');
process.env.DISABLE_REGISTRATION='true';
process.env.FRONTEND_URL='http://127.0.0.1:4200';
process.env.MAIN_URL=process.env.FRONTEND_URL;
process.env.BACKEND_INTERNAL_URL='http://127.0.0.1:3010';
process.env.NEXT_PUBLIC_BACKEND_URL='http://127.0.0.1:3010';
process.env.IS_GENERAL='true';
const base='/app/apps/backend/dist/';
const {AuthService}=require(base+'apps/backend/src/services/auth/auth.service');
const {AuthController}=require(base+'apps/backend/src/api/routes/auth.controller');
const {AuthService:Tokens}=require(base+'libraries/helpers/src/auth/auth.service');
const auth=new AuthService({}, {getCount:async()=>1,getInvitationOrganization:async()=>({name:'Anove Test'})},{},{},{});
const controller=new AuthController(auth,{});
const server=http.createServer(async(req,res)=>{
 try {const value=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('org='));const cookie=value?{org:decodeURIComponent(value.slice(4))}:{};const answer=await controller.canRegister({cookies:cookie});res.setHeader('content-type','application/json');res.end(JSON.stringify(answer));}catch{res.statusCode=500;res.end('{}');}
});
let frontend;
async function main(){
 await new Promise(r=>server.listen(3010,'127.0.0.1',r));
 frontend=spawn(process.execPath,['/app/node_modules/next/dist/bin/next','start','-p','4200'],{cwd:'/app/apps/frontend',env:process.env,stdio:'ignore'});
 let ready=false;for(let i=0;i<45;i++){try{await fetch('http://127.0.0.1:4200/auth/login');ready=true;break;}catch{await new Promise(r=>setTimeout(r,1000));}}assert.ok(ready,'Frontend should start');
 const page=async(cookie)=>{const r=await fetch('http://127.0.0.1:4200/auth',{headers:cookie?{cookie}:undefined});assert.equal(r.status,200);return r.text()};
 assert.match(await page(),/Anove Social is invitation-only/);
 assert.doesNotMatch(await page(),/Create account and join/);
 const token=Tokens.signJWT({email:'invited@example.invalid',orgId:'test-org',id:'test-invite',role:'USER',timeLimit:new Date(Date.now()+86400000).toISOString()});
 const link=await fetch('http://127.0.0.1:4200/auth?org='+token,{redirect:'manual'});
 assert.equal(link.status,307);assert.match(link.headers.get('set-cookie'),/^org=/);
 const accepted=await page('org='+token);assert.match(accepted,/Join <!-- -->Anove Test/);assert.match(accepted,/invited@example.invalid/);assert.match(accepted,/Create account and join/);assert.match(accepted,/readonly=""/i);
 assert.match(await page('org=invalid'),/invitation has expired/);
 const expired=Tokens.signJWT({email:'invited@example.invalid',orgId:'test-org',id:'test-invite',role:'USER',timeLimit:new Date(0).toISOString()});
 assert.match(await page('org='+expired),/invitation has expired/);
 console.log('PASS: Next.js invitation redirect/cookie, backend forwarding, email-locked signup form, anonymous/invalid/expired links blocked');
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{frontend?.kill();server.close()});
