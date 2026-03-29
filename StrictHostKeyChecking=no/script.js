// 状态管理
let gameState = {
    letters: [],
    isSending: false, // 防重复发送标记
    unreadCount: 0
};

// DOM 元素
const mailBtn = document.getElementById('mailBtn');
const writeBtn = document.getElementById('writeBtn');
const unreadBadge = document.getElementById('unreadBadge');
const mailModal = document.getElementById('mailModal');
const writeModal = document.getElementById('writeModal');
const closeMailBtn = document.getElementById('closeMailBtn');
const closeWriteBtn = document.getElementById('closeWriteBtn');
const mailContent = document.getElementById('mailContent');
const replyInput = document.getElementById('replyInput');
const sendBtn = document.getElementById('sendBtn');
const bunny = document.getElementById('bunny');
const bunnyContainer = document.getElementById('bunnyContainer');
const toast = document.getElementById('toast');

// API 基础路径（适应子目录部署）
const API_BASE = '/bunny-letter-game';


// 初始化
async function init() {
    setupEventListeners();
    await loadLetters();
    await checkUnreadCount();
    // 前端页面加载时触发主动发信检查，确保及时生成
    await checkInitiativeLetter();
}

// 加载所有信件
async function loadLetters() {
    try {
        const res = await fetch(`${API_BASE}/api/letters`);
        const data = await res.json();
        if (data.success) {
            gameState.letters = data.letters;
        }
    } catch (error) {
        console.error('Failed to load letters:', error);
        showToast('加载信件失败');
    }
}

// 检查未读数量
async function checkUnreadCount() {
    try {
        const res = await fetch(`${API_BASE}/api/letters/unread-count`);
        const data = await res.json();
        if (data.success) {
            gameState.unreadCount = data.count;
            updateUnreadBadge();
        }
    } catch (error) {
        console.error('Failed to check unread count:', error);
    }
}

// 更新未读提示
function updateUnreadBadge() {
    if (gameState.unreadCount > 0) {
        unreadBadge.classList.add('show');
    } else {
        unreadBadge.classList.remove('show');
    }
}

// 检查是否需要主动发信
async function checkInitiativeLetter() {
    try {
        await fetch(`${API_BASE}/api/letters/check-active`);
        await loadLetters();
        await checkUnreadCount();
    } catch (error) {
        console.error('Failed to check initiative letter:', error);
    }
}

// 设置事件监听
function setupEventListeners() {
    // 打开信箱
    mailBtn.addEventListener('click', async () => {
        await openMailModal();
    });

    // 打开写信
    writeBtn.addEventListener('click', () => {
        openWriteModal();
    });

    // 关闭信箱
    closeMailBtn.addEventListener('click', () => {
        closeModal(mailModal);
    });

    // 关闭写信
    closeWriteBtn.addEventListener('click', () => {
        closeModal(writeModal);
    });

    // 点击蒙层关闭
    mailModal.addEventListener('click', (e) => {
        if (e.target === mailModal) {
            closeModal(mailModal);
        }
    });

    writeModal.addEventListener('click', (e) => {
        if (e.target === writeModal) {
            closeModal(writeModal);
        }
    });

    // 发送回信
    sendBtn.addEventListener('click', sendReply);

    // 动画结束监听
    bunnyContainer.addEventListener('animationend', () => {
        bunnyContainer.classList.remove('running');
    });
}

// 打开信箱弹窗
async function openMailModal() {
    await loadLetters();
    await checkUnreadCount();
    renderLetters();
    mailModal.classList.add('show');
}

// 打开写信弹窗
function openWriteModal() {
    replyInput.value = '';
    writeModal.classList.add('show');
}

// 关闭弹窗
function closeModal(modal) {
    modal.classList.remove('show');
}

// 渲染信件列表
function renderLetters() {
    if (gameState.letters.length === 0) {
        mailContent.innerHTML = '<p style="text-align: center; color: #a88868; padding: 40px 0;">还没有信件哦，兔兔很快就会给你写信啦💌</p>';
        return;
    }

    let html = '';
    // 按创建时间倒序显示，最新的在最前面
    const sortedLetters = [...gameState.letters].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedLetters.forEach(letter => {
        const preview = letter.content.length > 50 ? letter.content.substring(0, 50) + '...' : letter.content;
        const className = `letter-item ${!letter.isRead ? 'unread' : ''}`;
        const senderLabel = letter.sender === 'bunny' ? '兔兔' : '我';
        const date = formatDate(letter.createdAt);

        html += `
            <div class="${className}" data-id="${letter.id}" onclick="openLetter(${letter.id})">
                <div class="letter-header">
                    <span class="sender">${senderLabel}</span>
                    <span class="letter-date">${date}</span>
                </div>
                <div class="letter-preview">${!letter.isRead && letter.sender === 'bunny' ? `💌 ${preview}` : preview}</div>
            </div>
        `;
    });

    mailContent.innerHTML = html;
}

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffHours = diff / (1000 * 60 * 60);
    
    if (diffHours < 1) {
        return '刚刚';
    } else if (diffHours < 24) {
        return '今天';
    } else if (diffHours < 48) {
        return '昨天';
    } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
}

// 打开信件详情
async function openLetter(letterId) {
    const letter = gameState.letters.find(l => l.id === letterId);
    if (!letter) return;

    // 如果是兔兔的未读回信，标记为已读
    if (letter.sender === 'bunny' && !letter.isRead) {
        try {
            await fetch(`${API_BASE}/api/letters/${letterId}/mark-read`, {
                method: 'POST'
            });
            letter.isRead = true;
            await checkUnreadCount();
            renderLetters();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    const html = `
        <div class="letter-detail">
            ${letter.content.replace(/\n/g, '<br>')}
        </div>
        <button class="back-btn" onclick="renderLettersBack()" style="margin-top: 20px; padding: 10px 20px; background: #f0e6d6; border: none; border-radius: 8px; cursor: pointer; color: #8b5a3f;">返回列表</button>
    `;

    mailContent.innerHTML = html;
}

// 返回信件列表
function renderLettersBack() {
    renderLetters();
}

// 发送用户信件
async function sendReply() {
    // 防重复发送
    if (gameState.isSending) {
        return;
    }
    
    const content = replyInput.value.trim();
    if (!content) {
        showToast('请写下想对兔兔说的话哦');
        return;
    }

    gameState.isSending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '发送中...';

    try {
        // 发送信件到后端，后端会自动生成AI回信
        const res = await fetch(`${API_BASE}/api/letters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || '发送失败');
        }

        // 关闭弹窗
        closeModal(writeModal);

        // 显示提示
        showToast('兔兔收到你的信啦！正在回信中...🥰');

        // 触发开心动画
        triggerHappyAnimation();

        // 重新加载信件并更新未读
        setTimeout(async () => {
            await loadLetters();
            await checkUnreadCount();
            gameState.isSending = false;
            sendBtn.disabled = false;
            sendBtn.textContent = '发送';
        }, 1500);

    } catch (error) {
        console.error('Failed to send letter:', error);
        showToast('发送失败，请重试');
        gameState.isSending = false;
        sendBtn.disabled = false;
        sendBtn.textContent = '发送';
    }
}

// 触发开心动画
function triggerHappyAnimation() {
    bunny.classList.add('happy');
    bunnyContainer.classList.add('running');

    // 保持摇尾巴一会儿
    setTimeout(() => {
        bunny.classList.remove('happy');
    }, 5000);
}

// 显示 Toast
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 让 openLetter 和 renderLettersBack 在全局可访问
window.openLetter = openLetter;
window.renderLettersBack = renderLettersBack;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
