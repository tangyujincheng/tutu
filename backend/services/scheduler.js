const { PrismaClient } = require('@prisma/client');
const { generateBunnyInitiativeLetter } = require('./ai');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const TWO_HOURS = 2 * 60 * 60 * 1000; // 2小时 in milliseconds
let intervalId = null;

async function checkAndSendInitiativeLetter() {
  try {
    // 获取第一个用户（当前只有一个用户）
    const user = await prisma.user.findFirst();
    if (!user) {
      logger.debug('No user found, skipping initiative check');
      return;
    }

    // 获取最后一封信
    const lastLetter = await prisma.letter.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastLetter) {
      logger.debug('No letters found, skipping initiative check');
      return;
    }

    // 如果最后一封信已经是兔子发的，不处理
    if (lastLetter.sender === 'bunny') {
      logger.debug('Last letter is from bunny, skipping initiative check');
      return;
    }

    // 检查时间差是否超过2小时
    const now = new Date();
    const lastLetterTime = new Date(lastLetter.createdAt);
    const timeDiff = now.getTime() - lastLetterTime.getTime();

    if (timeDiff < TWO_HOURS) {
      logger.debug(`Time since last letter (${Math.round(timeDiff / 1000 / 60)} minutes) < 2 hours, skipping`);
      return;
    }

    // 超过2小时，兔子主动发信
    logger.info('Over 2 hours since last user letter, bunny will send initiative letter');
    const content = await generateBunnyInitiativeLetter();
    
    await prisma.letter.create({
      data: {
        content,
        sender: 'bunny',
        isRead: false,
        userId: user.id,
      }
    });

    logger.info('Initiative letter from bunny saved successfully');
  } catch (error) {
    logger.error('Error checking initiative letter', error);
  }
}

function startScheduler() {
  // 每分钟检查一次
  const CHECK_INTERVAL = 60 * 1000; // 1 minute
  intervalId = setInterval(checkAndSendInitiativeLetter, CHECK_INTERVAL);
  logger.info('Initiative letter scheduler started');
}

function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Initiative letter scheduler stopped');
  }
}

// 手动触发一次检查
function triggerCheck() {
  return checkAndSendInitiativeLetter();
}

module.exports = { startScheduler, stopScheduler, triggerCheck };
