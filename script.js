// 预置信件内容
const defaultLetters = [
    {
        id: 1,
        date: '今天',
        content: '今天天气真好呀，我在小屋子里晒着太阳，突然就好想你了🥰',
        read: false
    },
    {
        id: 2,
        date: '今天',
        content: '刚刚吃了你上次留给我的胡萝卜，好甜好脆！你什么时候再来陪我一起吃呀？😋',
        read: false
    },
    {
        id: 3,
        date: '昨天',
        content: '我学会了一个新魔术，等你来了变给你看！猜猜我能变出什么？猜猜呀👉👈',
        read: false
    },
    {
        id: 4,
        date: '昨天',
        content: '外面的风呼呼吹，我窝在暖暖的小屋子里，就想起了你温暖的抱抱...🥺',
        read: false
    },
    {
        id: 5,
        date: '前天',
        content: '今天看到一朵长得很像胡萝卜的云，我盯着它看了好久，你说它会不会真的变成胡萝卜呀？',
        read: false
    },
    {
        id: 6,
        date: '前天',
        content: '不管你在做什么，都不要太累啦，要记得休息哦。兔兔在这里一直想着你❤️',
        read: false
    },
    {
        id: 7,
        content: '你的出现，就是我每天最开心的事情。真的真的超级喜欢你呀！✨',
        date: '刚刚',
        read: false
    },
    {
        id: 8,
        date: '一周前',
        content: '就算今天不开心也没关系哦，我会一直陪着你的。明天一定会更好的💪',
        read: false
    }
];

// 状态管理
let gameState = {
    letters: [],
    replies: [],
    hasUnread: true
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

// 初始化
function init() {
    // 从 localStorage 加载数据
    const saved = localStorage.getItem('bunnyLetterGame');
    if (saved) {
        gameState = JSON.parse(saved);
    } else {
        // 首次加载，预置信件
        gameState.letters = defaultLetters;
        saveState();
    }

    updateUnreadBadge();
    setupEventListeners();
}

// 保存状态到 localStorage
function saveState() {
    localStorage.setItem('bunnyLetterGame', JSON.stringify(gameState));
    updateUnreadBadge();
}

// 更新未读提示
function updateUnreadBadge() {
    const hasUnread = gameState.letters.some(l => !l.read);
    if (hasUnread) {
        unreadBadge.classList.add('show');
    } else {
        unreadBadge.classList.remove('show');
    }
}

// 设置事件监听
function setupEventListeners() {
    // 打开信箱
    mailBtn.addEventListener('click', () => {
        openMailModal();
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
function openMailModal() {
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
    // 按 ID 倒序显示，最新的在最前面
    const sortedLetters = [...gameState.letters].sort((a, b) => b.id - a.id);

    sortedLetters.forEach(letter => {
        const preview = letter.content.length > 50 ? letter.content.substring(0, 50) + '...' : letter.content;
        const className = `letter-item ${letter.read ? '' : 'unread'}`;

        html += `
            <div class="${className}" data-id="${letter.id}" onclick="openLetter(${letter.id})">
                <div class="letter-date">${letter.date}</div>
                <div class="letter-preview">${letter.read ? preview : `💌 ${preview}`}</div>
            </div>
        `;
    });

    mailContent.innerHTML = html;
}

// 打开信件详情
function openLetter(letterId) {
    const letter = gameState.letters.find(l => l.id === letterId);
    if (!letter) return;

    // 标记为已读
    letter.read = true;
    saveState();
    renderLetters();

    const html = `
        <div class="letter-detail">
            ${letter.content.replace(/\n/g, '<br>')}
        </div>
        <button class="back-btn" onclick="renderLetters()" style="margin-top: 20px; padding: 10px 20px; background: #f0e6d6; border: none; border-radius: 8px; cursor: pointer; color: #8b5a3f;">返回列表</button>
    `;

    mailContent.innerHTML = html;
}

// 发送回信
function sendReply() {
    const content = replyInput.value.trim();
    if (!content) {
        showToast('请写下想对兔兔说的话哦');
        return;
    }

    // 保存回信
    gameState.replies.push({
        content: content,
        date: new Date().toLocaleDateString('zh-CN')
    });
    saveState();

    // 关闭弹窗
    closeModal(writeModal);

    // 显示提示
    showToast('兔兔收到你的信啦！🥰');

    // 触发开心动画
    triggerHappyAnimation();

    // 随机添加一封新回信（兔兔的回应）
    setTimeout(addRandomResponse, 1000);
}

// 触发开心动画
function triggerHappyAnimation() {
    bunny.classList.add('happy');
    bunnyContainer.classList.add('running');

    // 动画结束后移除 class
    setTimeout(() => {
        bunnyContainer.classList.remove('running');
    }, 4000);

    // 保持摇尾巴一会儿
    setTimeout(() => {
        bunny.classList.remove('happy');
    }, 5000);
}

// 添加随机回应信件
function addRandomResponse() {
    const responses = [
        '哇！收到你的回信了，我好开心呀！谢谢你给我写信🥰',
        '你的话真温暖，让我的小屋子都变得更亮了✨',
        '我会好好把你的信藏在我的小枕头下面，每天都要看一遍💖',
        '嗯...我读了好几遍，心里暖暖的，真幸福呀',
        '能收到你的信，就是我最开心的事情了！谢谢你❤️',
        '我蹦蹦跳跳地把这个好消息告诉了窗外的小鸟，它们也很为我开心呢🐦'
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const newLetter = {
        id: Date.now(),
        date: '刚刚',
        content: randomResponse,
        read: false
    };

    gameState.letters.push(newLetter);
    saveState();
}

// 显示 Toast
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 让 openLetter 在全局可访问
window.openLetter = openLetter;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
