// 全局变量
let currentPersona = 'empathetic';
let currentEmotion = 'neutral'; // 当前情绪状态
let isTyping = false;

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// 只在浏览器环境中执行DOM操作
if (isBrowser) {
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

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', function () {
        // 添加样式
        addStyles();

        // 加载保存的主题
        loadSavedTheme();

        // 显示加载动画
        setTimeout(() => {
            document.getElementById('loaderContainer').classList.add('hidden');
            init();

            // 初始化模态框
            initModals();
        }, 1500);
    });

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
        console.log('初始化应用...');

        // 加载保存的主题
        loadSavedTheme();

        // 设置事件监听器
        setupEventListeners();

        // 自动调整文本区域高度
        autoResizeTextarea();

        // 初始化模态框
        initModals();

        // 加载推荐
        loadRecommendations();

        // 检查登录状态
        checkLoginStatus();

        // 初始化聊天区域滚动
        scrollChatToBottom();
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

        // 情绪类型点击
        document.querySelectorAll('.emotion-type').forEach(type => {
            type.addEventListener('click', () => {
                const emotion = type.dataset.emotion;
                let label, icon, description;

                switch (emotion) {
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

        // 关闭香薰产品模态框
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                // 找到最近的模态框父元素
                const modalElement = closeBtn.closest('.modal');
                if (modalElement) {
                    modalElement.classList.remove('active');
                }
            });
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

        // 确保模态框只能通过关闭按钮关闭，移除点击外部区域关闭的功能
        document.querySelectorAll('.modal').forEach(modal => {
            // 移除所有点击事件
            const newModal = modal.cloneNode(true);
            modal.parentNode.replaceChild(newModal, modal);

            // 重新绑定关闭按钮事件
            const closeBtn = newModal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    newModal.classList.remove('active');
                });
            }

            // 阻止模态框背景的点击事件
            newModal.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // 根据模态框ID重新绑定特定事件
            if (newModal.id === 'authModal') {
                // 重新绑定标签页切换事件
                const authTabs = newModal.querySelectorAll('.auth-tab');
                const loginForm = newModal.querySelector('#loginForm');
                const registerForm = newModal.querySelector('#registerForm');

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

                // 重新绑定密码显示/隐藏切换事件
                newModal.querySelectorAll('.toggle-password').forEach(toggle => {
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

                // 重新绑定表单提交事件
                const loginFormElement = newModal.querySelector('#loginFormElement');
                if (loginFormElement) {
                    loginFormElement.addEventListener('submit', (e) => {
                        e.preventDefault();
                        window.handleLoginSubmit(e);
                    });
                }

                const registerFormElement = newModal.querySelector('#registerFormElement');
                if (registerFormElement) {
                    registerFormElement.addEventListener('submit', (e) => {
                        e.preventDefault();
                        window.handleRegisterSubmit(e);
                    });
                }
            } else if (newModal.id === 'profileModal') {
                // 重新绑定头像上传事件
                const avatarUpload = newModal.querySelector('#avatarUpload');
                if (avatarUpload) {
                    avatarUpload.addEventListener('change', handleAvatarUpload);
                }

                // 重新绑定保存个人资料事件
                const profileSaveButton = newModal.querySelector('.profile-save-button');
                if (profileSaveButton) {
                    profileSaveButton.addEventListener('click', saveProfile);
                }
            } else if (newModal.id === 'productModal') {
                // 产品详情模态框特定事件
                // 暂时没有特定事件需要重新绑定
            }
        });
    }

    // 自动调整文本区域高度
    function autoResizeTextarea() {
        messageInput.addEventListener('input', function () {
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
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';

        const avatarImg = document.createElement('img');
        if (sender === 'user') {
            // 使用用户头像
            const userAvatar = document.querySelector('.user-avatar img');
            avatarImg.src = userAvatar ? userAvatar.src : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
        } else {
            // 使用助手头像
            const personaAvatar = document.querySelector('.persona.active .persona-avatar img');
            avatarImg.src = personaAvatar ? personaAvatar.src : 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
        }
        avatarImg.alt = sender === 'user' ? '用户头像' : '助手头像';

        avatarDiv.appendChild(avatarImg);
        messageDiv.appendChild(avatarDiv);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const paragraph = document.createElement('p');
        paragraph.textContent = content;

        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);

        chatMessages.appendChild(messageDiv);

        // 滚动到底部
        scrollChatToBottom();
    }

    // 滚动聊天区域到底部
    function scrollChatToBottom() {
        const chatMessages = document.getElementById('chatMessages');
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

        switch (currentPersona) {
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

        const cardTitle = document.createElement('h3');
        cardTitle.classList.add('card-title');
        cardTitle.textContent = product.name;

        const cardDescription = document.createElement('p');
        cardDescription.classList.add('card-description');
        cardDescription.textContent = product.description;

        const cardEmotions = document.createElement('div');
        cardEmotions.classList.add('card-emotion');
        cardEmotions.textContent = '适用情绪: ' + product.emotions.join(', ');

        cardContent.appendChild(cardTitle);
        cardContent.appendChild(cardDescription);
        cardContent.appendChild(cardEmotions);

        card.appendChild(cardImage);
        card.appendChild(cardContent);

        // 添加点击事件
        card.addEventListener('click', () => {
            showProductDetails(product);
        });

        return card;
    }

    // 显示产品详情
    function showProductDetails(product) {
        const productModal = document.getElementById('productModal');
        const productDetails = productModal.querySelector('.product-details');

        // 清空现有内容
        productDetails.innerHTML = '';

        // 创建产品图片
        const productImage = document.createElement('div');
        productImage.classList.add('product-image');

        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;

        productImage.appendChild(img);

        // 创建产品信息
        const productInfo = document.createElement('div');
        productInfo.classList.add('product-info');

        const title = document.createElement('h3');
        title.textContent = product.name;

        const description = document.createElement('p');
        description.textContent = product.fullDescription || product.description;

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

        // 使用全局openModal函数打开模态框
        if (typeof window.openModal === 'function') {
            window.openModal('productModal');
        } else {
            // 如果全局函数不可用，则使用传统方式
            productModal.classList.add('active');
            const modalOverlay = document.getElementById('modalOverlay');
            if (modalOverlay) {
                modalOverlay.classList.add('active');
            }
            document.body.classList.add('modal-open');
        }
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
        // 从后端API获取当前用户信息
        fetch('/api/user/profile')
            .then(response => {
                if (response.status === 401) {
                    // 未登录
                    isLoggedIn = false;
                    currentUser = null;
                    return;
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    // 已登录
                    currentUser = data.user;
                    isLoggedIn = true;
                    updateUIForLoggedInUser();
                }
            })
            .catch(error => {
                console.error('检查登录状态失败:', error);
            });
    }

    // 处理登录
    function handleLogin(e) {
        // 阻止默认表单提交
        if (e) e.preventDefault();

        // 注意：实际的表单提交逻辑已经在index.html中的handleLoginSubmit函数中处理
        // 这个函数现在只是作为备用，以防直接点击按钮而不是提交表单
        const loginFormElement = document.getElementById('loginFormElement');
        if (loginFormElement) {
            loginFormElement.dispatchEvent(new Event('submit'));
        }
    }

    // 处理注册
    function handleRegister(e) {
        // 阻止默认表单提交
        if (e) e.preventDefault();

        // 注意：实际的表单提交逻辑已经在index.html中的handleRegisterSubmit函数中处理
        // 这个函数现在只是作为备用，以防直接点击按钮而不是提交表单
        const registerFormElement = document.getElementById('registerFormElement');
        if (registerFormElement) {
            registerFormElement.dispatchEvent(new Event('submit'));
        }
    }

    // 处理退出登录
    function handleLogout() {
        // 发送退出登录请求到后端API
        fetch('/auth/logout')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
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
            })
            .catch(error => {
                console.error('退出登录失败:', error);
            });
    }

    // 更新已登录用户的UI
    function updateUIForLoggedInUser() {
        if (currentUser) {
            // 隐藏登录按钮，显示用户资料
            document.getElementById('authButton').style.display = 'none';
            const userProfile = document.getElementById('userProfile');
            userProfile.style.display = 'flex';

            // 更新用户信息
            document.querySelector('.user-name').textContent = currentUser.username;
            document.querySelector('.user-email').textContent = currentUser.email;

            // 更新用户头像
            const avatarImg = document.querySelector('.user-avatar img');
            if (avatarImg && currentUser.avatar) {
                avatarImg.src = currentUser.avatar + '?t=' + new Date().getTime();
            }

            // 更新个人资料表单
            document.getElementById('profileUsername').value = currentUser.username;
            document.getElementById('profileEmail').value = currentUser.email;

            // 更新个人资料头像
            const profileAvatar = document.querySelector('.profile-avatar img');
            if (profileAvatar && currentUser.avatar) {
                profileAvatar.src = currentUser.avatar + '?t=' + new Date().getTime();
            }

            // 重置情绪和香薰偏好复选框
            document.querySelectorAll('.emotion-preference input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            document.querySelectorAll('.aroma-preference input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            // 设置用户偏好
            if (currentUser.preferences && currentUser.preferences.emotions) {
                currentUser.preferences.emotions.forEach(emotion => {
                    const checkbox = document.getElementById(`emotion${capitalizeFirstLetter(emotion)}`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            if (currentUser.preferences && currentUser.preferences.aromas) {
                currentUser.preferences.aromas.forEach(aroma => {
                    const checkbox = document.getElementById(`aroma${capitalizeFirstLetter(aroma)}`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            // 直接绑定用户菜单交互事件
            setTimeout(function () {
                // 为用户菜单切换按钮添加点击事件
                const userMenuToggle = document.querySelector('.user-menu-toggle');
                const userMenu = document.querySelector('.user-menu');

                if (userMenuToggle && userMenu) {
                    // 移除已有的事件监听器
                    userMenuToggle.removeEventListener('click', toggleUserMenu);

                    // 添加新的事件监听器
                    userMenuToggle.addEventListener('click', toggleUserMenu);

                    // 为菜单项添加点击事件
                    const menuItems = userMenu.querySelectorAll('li');
                    menuItems.forEach((item, index) => {
                        // 移除已有的事件监听器
                        item.removeEventListener('click', handleMenuItemClick);

                        // 添加新的事件监听器，使用闭包保存index
                        item.addEventListener('click', function (e) {
                            handleMenuItemClick(e, index);
                        });
                    });
                }
            }, 100);
        }
    }

    // 切换用户菜单显示/隐藏
    function toggleUserMenu(e) {
        e.stopPropagation();
        e.preventDefault();
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.classList.toggle('active');
            console.log('用户菜单切换 (app.js)');
        }
    }

    // 处理菜单项点击
    function handleMenuItemClick(e, index) {
        e.stopPropagation();
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.classList.remove('active');
        }

        if (index === 0) { // 个人资料
            openModal('profileModal');
        } else if (index === 1) { // 设置
            alert('设置功能即将上线');
        } else if (index === 2) { // 退出登录
            handleLogout();
        }
    }

    // 处理头像上传
    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 检查文件类型
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
            alert('请上传JPG、PNG或GIF格式的图片');
            return;
        }
        
        // 检查文件大小 (限制为5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过5MB');
            return;
        }
        
        // 显示上传中状态
        const avatarImg = document.querySelector('.profile-avatar img');
        const originalSrc = avatarImg.src;
        avatarImg.style.opacity = '0.5';
        
        // 显示加载指示器
        let loadingIndicator = document.querySelector('.avatar-loading');
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'avatar-loading';
            loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            avatarImg.parentNode.appendChild(loadingIndicator);
        }
        
        // 创建表单数据
        const formData = new FormData();
        formData.append('avatar', file);
        
        // 获取CSRF令牌
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            formData.append('csrf_token', csrfToken);
        }
        
        // 创建XHR对象
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/user/avatar');
        
        // 设置回调
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) return;
            
            console.log('状态码:', xhr.status);
            console.log('响应文本:', xhr.responseText);
            
            // 清理UI
            avatarImg.style.opacity = '1';
            if (loadingIndicator) loadingIndicator.remove();
            
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        // 更新头像
                        const newUrl = response.avatar + '?t=' + new Date().getTime();
                        avatarImg.src = newUrl;
                        
                        // 更新用户头像和侧边栏头像
                        const userAvatar = document.querySelector('.user-avatar img');
                        if (userAvatar) userAvatar.src = newUrl;
                        
                        // 更新当前用户对象
                        if (currentUser) currentUser.avatar = response.avatar;
                        
                        alert('头像上传成功');
                    } else {
                        alert(response.message || '上传失败');
                        avatarImg.src = originalSrc;
                    }
                } catch (e) {
                    console.error('解析响应失败:', e);
                    alert('服务器响应格式错误');
                    avatarImg.src = originalSrc;
                }
            } else {
                alert('上传失败，请稍后再试');
                avatarImg.src = originalSrc;
            }
        };
        
        // 发送请求
        xhr.send(formData);
        
        // 清空文件输入框
        e.target.value = '';
    }

    // 保存个人资料
    function saveProfile() {
        const username = document.getElementById('profileUsername').value.trim();
        const email = document.getElementById('profileEmail').value.trim();
        const password = document.getElementById('profilePassword').value.trim();
        
        // 收集情绪偏好
        const emotionPreferences = [];
        document.querySelectorAll('.emotion-preference input[type="checkbox"]:checked').forEach(checkbox => {
            const emotion = checkbox.id.replace('emotion', '').toLowerCase();
            emotionPreferences.push(emotion);
        });
        
        // 收集香薰偏好
        const aromaPreferences = [];
        document.querySelectorAll('.aroma-preference input[type="checkbox"]:checked').forEach(checkbox => {
            const aroma = checkbox.id.replace('aroma', '').toLowerCase();
            aromaPreferences.push(aroma);
        });
        
        // 构建请求数据
        const data = {
            username: username,
            emotion_preferences: emotionPreferences,
            aroma_preferences: aromaPreferences
        };
        
        // 如果输入了新密码，则添加到请求数据中
        if (password) {
            data.password = password;
        }
        
        console.log('保存个人资料:', data);
        
        // 显示保存中状态
        const saveButton = document.querySelector('.profile-save-button');
        const originalText = saveButton.textContent;
        saveButton.textContent = '保存中...';
        saveButton.disabled = true;
        
        // 发送请求到后端API
        fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('保存个人资料响应状态:', response.status);
            
            // 尝试解析响应，无论成功与否
            return response.text().then(text => {
                console.log('原始响应文本:', text);
                
                if (!text || text.trim() === '') {
                    throw new Error('服务器返回空响应');
                }
                
                try {
                    // 尝试解析为JSON
                    const data = JSON.parse(text);
                    if (!response.ok) {
                        throw new Error(data.message || '保存失败');
                    }
                    return data;
                } catch (e) {
                    console.error('JSON解析错误:', e);
                    console.error('响应文本:', text);
                    throw new Error('服务器响应格式错误');
                }
            });
        })
        .then(data => {
            console.log('保存个人资料成功:', data);
            if (data.success) {
                // 更新当前用户对象
                currentUser.username = username;
                currentUser.preferences = {
                    emotions: emotionPreferences,
                    aromas: aromaPreferences
                };
                
                // 更新UI
                document.querySelector('.user-name').textContent = username;
                
                // 关闭模态框
                if (typeof window.closeModal === 'function') {
                    window.closeModal('profileModal');
                } else {
                    const profileModal = document.getElementById('profileModal');
                    if (profileModal) {
                        profileModal.classList.remove('active');
                        const modalOverlay = document.getElementById('modalOverlay');
                        if (modalOverlay) {
                            modalOverlay.classList.remove('active');
                        }
                        document.body.classList.remove('modal-open');
                    }
                }
                
                // 显示成功消息
                alert('个人资料保存成功');
            } else {
                alert(data.message || '保存失败');
            }
        })
        .catch(error => {
            console.error('保存个人资料错误:', error);
            alert(error.message || '保存失败，请稍后再试');
        })
        .finally(() => {
            // 恢复按钮状态
            saveButton.textContent = originalText;
            saveButton.disabled = false;
            
            // 清空密码字段
            document.getElementById('profilePassword').value = '';
        });
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

    // 初始化模态框
    function initModals() {
        // 确保所有模态框的关闭按钮正常工作
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', function () {
                const modal = this.closest('.modal');
                if (modal) {
                    // 使用全局closeModal函数关闭模态框
                    if (typeof window.closeModal === 'function') {
                        window.closeModal(modal.id);
                    } else {
                        // 如果全局函数不可用，则使用传统方式
                        modal.classList.remove('active');

                        // 隐藏遮罩层
                        const modalOverlay = document.getElementById('modalOverlay');
                        if (modalOverlay) {
                            modalOverlay.classList.remove('active');
                        }
                        document.body.classList.remove('modal-open');
                    }
                }
            });
        });

        // 阻止模态框内容区域的点击事件冒泡到模态框本身
        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        });
    }
} 