require('dotenv').config();
const app = require('./backend/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🐰 Bunny Letter Game server running on port ${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   Admin config: http://localhost:${PORT}/admin.html`);
});
