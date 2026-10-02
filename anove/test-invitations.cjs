// Run in the built image with an isolated PostgreSQL database. Never use production.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.DISABLE_REGISTRATION = 'true';
process.env.FRONTEND_URL = 'https://invitation-test.invalid';
delete process.env.STRIPE_PUBLISHABLE_KEY;
const { PrismaClient } = require('@prisma/client');
const base = '/app/apps/backend/dist/';
const { AuthService } = require(base+'apps/backend/src/services/auth/auth.service');
const { AuthController } = require(base+'apps/backend/src/api/routes/auth.controller');
const { AuthService: Tokens } = require(base+'libraries/helpers/src/auth/auth.service');
const { OrganizationRepository } = require(base+'libraries/nestjs-libraries/src/database/prisma/organizations/organization.repository');
const { OrganizationService } = require(base+'libraries/nestjs-libraries/src/database/prisma/organizations/organization.service');
const { CreateOrgUserDto } = require(base+'libraries/nestjs-libraries/src/dtos/auth/create.org.user.dto');
const { LoginUserDto } = require(base+'libraries/nestjs-libraries/src/dtos/auth/login.user.dto');
const { NewsletterService } = require(base+'libraries/nestjs-libraries/src/newsletter/newsletter.service');
NewsletterService.register = async () => {};
const db = new PrismaClient();
const sent = [];
const email = { hasProvider:()=>true, hasEmailProvider:()=>true, sendEmail:async (...args)=>sent.push(args) };
const repo = new OrganizationRepository({model:db},{model:db},{model:db},{model:db});
const organizations = new OrganizationService(repo,email);
const users = {
  getUserByEmail: email=>db.user.findFirst({where:{email:{equals:email,mode:'insensitive'},providerName:'LOCAL',deletedAt:null}}),
  activateUser: id=>db.user.update({where:{id},data:{activated:true}}),
  updatePassword: (id,password)=>db.user.update({where:{id},data:{password:Tokens.hashPassword(password)}}),
};
const auth = new AuthService(users,organizations,email,email,{});
const controller = new AuthController(auth,email);
const future=()=>new Date(Date.now()+86400000).toISOString();
const password='Test-only-password-492!';
const dto=email=>Object.assign(new CreateOrgUserDto(),{email,password,company:'Ignored company',provider:'LOCAL',providerToken:''});
const login=email=>Object.assign(new LoginUserDto(),{email,password,provider:'LOCAL',providerToken:''});
async function main(){
  assert.match(process.env.DATABASE_URL, /invitation_test/, 'Tests require an isolated invitation_test database');
  const org=await db.organization.create({data:{name:'Invitation test'}});
  const invite=(extra={})=>({email:'new@example.invalid',orgId:org.id,id:crypto.randomUUID(),role:'USER',timeLimit:future(),...extra});
  const sign=v=>Tokens.signJWT(v);
  assert.equal(await auth.canRegister('LOCAL'),false);
  assert.deepEqual(await controller.canRegister({cookies:{}}),{register:false});
  await assert.rejects(auth.routeAuth('LOCAL',dto('public@example.invalid'),'','',false),/disabled/);
  for(const bad of [invite({timeLimit:'invalid'}),invite({timeLimit:new Date(0).toISOString()}),invite({role:'SUPERADMIN'}),{id:'session',email:'new@example.invalid'},invite({email:''})]){
    assert.equal(await auth.getInvitation(sign(bad)),false);
  }
  const raw=invite();const token=sign(raw);
  assert.equal(await auth.getInvitation(token+'broken'),false);
  assert.equal(await auth.getInvitation(sign(invite({orgId:crypto.randomUUID()}))),false);
  const permission=await controller.canRegister({cookies:{org:token}});
  assert.equal(permission.register,true);assert.equal(permission.invitation.email,raw.email);
  const valid=await auth.getInvitation(token);
  await assert.rejects(auth.routeAuth('LOCAL',dto('wrong@example.invalid'),'','',valid),/email address/);
  await assert.rejects(auth.routeAuth('GENERIC',dto(raw.email),'','',valid),/email and password/);
  await assert.rejects(auth.routeAuth('LOCAL',Object.assign(dto(raw.email),{password:'short'}),'','',valid),/12 characters/);
  const response=await auth.routeAuth('LOCAL',dto(raw.email.toUpperCase()),'127.0.0.1','test',valid);
  assert.equal(response.addedOrg.organizationId,org.id);
  assert.equal(response.addedOrg.role,'USER');
  assert.equal(await db.organization.count(),1,'Invitation must not create another workspace');
  assert.equal(await db.user.count(),1);
  assert.equal(await auth.getInvitation(token),false,'Invitation must be consumed');
  await assert.rejects(organizations.acceptInvitation(valid,{email:raw.email,password}),/already been used/);
  await assert.rejects(auth.routeAuth('LOCAL',login(raw.email),'','',false),/not activated/);
  await auth.activate(response.jwt,'');
  assert.ok((await auth.routeAuth('LOCAL',login(raw.email),'','',false)).jwt);
  const before=sent.length;await auth.forgot(raw.email);assert.equal(sent.length,before+1);
  const resetToken=sent.at(-1)[2].match(/\/auth\/forgot\/([^"<]+)/)[1];
  assert.ok(await auth.forgotReturn({token:resetToken,password:'Changed-test-password!'}));
  assert.ok((await auth.routeAuth('LOCAL',Object.assign(login(raw.email),{password:'Changed-test-password!'}),'','',false)).jwt);
  const pending=invite({email:'pending@example.invalid'});
  const pendingUser=await auth.routeAuth('LOCAL',dto(pending.email),'','',await auth.getInvitation(sign(pending)));
  await auth.resendActivationEmail(pending.email);
  assert.match(sent.at(-1)[1],/Activate/);
  const concurrent=invite({email:'race@example.invalid'});
  const results=await Promise.allSettled([1,2].map(()=>organizations.acceptInvitation(concurrent,{email:concurrent.email,password})));
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1,'Concurrent acceptance must be single-use');
  assert.equal(await db.user.count({where:{email:concurrent.email}}),1);
  const other=await db.organization.create({data:{name:'Second workspace'}});
  const existing=invite({orgId:other.id,email:raw.email,role:'ADMIN'});
  const joined=await auth.routeAuth('LOCAL',Object.assign(login(raw.email),{password:'Changed-test-password!'}),'','',await auth.getInvitation(sign(existing)));
  assert.equal(joined.addedOrg.role,'ADMIN');
  assert.equal(await auth.getInvitation(sign(existing)),false);
  const invalidRole=await db.userOrganization.findMany({where:{role:'SUPERADMIN'}});assert.equal(invalidRole.length,0);
  console.log('PASS: closed signup, signed/email-bound/expiring invitations, USER/ADMIN roles, no extra workspace, activation, resend, login, password reset, replay and concurrent acceptance');
}
main().finally(()=>db.$disconnect()).catch(e=>{console.error(e);process.exitCode=1});
