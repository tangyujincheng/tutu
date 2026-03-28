require('dotenv').config();
const app = require('./backend/app');
const logger = require('./backend/utils/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Frontend: http://localhost:${PORT}`);
  logger.info(`Admin config: http://localhost:${PORT}/admin`);
});
