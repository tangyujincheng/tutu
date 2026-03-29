const { PrismaClient } = require('@prisma/client');
const { decrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

async function getAIConfig() {
  let config = await prisma.aIConfig.findFirst();
  if (!config) {
    // 使用默认配置初始化
    const defaultApiUrl = process.env.DEFAULT_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const defaultApiKey = process.env.DEFAULT_API_KEY || '24590a27-89c2-4cb2-b302-b3355dada1d7';
    const defaultModelId = process.env.DEFAULT_MODEL_ID || 'doubao-seed-2.0';
    const defaultPrompt = `你现在是一只可爱软萌的小兔子，住在兔兔信件小屋里。你正在和你的主人通信。
请根据主人的来信，写一封简短可爱的回信。
要求：
1. 保持可爱的语气，使用小兔子的身份说话
2. 可以适当使用emoji，但不要太多
3. 回信要简短自然，像聊天一样
4. 内容要温暖治愈，回应主人的情绪`;
    
    const { encrypt } = require('../utils/crypto');
    config = await prisma.aIConfig.create({
      data: {
        apiUrl: defaultApiUrl,
        apiKeyEncrypted: encrypt(defaultApiKey),
        modelId: defaultModelId,
        systemPrompt: defaultPrompt,
      }
    });
    logger.info('Initialized default AI config');
  }
  return config;
}

async function generateReply(userMessage, customPrompt = null) {
  const config = await getAIConfig();
  const apiKey = decrypt(config.apiKeyEncrypted);
  const systemPrompt = customPrompt || config.systemPrompt;
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
  
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`AI API error: ${response.status}`, errorText);
      throw new Error(`AI API call failed: ${response.status}`);
    }
    
    const data = await response.json();
    const reply = data.choices[0].message.content.trim();
    logger.info('AI reply generated successfully');
    return reply;
  } catch (error) {
    logger.error('Failed to generate AI reply', error);
    throw error;
  }
}

async function generateBunnyInitiativeLetter() {
  const config = await getAIConfig();
  const apiKey = decrypt(config.apiKeyEncrypted);
  
  const prompt = `你现在是一只可爱软萌的小兔子，住在兔兔信件小屋里。你已经很久没有收到主人的来信了，你想念主人，想主动给主人写一封信。
要求：
1. 表达对主人的想念
2. 语气要可爱软萌，可以适当使用emoji
3. 内容简短自然，问问主人最近在做什么
4. 温暖治愈`;
  
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 300
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`AI API error: ${response.status}`, errorText);
      throw new Error(`AI API call failed: ${response.status}`);
    }
    
    const data = await response.json();
    const reply = data.choices[0].message.content.trim();
    logger.info('Bunny initiative letter generated successfully');
    return reply;
  } catch (error) {
    logger.error('Failed to generate initiative letter', error);
    throw error;
  }
}

module.exports = { generateReply, generateBunnyInitiativeLetter, getAIConfig };
