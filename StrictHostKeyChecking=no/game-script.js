// 兔兔拼字母游戏 - 修复版
// 修复内容：字母预览不更新bug - 修正选择器为#letter-preview，移除多余innerHTML清空

// 游戏状态
const gameState = {
    availableLetters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    selectedLetters: [],
    dictionary: []
};

// DOM 元素
const letterPreview = document.getElementById('letter-preview');
const letterTilesContainer = document.getElementById('letter-tiles');
const guessResult = document.getElementById('guess-result');
const clearBtn = document.getElementById('clear-btn');
const guessBtn = document.getElementById('guess-btn');

// 初始化游戏
function init() {
    renderLetterTiles();
    renderPreview();
    bindEvents();
    loadDictionary();
}

// 加载词典
async function loadDictionary() {
    try {
        const response = await fetch('dictionary.txt');
        if (response.ok) {
            const text = await response.text();
            gameState.dictionary = text.split('\n')
                .map(word => word.trim().toUpperCase())
                .filter(word => word.length > 0);
        }
    } catch (e) {
        // 如果加载失败使用默认词典
        gameState.dictionary = [
            'HELLO', 'WORLD', 'CAT', 'DOG', 'BUNNY', 'RABBIT',
            'LOVE', 'HAPPY', 'FUN', 'GAME', 'PLAY', 'NICE'
        ];
    }
}

// 渲染字母 tiles
function renderLetterTiles() {
    letterTilesContainer.innerHTML = '';
    gameState.availableLetters.forEach(letter => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.textContent = letter;
        tile.addEventListener('click', () => selectLetter(letter));
        letterTilesContainer.appendChild(tile);
    });
}

// 渲染预览 - 修复后的代码
function renderPreview() {
    // 修复bug: 直接用正确ID选择器设置innerHTML，不需要先清空再append
    // 之前错误代码: const preview = document.querySelector('.letter-preview'); preview.innerHTML = ''; ...
    if (gameState.selectedLetters.length === 0) {
        letterPreview.innerHTML = '<span class="placeholder">点击下方字母开始拼单词...</span>';
    } else {
        letterPreview.innerHTML = gameState.selectedLetters.map(letter => 
            `<span class="preview-letter">${letter}</span>`
        ).join('');
    }
}

// 选择字母
function selectLetter(letter) {
    // 从可用列表移除，添加到已选
    const index = gameState.availableLetters.indexOf(letter);
    if (index > -1) {
        gameState.availableLetters.splice(index, 1);
        gameState.selectedLetters.push(letter);
        renderLetterTiles();
        renderPreview();
    }
}

// 绑定事件
function bindEvents() {
    clearBtn.addEventListener('click', clearGame);
    guessBtn.addEventListener('click', makeGuess);
}

// 清空游戏
function clearGame() {
    gameState.availableLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    gameState.selectedLetters = [];
    renderLetterTiles();
    renderPreview();
    guessResult.innerHTML = '<span class="placeholder">兔兔会在这里告诉你它的猜测...</span>';
}

// 兔兔猜测
function makeGuess() {
    if (gameState.selectedLetters.length === 0) {
        guessResult.innerHTML = '<p class="empty">你还没拼任何字母哦 😝</p>';
        return;
    }

    const word = gameState.selectedLetters.join('');
    const isInDictionary = gameState.dictionary.includes(word);

    // 模拟兔兔思考
    guessResult.innerHTML = '<p class="thinking">兔兔正在思考...</p>';
    
    setTimeout(() => {
        if (isInDictionary) {
            guessResult.innerHTML = `
                <div class="correct">
                    <p>🎉 我猜到了！这是单词：<strong>${word}</strong></p>
                    <p>拼得太好了！快再拼一个让兔兔猜吧 😊</p>
                </div>
            `;
        } else {
            guessResult.innerHTML = `
                <div class="guess">
                    <p>🤔 让我想想... 这应该是：<strong>${word}</strong></p>
                    <p>这个单词好难，兔兔学会了新单词！谢谢主人 🥰</p>
                </div>
            `;
        }
    }, 800);
}

// 页面加载完成初始化
document.addEventListener('DOMContentLoaded', init);
