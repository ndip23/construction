const mongoose = require('mongoose');
const Company = require('./apps/api/src/models/Company').default || require('./apps/api/src/models/Company');
const Service = require('./apps/api/src/models/Service').default || require('./apps/api/src/models/Service');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/buildhub').then(async () => {
  const c = await mongoose.connection.collection('companies').find({}).toArray();
  console.log("COMPANIES:");
  c.forEach(x => console.log(x.name, x.status, x._id));
  
  const s = await mongoose.connection.collection('services').find({}).toArray();
  console.log("\nSERVICES:");
  s.forEach(x => console.log(x.name, "company:", x.company, "isPublic:", x.isPublic));
  
  process.exit(0);
});
