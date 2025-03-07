// 全局变量
let currentPersona = 'empathetic';
let emotionData = {
    labels: ['开始', '5分钟前', '现在'],
    datasets: [{
        label: '情绪指数',
        data: [50, 60, 75],
        borderColor: '#7e57c2',
        backgroundColor: 'rgba(126, 87, 194, 0.2)',
        tension: 0.4,
        fill: true
    }]
};
let emotionChart;
let isTyping = false;

// 模拟的香薰产品数据
const aromatherapyProducts = [
    {
        id: 1,
        name: '薰衣草精油',
        description: '舒缓放松，帮助睡眠，缓解焦虑',
        image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        emotions: ['焦虑', '压力', '失眠'],
        fullDescription: '薰衣草精油以其舒缓特性而闻名，能有效缓解焦虑和压力。它的香气有助于改善睡眠质量，减轻紧张情绪。在情绪低落时，薰衣草的温和香气能带来平静与安宁。'
    },
    {
        id: 2,
        name: '柠檬香薰蜡烛',
        description: '提振精神，增强专注力，改善情绪',
        image: 'https://images.unsplash.com/photo-1602178506153-472ef4810278?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        emotions: ['疲惫', '注意力不集中', '情绪低落'],
        fullDescription: '柠檬香薰蜡烛散发出清新的柑橘香气，能有效提振精神和改善情绪。它的香气有助于增强专注力，适合在工作或学习时使用。柠檬的香气也被认为能促进积极思考，驱散消极情绪。'
    },
    {
        id: 3,
        name: '茉莉花精油扩香器',
        description: '平衡情绪，缓解抑郁，增强自信',
        image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        emotions: ['抑郁', '自卑', '情绪波动'],
        fullDescription: '茉莉花精油以其甜美而浓郁的香气著称，能有效平衡情绪，缓解抑郁症状。它的香气被认为能增强自信，提升积极情绪。茉莉花精油扩香器可以持续释放香气，为空间营造温馨舒适的氛围。'
    }
];

// DOM元素
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const personaElements = document.querySelectorAll('.persona');
const recommendationCards = document.querySelector('.recommendation-cards');
const modal = document.getElementById('productModal');
const closeModal = document.querySelector('.close-modal');

// 初始化函数
function init() {
    // 初始化情绪图表
    initEmotionChart();
    
    // 加载初始推荐
    loadRecommendations();
    
    // 事件监听器
    setupEventListeners();
    
    // 自动调整文本区域高度
    autoResizeTextarea();
}

// 初始化情绪图表
function initEmotionChart() {
    const ctx = document.getElementById('emotionChart').getContext('2d');
    emotionChart = new Chart(ctx, {
        type: 'line',
        data: emotionData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 25
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 发送消息
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 人设切换
    personaElements.forEach(persona => {
        persona.addEventListener('click', () => {
            changePersona(persona.dataset.persona);
        });
    });
    
    // 关闭模态框
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // 主题切换
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);
}

// 自动调整文本区域高度
function autoResizeTextarea() {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// 发送消息
function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;
    
    // 添加用户消息到聊天
    addMessageToChat('user', message);
    
    // 清空输入框
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // 显示"正在输入"状态
    showTypingIndicator();
    
    // 模拟情绪分析和回复
    setTimeout(() => {
        // 移除"正在输入"状态
        removeTypingIndicator();
        
        // 分析情绪（模拟）
        analyzeEmotion(message);
        
        // 生成回复（模拟）
        const reply = generateReply(message);
        addMessageToChat('assistant', reply);
        
        // 更新推荐
        updateRecommendations();
    }, 1500);
}

// 添加消息到聊天
function addMessageToChat(sender, content) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    const avatarElement = document.createElement('div');
    avatarElement.classList.add('message-avatar');
    
    const imgElement = document.createElement('img');
    imgElement.src = sender === 'user' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' 
        : document.querySelector(`.persona[data-persona="${currentPersona}"] img`).src;
    imgElement.alt = sender === 'user' ? '用户头像' : '助手头像';
    
    avatarElement.appendChild(imgElement);
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    const textElement = document.createElement('p');
    textElement.textContent = content;
    
    contentElement.appendChild(textElement);
    
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);
    
    chatMessages.appendChild(messageElement);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 显示"正在输入"状态
function showTypingIndicator() {
    if (isTyping) return;
    
    isTyping = true;
    
    const typingElement = document.createElement('div');
    typingElement.classList.add('message', 'assistant', 'typing-indicator');
    
    const avatarElement = document.createElement('div');
    avatarElement.classList.add('message-avatar');
    
    const imgElement = document.createElement('img');
    imgElement.src = document.querySelector(`.persona[data-persona="${currentPersona}"] img`).src;
    imgElement.alt = '助手头像';
    
    avatarElement.appendChild(imgElement);
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    const typingDots = document.createElement('div');
    typingDots.classList.add('typing-dots');
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        typingDots.appendChild(dot);
    }
    
    contentElement.appendChild(typingDots);
    
    typingElement.appendChild(avatarElement);
    typingElement.appendChild(contentElement);
    
    chatMessages.appendChild(typingElement);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 移除"正在输入"状态
function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

// 分析情绪（模拟）
function analyzeEmotion(message) {
    // 简单的关键词匹配（实际应用中应使用更复杂的NLP）
    let emotionScore = emotionData.datasets[0].data[emotionData.datasets[0].data.length - 1];
    let emotionLabel = '平静';
    let emotionIcon = 'fa-smile';
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('难过') || lowerMessage.includes('伤心') || lowerMessage.includes('悲')) {
        emotionScore = Math.max(30, emotionScore - 15);
        emotionLabel = '悲伤';
        emotionIcon = 'fa-sad-tear';
    } else if (lowerMessage.includes('焦虑') || lowerMessage.includes('担心') || lowerMessage.includes('紧张')) {
        emotionScore = Math.max(40, emotionScore - 10);
        emotionLabel = '焦虑';
        emotionIcon = 'fa-frown';
    } else if (lowerMessage.includes('生气') || lowerMessage.includes('愤怒') || lowerMessage.includes('烦')) {
        emotionScore = Math.max(35, emotionScore - 12);
        emotionLabel = '愤怒';
        emotionIcon = 'fa-angry';
    } else if (lowerMessage.includes('开心') || lowerMessage.includes('高兴') || lowerMessage.includes('快乐')) {
        emotionScore = Math.min(90, emotionScore + 15);
        emotionLabel = '快乐';
        emotionIcon = 'fa-grin-beam';
    } else if (lowerMessage.includes('疲惫') || lowerMessage.includes('累') || lowerMessage.includes('困')) {
        emotionScore = Math.max(45, emotionScore - 8);
        emotionLabel = '疲惫';
        emotionIcon = 'fa-tired';
    } else {
        // 随机小波动
        const change = Math.floor(Math.random() * 10) - 5;
        emotionScore = Math.min(Math.max(emotionScore + change, 30), 90);
    }
    
    // 更新情绪图表
    updateEmotionChart(emotionScore);
    
    // 更新情绪显示
    updateEmotionDisplay(emotionLabel, emotionIcon, emotionScore);
}

// 更新情绪图表
function updateEmotionChart(newScore) {
    // 移动数据点
    emotionData.datasets[0].data.shift();
    emotionData.datasets[0].data.push(newScore);
    
    // 更新图表
    emotionChart.update();
}

// 更新情绪显示
function updateEmotionDisplay(label, icon, score) {
    document.querySelector('.emotion-label').textContent = label;
    document.querySelector('.emotion-icon i').className = `fas ${icon}`;
    document.querySelector('.level-bar').style.width = `${score}%`;
}

// 生成回复（模拟）
function generateReply(message) {
    // 根据当前人设生成不同风格的回复
    const lowerMessage = message.toLowerCase();
    
    switch(currentPersona) {
        case 'empathetic':
            if (lowerMessage.includes('难过') || lowerMessage.includes('伤心')) {
                return '我能感受到你的悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。你想聊聊是什么让你感到难过吗？';
            } else if (lowerMessage.includes('焦虑') || lowerMessage.includes('担心')) {
                return '焦虑确实是一种很不舒服的感觉。深呼吸可能会有所帮助。你能告诉我更多关于让你焦虑的事情吗？我们可以一起探索一些应对方法。';
            } else {
                return '谢谢你的分享。我很理解你的感受，这是很自然的反应。如果你愿意，我们可以一起探索这些情绪背后的原因，或者讨论一些可能对你有帮助的方法。';
            }
            
        case 'motivational':
            return '你做得很棒！每一步都是进步，即使是小小的分享也是勇气的表现。记住，每个挑战都是成长的机会，我相信你有能力克服当前的困难。让我们一起找到前进的动力！';
            
        case 'analytical':
            return '从你的描述来看，这种情况可能与几个因素有关。我们可以从不同角度分析：首先，环境因素可能在影响你的情绪；其次，认知模式也可能起作用。让我们系统地探讨这些可能性，找出最适合你的解决方案。';
            
        case 'mindful':
            return '让我们一起深呼吸，专注于当下这一刻。注意你的感受，但不要评判它们。这些情绪就像天空中的云，它们会来也会去。保持觉知，温和地接纳当前的体验，无论它是什么。';
            
        default:
            return '我理解你的感受。请继续分享你的想法，我在这里倾听和支持你。';
    }
}

// 更改人设
function changePersona(persona) {
    currentPersona = persona;
    
    // 更新UI
    personaElements.forEach(el => {
        if (el.dataset.persona === persona) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
    
    // 添加系统消息
    const personaName = document.querySelector(`.persona[data-persona="${persona}"] h3`).textContent;
    addMessageToChat('assistant', `已切换到${personaName}。我将以这种风格继续我们的对话。`);
}

// 加载推荐
function loadRecommendations() {
    recommendationCards.innerHTML = '';
    
    // 随机选择2个产品显示
    const shuffled = [...aromatherapyProducts].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    
    selected.forEach(product => {
        const card = createProductCard(product);
        recommendationCards.appendChild(card);
    });
}

// 更新推荐
function updateRecommendations() {
    // 简单实现：随机更新推荐
    loadRecommendations();
}

// 创建产品卡片
function createProductCard(product) {
    const card = document.createElement('div');
    card.classList.add('recommendation-card');
    card.dataset.productId = product.id;
    
    const cardImage = document.createElement('div');
    cardImage.classList.add('card-image');
    
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    
    cardImage.appendChild(img);
    
    const cardContent = document.createElement('div');
    cardContent.classList.add('card-content');
    
    const title = document.createElement('h3');
    title.classList.add('card-title');
    title.textContent = product.name;
    
    const description = document.createElement('p');
    description.classList.add('card-description');
    description.textContent = product.description;
    
    const emotion = document.createElement('span');
    emotion.classList.add('card-emotion');
    emotion.textContent = product.emotions[0];
    
    cardContent.appendChild(title);
    cardContent.appendChild(description);
    cardContent.appendChild(emotion);
    
    card.appendChild(cardImage);
    card.appendChild(cardContent);
    
    // 点击事件
    card.addEventListener('click', () => {
        showProductDetails(product);
    });
    
    return card;
}

// 显示产品详情
function showProductDetails(product) {
    const productDetails = document.querySelector('.product-details');
    productDetails.innerHTML = '';
    
    // 产品图片
    const productImage = document.createElement('div');
    productImage.classList.add('product-image');
    
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    
    productImage.appendChild(img);
    
    // 产品信息
    const productInfo = document.createElement('div');
    productInfo.classList.add('product-info');
    
    const title = document.createElement('h3');
    title.textContent = product.name;
    
    const description = document.createElement('p');
    description.textContent = product.fullDescription;
    
    const emotionsTitle = document.createElement('h4');
    emotionsTitle.textContent = '适用情绪:';
    
    const emotions = document.createElement('div');
    emotions.classList.add('product-emotions');
    
    product.emotions.forEach(emotion => {
        const emotionTag = document.createElement('span');
        emotionTag.classList.add('product-emotion');
        emotionTag.textContent = emotion;
        emotions.appendChild(emotionTag);
    });
    
    productInfo.appendChild(title);
    productInfo.appendChild(description);
    productInfo.appendChild(emotionsTitle);
    productInfo.appendChild(emotions);
    
    productDetails.appendChild(productImage);
    productDetails.appendChild(productInfo);
    
    // 显示模态框
    modal.classList.add('active');
}

// 添加CSS样式
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 打字指示器样式 */
        .typing-dots {
            display: flex;
            gap: 4px;
            padding: 8px;
        }
        
        .typing-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--primary-color);
            opacity: 0.6;
            animation: typingAnimation 1.4s infinite ease-in-out both;
        }
        
        .typing-dots span:nth-child(1) {
            animation-delay: 0s;
        }
        
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typingAnimation {
            0%, 80%, 100% { 
                transform: scale(0.6);
                opacity: 0.6;
            }
            40% { 
                transform: scale(1);
                opacity: 1;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// 切换主题
function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.querySelector('#themeToggle i');
    
    if (html.getAttribute('data-theme') === 'light') {
        html.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        html.setAttribute('data-theme', 'light');
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// 加载保存的主题
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    const themeIcon = document.querySelector('#themeToggle i');
    
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    addStyles();
    
    // 加载保存的主题
    loadSavedTheme();
    
    // 模拟加载过程
    setTimeout(() => {
        document.getElementById('loaderContainer').classList.add('hidden');
        init();
    }, 1500);
}); 