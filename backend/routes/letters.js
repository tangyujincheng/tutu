const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generateReply } = require('../services/ai');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// 获取当前用户ID（固定第一个用户）
async function getCurrentUserId() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Master'
      }
    });
    logger.info('Initialized default user');
  }
  return user.id;
}

// GET /api/letters - 获取所有信件
router.get('/', async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    const letters = await prisma.letter.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, letters });
  } catch (error) {
    logger.error('Failed to get letters', error);
    res.status(500).json({ success: false, error: 'Failed to get letters' });
  }
});

// POST /api/letters - 用户写信，保存并触发AI回信
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const userId = await getCurrentUserId();
    
    // 保存用户信件
    await prisma.letter.create({
      data: {
        content: content.trim(),
        sender: 'user',
        isRead: true,
        userId,
      }
    });

    // 生成AI回信
    const aiReply = await generateReply(content.trim());
    
    // 保存兔子回信
    const bunnyReply = await prisma.letter.create({
      data: {
        content: aiReply,
        sender: 'bunny',
        isRead: false,
        userId,
      }
    });

    logger.info(`User letter saved, AI reply generated: ${bunnyReply.id}`);
    res.json({ success: true, bunnyReply });
  } catch (error) {
    logger.error('Failed to process letter', error);
    res.status(500).json({ success: false, error: 'Failed to process letter' });
  }
});

// POST /api/letters/generate - 直接生成测试回信（不保存到数据库）
router.post('/generate', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    // 只生成AI回信，不保存
    const aiReply = await generateReply(content.trim());
    logger.info('Test AI reply generated successfully');
    res.json({ success: true, response: aiReply });
  } catch (error) {
    logger.error('Failed to generate test reply', error);
    res.status(500).json({ success: false, error: 'Failed to generate reply: ' + error.message });
  }
});

// GET /api/letters/unread-count - 获取未读数量
router.get('/unread-count', async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    const count = await prisma.letter.count({
      where: {
        userId,
        sender: 'bunny',
        isRead: false,
      }
    });
    res.json({ success: true, count });
  } catch (error) {
    logger.error('Failed to get unread count', error);
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
});

// POST /api/letters/:id/mark-read - 标记已读
router.post('/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.letter.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark as read', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

// GET /api/prompt-public - 获取公开prompt信息（不包含敏感信息）
router.get('/prompt-public', async (req, res) => {
  try {
    const { getAIConfig } = require('../services/ai');
    const config = await getAIConfig();
    res.json({ success: true, systemPrompt: config.systemPrompt });
  } catch (error) {
    logger.error('Failed to get prompt', error);
    res.status(500).json({ success: false, error: 'Failed to get prompt' });
  }
});

// GET/POST /api/letters/check-active - 检查是否需要主动发信（前端触发）
router.route('/check-active')
  .get(async (req, res) => {
  try {
    const { triggerCheck } = require('../services/scheduler');
    const generated = await triggerCheck();
    res.json({ success: true, generated });
  } catch (error) {
    logger.error('Failed to check active', error);
    res.status(500).json({ success: false, error: 'Failed to check active' });
  }
})
  .post(async (req, res) => {
    try {
      const { triggerCheck } = require('../services/scheduler');
      const generated = await triggerCheck();
      res.json({ success: true, generated });
    } catch (error) {
      logger.error('Failed to check active', error);
      res.status(500).json({ success: false, error: 'Failed to check active' });
    }
  });

// POST /api/letters/:id/read - 标记为已读（兼容前端旧写法）
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = await getCurrentUserId();
    await prisma.letter.update({
      where: { 
        id: parseInt(id),
        userId
      },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark as read', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

module.exports = router;
