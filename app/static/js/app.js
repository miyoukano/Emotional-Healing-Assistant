// 全局变量
let currentPersona = 'empathetic';
let currentEmotion = 'neutral'; // 当前情绪状态
let isTyping = false;

// 用户认证相关DOM元素
const authButton = document.getElementById('authButton');
const authModal = document.getElementById('authModal');
const closeAuthModal = document.getElementById('closeAuthModal');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginSubmit = document.getElementById('loginSubmit');
const registerSubmit = document.getElementById('registerSubmit');
const togglePasswordElements = document.querySelectorAll('.toggle-password');
const userProfile = document.getElementById('userProfile');
const userMenuToggle = document.querySelector('.user-menu-toggle');
const userMenu = document.querySelector('.user-menu');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const avatarUpload = document.getElementById('avatarUpload');
const profileSaveButton = document.querySelector('.profile-save-button');

// 用户状态
let isLoggedIn = false;
let currentUser = null;

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
    // 加载初始推荐
    loadRecommendations();
    
    // 事件监听器
    setupEventListeners();
    
    // 自动调整文本区域高度
    autoResizeTextarea();
    
    // 检查用户登录状态
    checkLoginStatus();
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
    
    // 登录/注册按钮点击
    authButton.addEventListener('click', () => {
        authModal.classList.add('active');
    });
    
    // 关闭登录/注册模态框
    closeAuthModal.addEventListener('click', () => {
        authModal.classList.remove('active');
    });
    
    // 标签页切换
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // 更新标签页状态
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 更新表单显示
            if (tabName === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }
        });
    });
    
    // 密码显示/隐藏切换
    togglePasswordElements.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggle.classList.remove('fa-eye-slash');
                toggle.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                toggle.classList.remove('fa-eye');
                toggle.classList.add('fa-eye-slash');
            }
        });
    });
    
    // 登录表单提交
    loginSubmit.addEventListener('click', handleLogin);
    
    // 注册表单提交
    registerSubmit.addEventListener('click', handleRegister);
    
    // 用户菜单切换
    userMenuToggle.addEventListener('click', () => {
        userMenu.classList.toggle('active');
    });
    
    // 用户菜单项点击
    userMenu.querySelectorAll('li').forEach((item, index) => {
        item.addEventListener('click', () => {
            userMenu.classList.remove('active');
            
            if (index === 0) { // 个人资料
                profileModal.classList.add('active');
            } else if (index === 1) { // 设置
                // 设置功能待实现
                alert('设置功能即将上线');
            } else if (index === 2) { // 退出登录
                handleLogout();
            }
        });
    });
    
    // 关闭个人资料模态框
    closeProfileModal.addEventListener('click', () => {
        profileModal.classList.remove('active');
    });
    
    // 头像上传
    avatarUpload.addEventListener('change', handleAvatarUpload);
    
    // 保存个人资料
    profileSaveButton.addEventListener('click', saveProfile);
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
        }
        if (e.target === profileModal) {
            profileModal.classList.remove('active');
        }
    });
    
    // 情绪类型点击
    document.querySelectorAll('.emotion-type').forEach(type => {
        type.addEventListener('click', () => {
            const emotion = type.dataset.emotion;
            let label, icon, description;
            
            switch(emotion) {
                case 'happy':
                    label = '快乐';
                    icon = 'fa-grin-beam';
                    description = '您似乎心情不错！享受这美好的时刻，并记住这种感觉。';
                    break;
                case 'sad':
                    label = '悲伤';
                    icon = 'fa-sad-tear';
                    description = '您似乎感到有些悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。';
                    break;
                case 'angry':
                    label = '愤怒';
                    icon = 'fa-angry';
                    description = '您似乎感到有些愤怒。这是一种正常的情绪，尝试找到健康的方式来表达它。';
                    break;
                case 'anxious':
                    label = '焦虑';
                    icon = 'fa-frown';
                    description = '您似乎感到有些焦虑。深呼吸可能会有所帮助，尝试放松您的身心。';
                    break;
                case 'tired':
                    label = '疲惫';
                    icon = 'fa-tired';
                    description = '您似乎感到有些疲惫。适当的休息对身心健康都很重要。';
                    break;
            }
            
            updateEmotionDisplay(emotion, label, icon, description);
        });
    });
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
    let emotionType = 'neutral';
    let emotionLabel = '平静';
    let emotionIcon = 'fa-smile';
    let emotionDescription = '您当前的情绪状态看起来很平静';
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('难过') || lowerMessage.includes('伤心') || lowerMessage.includes('悲')) {
        emotionType = 'sad';
        emotionLabel = '悲伤';
        emotionIcon = 'fa-sad-tear';
        emotionDescription = '您似乎感到有些悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。';
    } else if (lowerMessage.includes('焦虑') || lowerMessage.includes('担心') || lowerMessage.includes('紧张')) {
        emotionType = 'anxious';
        emotionLabel = '焦虑';
        emotionIcon = 'fa-frown';
        emotionDescription = '您似乎感到有些焦虑。深呼吸可能会有所帮助，尝试放松您的身心。';
    } else if (lowerMessage.includes('生气') || lowerMessage.includes('愤怒') || lowerMessage.includes('烦')) {
        emotionType = 'angry';
        emotionLabel = '愤怒';
        emotionIcon = 'fa-angry';
        emotionDescription = '您似乎感到有些愤怒。这是一种正常的情绪，尝试找到健康的方式来表达它。';
    } else if (lowerMessage.includes('开心') || lowerMessage.includes('高兴') || lowerMessage.includes('快乐')) {
        emotionType = 'happy';
        emotionLabel = '快乐';
        emotionIcon = 'fa-grin-beam';
        emotionDescription = '您似乎心情不错！享受这美好的时刻，并记住这种感觉。';
    } else if (lowerMessage.includes('疲惫') || lowerMessage.includes('累') || lowerMessage.includes('困')) {
        emotionType = 'tired';
        emotionLabel = '疲惫';
        emotionIcon = 'fa-tired';
        emotionDescription = '您似乎感到有些疲惫。适当的休息对身心健康都很重要。';
    }
    
    // 只有当检测到情绪关键词时才更新显示
    if (emotionType !== 'neutral' || currentEmotion === 'neutral') {
        updateEmotionDisplay(emotionType, emotionLabel, emotionIcon, emotionDescription);
    }
}

// 更新情绪显示
function updateEmotionDisplay(emotionType, emotionLabel, emotionIcon, emotionDescription) {
    // 更新当前情绪
    currentEmotion = emotionType;
    
    // 更新情绪图标和标签
    document.querySelector('.emotion-icon i').className = `fas ${emotionIcon}`;
    document.querySelector('.emotion-label').textContent = emotionLabel;
    document.querySelector('.emotion-description').textContent = emotionDescription;
    
    // 更新情绪类型的激活状态
    document.querySelectorAll('.emotion-type').forEach(type => {
        if (type.dataset.emotion === emotionType) {
            type.classList.add('active');
        } else {
            type.classList.remove('active');
        }
    });
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

// 检查登录状态
function checkLoginStatus() {
    // 从localStorage获取用户信息
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        updateUIForLoggedInUser();
    }
}

// 处理登录
function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // 表单验证
    let isValid = true;
    
    if (email === '') {
        showFormError('loginEmail', '请输入邮箱或用户名');
        isValid = false;
    } else {
        clearFormError('loginEmail');
    }
    
    if (password === '') {
        showFormError('loginPassword', '请输入密码');
        isValid = false;
    } else {
        clearFormError('loginPassword');
    }
    
    if (!isValid) return;
    
    // 模拟登录API调用
    setTimeout(() => {
        // 模拟成功登录
        currentUser = {
            id: 1,
            username: email.includes('@') ? email.split('@')[0] : email,
            email: email.includes('@') ? email : email + '@example.com',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            preferences: {
                emotions: ['焦虑', '失眠'],
                aromas: ['薰衣草', '茉莉花']
            }
        };
        
        isLoggedIn = true;
        
        // 保存用户信息到localStorage
        if (rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // 更新UI
        updateUIForLoggedInUser();
        
        // 关闭模态框
        authModal.classList.remove('active');
        
        // 显示欢迎消息
        addMessageToChat('assistant', `欢迎回来，${currentUser.username}！今天感觉如何？`);
    }, 1000);
}

// 处理注册
function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 表单验证
    let isValid = true;
    
    if (username === '') {
        showFormError('registerUsername', '请输入用户名');
        isValid = false;
    } else {
        clearFormError('registerUsername');
    }
    
    if (email === '') {
        showFormError('registerEmail', '请输入邮箱');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFormError('registerEmail', '请输入有效的邮箱地址');
        isValid = false;
    } else {
        clearFormError('registerEmail');
    }
    
    if (password === '') {
        showFormError('registerPassword', '请输入密码');
        isValid = false;
    } else if (password.length < 8) {
        showFormError('registerPassword', '密码长度至少为8位');
        isValid = false;
    } else {
        clearFormError('registerPassword');
    }
    
    if (confirmPassword === '') {
        showFormError('confirmPassword', '请确认密码');
        isValid = false;
    } else if (confirmPassword !== password) {
        showFormError('confirmPassword', '两次输入的密码不一致');
        isValid = false;
    } else {
        clearFormError('confirmPassword');
    }
    
    if (!isValid) return;
    
    // 模拟注册API调用
    setTimeout(() => {
        // 模拟成功注册
        currentUser = {
            id: 1,
            username: username,
            email: email,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            preferences: {
                emotions: [],
                aromas: []
            }
        };
        
        isLoggedIn = true;
        
        // 保存用户信息到localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 更新UI
        updateUIForLoggedInUser();
        
        // 关闭模态框
        authModal.classList.remove('active');
        
        // 显示欢迎消息
        addMessageToChat('assistant', `欢迎加入，${currentUser.username}！我是你的情绪愈疗助手，有什么可以帮到你的吗？`);
    }, 1000);
}

// 处理退出登录
function handleLogout() {
    // 清除用户信息
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('currentUser');
    
    // 更新UI
    authButton.style.display = 'flex';
    userProfile.style.display = 'none';
    
    // 显示消息
    addMessageToChat('assistant', '你已退出登录。随时欢迎你回来！');
}

// 更新已登录用户的UI
function updateUIForLoggedInUser() {
    // 隐藏登录按钮，显示用户资料
    authButton.style.display = 'none';
    userProfile.style.display = 'flex';
    
    // 更新用户信息
    document.querySelector('.user-name').textContent = currentUser.username;
    document.querySelector('.user-email').textContent = currentUser.email;
    document.querySelector('.user-avatar img').src = currentUser.avatar;
    
    // 更新个人资料模态框
    document.getElementById('profileUsername').value = currentUser.username;
    document.getElementById('profileEmail').value = currentUser.email;
    document.querySelector('.profile-avatar img').src = currentUser.avatar;
    
    // 更新情绪和香薰偏好
    if (currentUser.preferences) {
        // 重置所有复选框
        document.querySelectorAll('.emotion-preference input, .aroma-preference input').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // 设置用户偏好
        if (currentUser.preferences.emotions) {
            currentUser.preferences.emotions.forEach(emotion => {
                const checkbox = document.getElementById(`emotion${capitalizeFirstLetter(emotion)}`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (currentUser.preferences.aromas) {
            currentUser.preferences.aromas.forEach(aroma => {
                const checkbox = document.getElementById(`aroma${capitalizeFirstLetter(aroma)}`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
}

// 处理头像上传
function handleAvatarUpload(e) {
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const avatarUrl = event.target.result;
            
            // 更新头像预览
            document.querySelector('.profile-avatar img').src = avatarUrl;
        };
        
        reader.readAsDataURL(file);
    }
}

// 保存个人资料
function saveProfile() {
    const username = document.getElementById('profileUsername').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const password = document.getElementById('profilePassword').value;
    
    // 表单验证
    let isValid = true;
    
    if (username === '') {
        alert('用户名不能为空');
        isValid = false;
    }
    
    if (email === '' || !isValidEmail(email)) {
        alert('请输入有效的邮箱地址');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // 获取情绪偏好
    const emotionPreferences = [];
    document.querySelectorAll('.emotion-preference input:checked').forEach(checkbox => {
        emotionPreferences.push(checkbox.nextElementSibling.textContent);
    });
    
    // 获取香薰偏好
    const aromaPreferences = [];
    document.querySelectorAll('.aroma-preference input:checked').forEach(checkbox => {
        aromaPreferences.push(checkbox.nextElementSibling.textContent);
    });
    
    // 更新用户信息
    currentUser.username = username;
    currentUser.email = email;
    currentUser.avatar = document.querySelector('.profile-avatar img').src;
    currentUser.preferences = {
        emotions: emotionPreferences,
        aromas: aromaPreferences
    };
    
    // 如果有新密码
    if (password) {
        // 在实际应用中，这里应该调用API更新密码
        console.log('密码已更新');
    }
    
    // 保存到localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // 更新UI
    updateUIForLoggedInUser();
    
    // 关闭模态框
    profileModal.classList.remove('active');
    
    // 显示成功消息
    alert('个人资料已更新');
}

// 显示表单错误
function showFormError(inputId, message) {
    const errorElement = document.getElementById(inputId).nextElementSibling;
    if (errorElement && errorElement.classList.contains('form-error')) {
        errorElement.textContent = message;
    } else {
        const nextElement = document.getElementById(inputId).parentElement.nextElementSibling;
        if (nextElement && nextElement.classList.contains('form-error')) {
            nextElement.textContent = message;
        }
    }
}

// 清除表单错误
function clearFormError(inputId) {
    const errorElement = document.getElementById(inputId).nextElementSibling;
    if (errorElement && errorElement.classList.contains('form-error')) {
        errorElement.textContent = '';
    } else {
        const nextElement = document.getElementById(inputId).parentElement.nextElementSibling;
        if (nextElement && nextElement.classList.contains('form-error')) {
            nextElement.textContent = '';
        }
    }
}

// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 首字母大写
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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