const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/p2p-rental')
  .then(async () => {
    console.log('Connected');
    const db = mongoose.connection.db;
    
    // Clear empty phone numbers
    const res = await db.collection('users').updateMany({ phoneNumber: '' }, { $unset: { phoneNumber: 1 } });
    console.log('Cleared empty phone numbers:', res.modifiedCount);
    
    // Check and drop old phoneNumber index if it exists and might cause issues
    try {
      await db.collection('users').dropIndex('phoneNumber_1');
      console.log('Dropped old phoneNumber index');
    } catch(e) {
      console.log('Index phoneNumber_1 not found or could not drop');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
