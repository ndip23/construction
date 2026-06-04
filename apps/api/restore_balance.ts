import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './src/models/User';
import Company from './src/models/Company';

mongoose.connect(process.env.MONGO_URI as string).then(async () => {
  try {
    const user = await User.findOne({ email: 'adoxop1@gmail.com' });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    const company = await Company.findOne({ owner: user._id });
    if (!company) {
      console.log('Company not found');
      process.exit(1);
    }
    
    // Fix history record logic if needed, but for now just reset the balance
    company.walletBalance = 50;
    
    await company.save();
    console.log('Restored wallet balance to 50 USD for ' + user.email);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
