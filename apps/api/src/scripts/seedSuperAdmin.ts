/**
 * Provision the platform superadmin. This is the ONLY way a superadmin account
 * is ever created — it can never be made through the public /auth/register
 * endpoint (which is hard-locked to role 'owner').
 *
 * Usage:
 *   1. Add to apps/api/.env:
 *        SUPERADMIN_EMAIL=you@buildhub.com
 *        SUPERADMIN_PASSWORD=a-long-strong-password
 *        SUPERADMIN_NAME=Platform Owner   (optional)
 *   2. Run:  yarn seed:superadmin
 *
 * Re-running is safe: it upserts (resets the password + role on an existing
 * account with that email).
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

dotenv.config();

const run = async () => {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME?.trim() || 'Platform Owner';
  const uri = process.env.MONGO_URI;

  if (!uri) { console.error('❌ MONGO_URI missing in .env'); process.exit(1); }
  if (!email || !password) {
    console.error('❌ Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env first.');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('❌ SUPERADMIN_PASSWORD must be at least 10 characters.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const hashed = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.set({ name, password: hashed, role: 'superadmin' });
    await existing.save();
    console.log(`✅ Updated existing account → superadmin: ${email}`);
  } else {
    await User.create({ name, email, password: hashed, role: 'superadmin' });
    console.log(`✅ Created superadmin: ${email}`);
  }

  await mongoose.disconnect();
  console.log('Done. Log in at /login with the email + password above.');
  process.exit(0);
};

run().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
