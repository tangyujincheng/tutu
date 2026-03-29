#!/bin/bash
set -e

# 部署到远程服务器
USER=root
HOST=14.103.60.103
PORT=22
KEY_FILE=~/.ssh/newjingacheng.pem
TARGET_DIR=/opt/bunny-letter-game

echo "===== 开始部署到 $HOST ====="

# 1. 创建目标目录
ssh -p $PORT -i "$KEY_FILE" $USER@$HOST "mkdir -p $TARGET_DIR"

# 2. 同步代码，排除不需要的文件
rsync -av -e "ssh -p $PORT -i $KEY_FILE" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='dev.db' \
  --exclude='*.log' \
  . \
  $USER@$HOST:$TARGET_DIR/

echo "✓ 文件同步完成"

# 3. 在远程服务器上安装依赖和初始化数据库
ssh -p $PORT -i "$KEY_FILE" $USER@$HOST "cd $TARGET_DIR && npm install && npx prisma generate --schema ./backend/prisma/schema.prisma"

echo "✓ 依赖安装完成"

# 4. 执行数据库迁移 (如果需要)
ssh -p $PORT -i "$KEY_FILE" $USER@$HOST "cd $TARGET_DIR && npx prisma migrate dev --name init --schema ./backend/prisma/schema.prisma || echo 'Migration might have already run, continuing...'"

echo "✓ 数据库检查完成"

# 5. 重启 PM2 服务
ssh -p $PORT -i "$KEY_FILE" $USER@$HOST "cd $TARGET_DIR && pm2 restart bunny-letter-game || pm2 start npm --name bunny-letter-game -- start"

echo "✓ PM2 服务已启动"

# 将 frontend 目录下的静态文件复制到目标根目录 (供 nginx 访问)
ssh -p $PORT -i "$KEY_FILE" $USER@$HOST "mkdir -p /var/www/bunny-letter-game && cp -f $TARGET_DIR/frontend/*.html /var/www/bunny-letter-game/ && cp -f $TARGET_DIR/frontend/*.css /var/www/bunny-letter-game/ && cp -f $TARGET_DIR/frontend/*.js /var/www/bunny-letter-game/ && cp -f $TARGET_DIR/*.gif /var/www/bunny-letter-game/ 2>/dev/null || true"

echo "✓ 静态文件已部署到 nginx 目录"

echo "===== 部署完成 ====="
echo "访问地址: http://$HOST/bunny-letter-game/"
echo "测试接口: POST http://$HOST/bunny-letter-game/api/test-ai"
