// server.js

import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 IAMLECON Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});

