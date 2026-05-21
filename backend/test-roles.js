import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { calculateExchangeRoles } from './src/services/roleService.js';
import SkillExchange from './src/models/SkillExchange.js';
dotenv.config();

async function verifyRoles() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const userA = 'usera@example.com';
  const userB = 'userb@example.com';
  
  await SkillExchange.deleteMany({ email: { $in: [userA, userB] } });
  
  await SkillExchange.create({ email: userA, name: 'A', skillOffered: 'React', skillWanted: 'Node.js' });
  await SkillExchange.create({ email: userB, name: 'B', skillOffered: 'Node.js', skillWanted: 'React' });
  
  const roles = await calculateExchangeRoles(userA, userB);
  console.log(JSON.stringify(roles, null, 2));

  await SkillExchange.deleteMany({ email: { $in: [userA, userB] } });
  console.log('Cleanup complete');
  process.exit(0);
}

verifyRoles().catch(console.error);
