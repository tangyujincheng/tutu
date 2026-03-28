const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../utils/crypto');
const { getAIConfig } = require('../services/ai');
const { triggerCheck } = require('../services/scheduler');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// 遮罩API密钥，只显示前后各4位
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length <= 8) return '****';
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}

// GET /api/admin/config - 获取当前配置（返回遮罩后的apiKey）
router.get('/config', async (req, res) => {
  try {
    const config = await getAIConfig();
    const { decrypt } = require('../utils/crypto');
    const apiKey = decrypt(config.apiKeyEncrypted);
    
    res.json({
      success: true,
      config: {
        apiUrl: config.apiUrl,
        apiKey: maskApiKey(apiKey),
        modelId: config.modelId,
        systemPrompt: config.systemPrompt,
      }
    });
  } catch (error) {
    logger.error('Failed to get admin config', error);
    res.status(500).json({ success: false, error: 'Failed to get config' });
  }
});

// POST /api/admin/config - 更新配置
router.post('/config', async (req, res) => {
  try {
    const { apiUrl, apiKey, modelId, systemPrompt } = req.body;
    
    // 获取现有配置
    let config = await getAIConfig();
    const { decrypt } = require('../utils/crypto');
    const existingApiKey = decrypt(config.apiKeyEncrypted);
    
    // 如果用户输入的是遮罩后的内容，保留原API密钥
    const finalApiKey = apiKey.includes('...') ? existingApiKey : apiKey;
    
    const updatedConfig = await prisma.aIConfig.update({
      where: { id: config.id },
      data: {
        apiUrl,
        apiKeyEncrypted: encrypt(finalApiKey),
        modelId,
        systemPrompt,
      }
    });
    
    logger.info('AI config updated successfully');
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update admin config', error);
    res.status(500).json({ success: false, error: 'Failed to update config' });
  }
});

// POST /api/admin/trigger-bunny-letter - 手动触发小兔子主动发信
router.post('/trigger-bunny-letter', async (req, res) => {
  try {
    await triggerCheck();
    res.json({ success: true, message: 'Check completed' });
  } catch (error) {
    logger.error('Failed to trigger bunny letter', error);
    res.status(500).json({ success: false, error: 'Failed to trigger' });
  }
});

module.exports = router;
