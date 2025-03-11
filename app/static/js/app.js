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

        // 人设下拉菜单切换
        const personaDropdownToggle = document.querySelector('.persona-dropdown-toggle');
        const personaDropdown = document.getElementById('personaDropdown');
        
        if (personaDropdownToggle && personaDropdown) {
            personaDropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                personaDropdownToggle.classList.toggle('active');
                personaDropdown.classList.toggle('active');
            });
            
            // 点击其他地方关闭下拉菜单
            document.addEventListener('click', () => {
                personaDropdownToggle.classList.remove('active');
                personaDropdown.classList.remove('active');
            });
            
            // 阻止下拉菜单内部点击事件冒泡
            personaDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // 人设选项点击事件
        const personaOptions = document.querySelectorAll('.persona-option');
        personaOptions.forEach(option => {
            option.addEventListener('click', () => {
                const persona = option.dataset.persona;
                changePersona(persona);
                
                // 关闭下拉菜单
                if (personaDropdownToggle && personaDropdown) {
                    personaDropdownToggle.classList.remove('active');
                    personaDropdown.classList.remove('active');
                }
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
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (message === '') return;
        
        // 清空输入框
        messageInput.value = '';
        
        // 调整输入框高度
        autoResizeTextarea();
        
        // 添加用户消息到聊天区域
        addMessageToChat('user', message);
        
        // 分析情绪
        analyzeEmotion(message);
        
        // 显示"正在输入"状态
        showTypingIndicator();
        
        // 获取CSRF令牌
        let csrfToken = '';
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta) {
            csrfToken = csrfMeta.getAttribute('content');
        }
        
        console.log('发送消息:', message, '情绪:', currentEmotion, '人设:', currentPersona);
        
        // 发送消息到后端API
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                message: message,
                emotion: currentEmotion,
                persona: currentPersona
            })
        })
        .then(response => {
            console.log('收到响应状态:', response.status);
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || '网络错误');
                }).catch(e => {
                    throw new Error('网络错误: ' + response.status);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('收到响应数据:', data);
            
            // 移除"正在输入"状态
            removeTypingIndicator();
            
            if (data.success) {
                // 添加助手回复到聊天区域
                addMessageToChat('assistant', data.reply);
                
                // 更新情绪显示
                if (data.emotion) {
                    updateEmotionDisplay(
                        data.emotion_type || 'neutral', 
                        data.emotion || '平静', 
                        data.emotion_icon || 'fa-smile',
                        data.emotion_description || '您当前的情绪状态看起来很平静'
                    );
                }
                
                // 更新推荐
                if (data.recommendations) {
                    updateRecommendations(data.recommendations);
                }
            } else {
                // 显示错误消息
                let errorMessage = '抱歉，我遇到了一些问题，无法回复您的消息。请稍后再试。';
                if (data.message) {
                    errorMessage = `抱歉，出现了问题: ${data.message}`;
                }
                addMessageToChat('assistant', errorMessage);
                
                // 如果用户消息已保存但助手回复保存失败，提示用户刷新页面
                if (data.user_message_saved) {
                    setTimeout(() => {
                        addMessageToChat('assistant', '您的消息已保存，但我的回复保存失败。刷新页面可能会看到完整对话。');
                    }, 1000);
                }
            }
        })
        .catch(error => {
            console.error('发送消息失败:', error);
            
            // 移除"正在输入"状态
            removeTypingIndicator();
            
            // 显示错误消息
            addMessageToChat('assistant', `抱歉，发生了错误: ${error.message || '网络连接问题'}。请检查您的网络连接并稍后再试。`);
            
            // 添加重试按钮
            setTimeout(() => {
                const retryMessage = document.createElement('div');
                retryMessage.className = 'message assistant retry-message';
                retryMessage.innerHTML = `
                    <div class="message-content">
                        <p>您可以 <button class="retry-button">重试发送</button> 这条消息。</p>
                    </div>
                `;
                document.getElementById('chatMessages').appendChild(retryMessage);
                
                // 添加重试按钮点击事件
                const retryButton = retryMessage.querySelector('.retry-button');
                retryButton.addEventListener('click', () => {
                    // 移除重试消息
                    retryMessage.remove();
                    
                    // 重新发送最后一条消息
                    messageInput.value = message;
                    sendMessage();
                });
                
                // 滚动到底部
                scrollChatToBottom();
            }, 1000);
        });
    }

    // 添加消息到聊天
    function addMessageToChat(sender, content, scrollToBottom = true) {
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
            // 使用助手头像 - 从当前选择的人设获取头像
            avatarImg.src = document.getElementById('currentPersonaAvatar').src;
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
        
        // 滚动到底部（如果需要）
        if (scrollToBottom) {
            scrollChatToBottom();
        }
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
        // 使用当前选择的人设头像
        imgElement.src = document.getElementById('currentPersonaAvatar').src;
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
        // 扩展的关键词匹配（与后端保持一致）
        let emotionType = 'neutral';
        let emotionLabel = '平静';
        let emotionIcon = 'fa-smile';
        let emotionDescription = '您当前的情绪状态看起来很平静';

        const lowerMessage = message.toLowerCase();

        // 情绪类别和关键词映射
        const emotionKeywords = {
            'sad': {
                keywords: ['难过', '伤心', '悲', '哭', '失落', '绝望', '痛苦', '遗憾', '哀伤', '忧郁'],
                label: '悲伤',
                icon: 'fa-sad-tear',
                description: '您似乎感到有些悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。'
            },
            'anxious': {
                keywords: ['焦虑', '担心', '紧张', '害怕', '恐惧', '不安', '慌张', '忧虑', '惊慌', '压力'],
                label: '焦虑',
                icon: 'fa-frown',
                description: '您似乎感到有些焦虑。深呼吸可能会有所帮助，尝试放松您的身心。'
            },
            'angry': {
                keywords: ['生气', '愤怒', '烦', '恼火', '暴躁', '恨', '不满', '怒火', '气愤', '厌烦'],
                label: '愤怒',
                icon: 'fa-angry',
                description: '您似乎感到有些愤怒。这是一种正常的情绪，尝试找到健康的方式来表达它。'
            },
            'happy': {
                keywords: ['开心', '高兴', '快乐', '喜悦', '兴奋', '愉快', '欣喜', '满足', '幸福', '欢乐'],
                label: '快乐',
                icon: 'fa-grin-beam',
                description: '您似乎心情不错！享受这美好的时刻，并记住这种感觉。'
            },
            'tired': {
                keywords: ['疲惫', '累', '困', '倦怠', '精疲力竭', '没精神', '疲乏', '疲劳', '困倦', '乏力'],
                label: '疲惫',
                icon: 'fa-tired',
                description: '您似乎感到有些疲惫。适当的休息对身心健康都很重要。'
            },
            'neutral': {
                keywords: ['平静', '安宁', '放松', '舒适', '安心', '宁静', '祥和', '镇定', '安详', '平和'],
                label: '平静',
                icon: 'fa-smile',
                description: '您当前的情绪状态看起来很平静'
            }
        };

        // 计算每种情绪的匹配度
        let bestMatchCount = 0;
        let bestMatchType = 'neutral';

        for (const [type, data] of Object.entries(emotionKeywords)) {
            const matchCount = data.keywords.filter(keyword => lowerMessage.includes(keyword)).length;
            if (matchCount > bestMatchCount) {
                bestMatchCount = matchCount;
                bestMatchType = type;
            }
        }

        // 如果找到匹配的情绪
        if (bestMatchCount > 0) {
            const matchedEmotion = emotionKeywords[bestMatchType];
            emotionType = bestMatchType;
            emotionLabel = matchedEmotion.label;
            emotionIcon = matchedEmotion.icon;
            emotionDescription = matchedEmotion.description;
        }

        // 更新全局情绪状态
        currentEmotion = emotionLabel;

        // 只有当检测到情绪关键词时才更新显示
        if (emotionType !== 'neutral' || currentEmotion === 'neutral') {
            updateEmotionDisplay(emotionType, emotionLabel, emotionIcon, emotionDescription);
        }
    }

    // 更新情绪显示
    function updateEmotionDisplay(emotionType, emotionLabel, emotionIcon, emotionDescription) {
        // 更新当前情绪
        currentEmotion = emotionLabel;

        // 更新情绪图标和标签
        document.querySelector('.emotion-icon i').className = `fas ${emotionIcon}`;
        document.querySelector('.emotion-label').textContent = emotionLabel;
        document.querySelector('.emotion-description').textContent = emotionDescription;

        // 不再需要更新情绪类型的激活状态，因为情绪类型元素已被移除
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
        
        // 保存用户选择的人设到服务器
        if (isLoggedIn) {
            saveUserPersona(persona);
        }

        // 更新当前显示的人设
        updateCurrentPersonaDisplay(persona);

        // 添加系统消息
        const personaName = document.querySelector(`.persona-option[data-persona="${persona}"] h3`).textContent;
        addMessageToChat('assistant', `已切换到${personaName}。我将以这种风格继续我们的对话。`);
        
        // 更新所有助手消息的头像
        updateAssistantAvatars();
    }

    // 更新所有助手消息的头像
    function updateAssistantAvatars() {
        const assistantMessages = document.querySelectorAll('.message.assistant .message-avatar img');
        const currentAvatar = document.getElementById('currentPersonaAvatar').src;
        
        assistantMessages.forEach(avatar => {
            avatar.src = currentAvatar;
        });
    }

    // 更新当前显示的人设
    function updateCurrentPersonaDisplay(persona) {
        const option = document.querySelector(`.persona-option[data-persona="${persona}"]`);
        if (!option) return;
        
        const avatar = option.querySelector('.persona-avatar img').src;
        const name = option.querySelector('h3').textContent;
        const desc = option.querySelector('p').textContent;
        
        // 更新当前人设显示
        document.getElementById('currentPersonaAvatar').src = avatar;
        document.getElementById('currentPersonaName').textContent = name;
        document.getElementById('currentPersonaDesc').textContent = desc;
    }

    // 保存用户选择的人设到服务器
    function saveUserPersona(persona) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        fetch('/api/save-persona', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({ persona: persona })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('人设保存成功');
            } else {
                console.error('人设保存失败:', data.message);
            }
        })
        .catch(error => {
            console.error('人设保存请求失败:', error);
        });
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
    function updateRecommendations(recommendations) {
        recommendationCards.innerHTML = '';

        recommendations.forEach(product => {
            const card = createProductCard(product);
            recommendationCards.appendChild(card);
        });
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
        description.textContent = product.full_description || product.description;

        // 创建情绪效果部分
        const emotionEffectsTitle = document.createElement('h4');
        emotionEffectsTitle.textContent = '情绪效果:';
        
        const emotionEffects = document.createElement('div');
        emotionEffects.classList.add('emotion-effects');
        
        // 为每种情绪创建效果说明
        const emotionEffectMap = {
            '快乐': '增强愉悦感，提升积极情绪，帮助保持乐观心态',
            '悲伤': '舒缓心情，减轻忧郁感，带来温暖和安慰',
            '愤怒': '平复情绪，缓解紧张，帮助恢复平静',
            '焦虑': '减轻压力，舒缓神经，促进放松和安宁',
            '疲惫': '提振精神，恢复活力，改善注意力和集中力',
            '平静': '维持内心平衡，促进冥想和专注'
        };
        
        // 添加当前情绪的效果说明
        if (product.emotions && product.emotions.length > 0) {
            product.emotions.forEach(emotion => {
                const effectItem = document.createElement('div');
                effectItem.classList.add('effect-item');
                
                const emotionName = document.createElement('span');
                emotionName.classList.add('emotion-name');
                emotionName.textContent = emotion + ': ';
                
                const effectDesc = document.createElement('span');
                effectDesc.classList.add('effect-desc');
                effectDesc.textContent = emotionEffectMap[emotion] || '帮助调节情绪，促进身心健康';
                
                effectItem.appendChild(emotionName);
                effectItem.appendChild(effectDesc);
                emotionEffects.appendChild(effectItem);
                
                // 如果是当前情绪，添加高亮
                if (emotion === currentEmotion) {
                    effectItem.classList.add('current-emotion');
                    
                    // 添加推荐理由
                    const recommendReason = document.createElement('div');
                    recommendReason.classList.add('recommend-reason');
                    recommendReason.innerHTML = `<i class="fas fa-star"></i> 推荐理由: 这款香薰特别适合您当前的<strong>${currentEmotion}</strong>情绪状态，可以${emotionEffectMap[emotion] ? emotionEffectMap[emotion].split('，')[0].toLowerCase() : '帮助调节情绪'}。`;
                    emotionEffects.appendChild(recommendReason);
                }
            });
        }

        const emotionsTitle = document.createElement('h4');
        emotionsTitle.textContent = '适用情绪:';

        const emotions = document.createElement('div');
        emotions.classList.add('product-emotions');

        product.emotions.forEach(emotion => {
            const emotionTag = document.createElement('span');
            emotionTag.classList.add('product-emotion');
            emotionTag.textContent = emotion;
            // 如果是当前情绪，添加高亮
            if (emotion === currentEmotion) {
                emotionTag.classList.add('current-emotion');
            }
            emotions.appendChild(emotionTag);
        });

        // 添加使用方法
        const usageTitle = document.createElement('h4');
        usageTitle.textContent = '使用方法:';
        
        const usage = document.createElement('p');
        usage.classList.add('product-usage');
        usage.textContent = '将香薰精油滴入扩香器中，或加入热水中蒸发，让香气弥漫在空间中。也可以滴在手帕上随身携带，需要时轻轻闻嗅。';

        productInfo.appendChild(title);
        productInfo.appendChild(description);
        productInfo.appendChild(emotionEffectsTitle);
        productInfo.appendChild(emotionEffects);
        productInfo.appendChild(emotionsTitle);
        productInfo.appendChild(emotions);
        productInfo.appendChild(usageTitle);
        productInfo.appendChild(usage);

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
            
            /* 重试按钮样式 */
            .retry-message {
                margin-top: 8px;
            }
            
            .retry-button {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.3s;
            }
            
            .retry-button:hover {
                background-color: var(--primary-dark);
            }
            
            /* 产品详情增强样式 */
            .emotion-effects {
                margin-bottom: 15px;
            }
            
            .effect-item {
                margin-bottom: 8px;
                padding: 8px;
                border-radius: 6px;
                background-color: rgba(var(--primary-rgb), 0.05);
            }
            
            .effect-item.current-emotion {
                background-color: rgba(var(--primary-rgb), 0.15);
                border-left: 3px solid var(--primary-color);
            }
            
            .emotion-name {
                font-weight: bold;
                color: var(--primary-color);
            }
            
            .effect-desc {
                color: var(--text-color);
            }
            
            .recommend-reason {
                margin-top: 10px;
                padding: 8px;
                background-color: rgba(var(--accent-rgb), 0.1);
                border-radius: 6px;
                font-style: italic;
            }
            
            .recommend-reason i {
                color: var(--accent-color);
                margin-right: 5px;
            }
            
            .product-emotion.current-emotion {
                background-color: var(--primary-color);
                color: white;
            }
            
            .product-usage {
                line-height: 1.5;
                color: var(--text-color);
                background-color: rgba(var(--primary-rgb), 0.05);
                padding: 10px;
                border-radius: 6px;
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
                // 添加错误处理，如果头像加载失败，使用备用头像
                avatarImg.onerror = function() {
                    console.log('头像加载失败，使用备用头像');
                    this.src = '/static/img/default_avatar.png';
                };
                avatarImg.src = currentUser.avatar + '?t=' + new Date().getTime();
            }
            
            // 更新个人资料表单
            document.getElementById('profileUsername').value = currentUser.username;
            document.getElementById('profileEmail').value = currentUser.email;
            
            // 更新个人资料头像
            const profileAvatar = document.querySelector('.profile-avatar img');
            if (profileAvatar && currentUser.avatar) {
                // 添加错误处理，如果头像加载失败，使用备用头像
                profileAvatar.onerror = function() {
                    console.log('个人资料头像加载失败，使用备用头像');
                    this.src = '/static/img/default_avatar.png';
                };
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
            setTimeout(function() {
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
                        item.addEventListener('click', function(e) {
                            handleMenuItemClick(e, index);
                        });
                    });
                }
            }, 100);
            
            // 加载用户的人设偏好
            loadUserPersona();
            
            // 加载聊天历史
            loadChatHistory();
        }
    }
    
    // 加载用户的人设偏好
    function loadUserPersona() {
        fetch('/api/get-persona')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.persona) {
                    console.log('加载用户人设:', data.persona);
                    changePersona(data.persona);
                } else {
                    console.log('没有保存的人设或加载失败，使用默认人设');
                    updateCurrentPersonaDisplay(currentPersona);
                }
            })
            .catch(error => {
                console.error('加载用户人设失败:', error);
                updateCurrentPersonaDisplay(currentPersona);
            });
    }
    
    // 加载聊天历史
    function loadChatHistory() {
        // 清空聊天区域
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        // 从后端API获取聊天历史
        fetch('/api/chat-history')
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取聊天历史失败');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.messages && data.messages.length > 0) {
                    console.log('加载聊天历史:', data.messages.length, '条消息');
                    
                    // 按时间顺序排序消息（从旧到新）
                    const sortedMessages = data.messages.sort((a, b) => {
                        return new Date(a.timestamp) - new Date(b.timestamp);
                    });
                    
                    // 添加消息到聊天区域
                    sortedMessages.forEach(msg => {
                        const sender = msg.is_user ? 'user' : 'assistant';
                        addMessageToChat(sender, msg.content, false); // 不滚动到底部
                    });
                    
                    // 更新所有助手消息的头像
                    updateAssistantAvatars();
                    
                    // 最后滚动到底部
                    scrollChatToBottom();
                    
                    // 如果有消息，更新情绪显示
                    if (sortedMessages.length > 0) {
                        const lastMessage = sortedMessages[sortedMessages.length - 1];
                        if (!lastMessage.is_user && lastMessage.emotion) {
                            updateEmotionDisplayFromHistory(lastMessage.emotion);
                        }
                        
                        // 如果最后一条消息有人设信息，更新当前人设
                        if (!lastMessage.is_user && lastMessage.persona && lastMessage.persona !== currentPersona) {
                            changePersona(lastMessage.persona);
                        }
                    }
                } else {
                    console.log('没有聊天历史或加载失败');
                    // 添加欢迎消息
                    addMessageToChat('assistant', '你好！我是你的情绪愈疗助手。今天你感觉怎么样？有什么我可以帮助你的吗？');
                }
            })
            .catch(error => {
                console.error('加载聊天历史错误:', error);
                // 添加欢迎消息
                addMessageToChat('assistant', '你好！我是你的情绪愈疗助手。今天你感觉怎么样？有什么我可以帮助你的吗？');
            });
    }
    
    // 从历史记录更新情绪显示
    function updateEmotionDisplayFromHistory(emotion) {
        let emotionType, emotionLabel, emotionIcon, emotionDescription;
        
        switch (emotion) {
            case '快乐':
                emotionType = 'happy';
                emotionIcon = 'fa-grin-beam';
                emotionDescription = '您似乎心情不错！享受这美好的时刻，并记住这种感觉。';
                break;
            case '悲伤':
                emotionType = 'sad';
                emotionIcon = 'fa-sad-tear';
                emotionDescription = '您似乎感到有些悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。';
                break;
            case '愤怒':
                emotionType = 'angry';
                emotionIcon = 'fa-angry';
                emotionDescription = '您似乎感到有些愤怒。这是一种正常的情绪反应，尝试深呼吸可能会有所帮助。';
                break;
            case '焦虑':
                emotionType = 'anxious';
                emotionIcon = 'fa-frown-open';
                emotionDescription = '您似乎感到有些焦虑。这是一种常见的感受，尝试专注于当下可能会有所帮助。';
                break;
            case '疲惫':
                emotionType = 'tired';
                emotionIcon = 'fa-tired';
                emotionDescription = '您似乎感到有些疲惫。给自己一些休息的时间是很重要的。';
                break;
            default:
                emotionType = 'neutral';
                emotionIcon = 'fa-meh';
                emotionDescription = '您的情绪似乎比较平静。';
        }
        
        emotionLabel = emotion;
        
        updateEmotionDisplay(emotionType, emotionLabel, emotionIcon, emotionDescription);
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