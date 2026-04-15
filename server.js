const expireOldRequests = require('./services/expireRequests');
const app = require('./src/app');
require('dotenv').config();

// ✅ हे add करा

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // ✅ Server start होताच एकदा run करा
  expireOldRequests();
  
  // ✅ दर 1 मिनिटाला check करा
  setInterval(expireOldRequests, 60 * 1000);
});