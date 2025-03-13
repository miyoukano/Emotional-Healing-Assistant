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
    let aromatherapyProducts = [];

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
        
        // 添加加载指示器
        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('loading-indicator');
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载推荐中...';
        recommendationCards.appendChild(loadingIndicator);
        
        // 检查用户是否登录
        const isLoggedIn = document.querySelector('.user-info') !== null;
        
        // 从API获取随机推荐产品，如果用户已登录则使用个性化推荐
        fetch(`/api/products?per_page=2&random=true&personalized=${isLoggedIn}`)
            .then(response => response.json())
            .then(data => {
                // 移除加载指示器
                recommendationCards.innerHTML = '';
                
                if (data.success && data.products && data.products.length > 0) {
                    // 更新全局产品数据
                    aromatherapyProducts = data.products;
                    
                    // 如果是个性化推荐，显示提示信息
                    if (data.personalized && data.dominant_emotions) {
                        const personalizationInfo = document.createElement('div');
                        personalizationInfo.classList.add('personalization-info');
                        personalizationInfo.innerHTML = `<i class="fas fa-info-circle"></i> 根据您的情绪历史（${data.dominant_emotions.join('、')}）推荐`;
                        recommendationCards.appendChild(personalizationInfo);
                    }
                    
                    // 显示产品
                    data.products.forEach(product => {
                        const card = createProductCard(product);
                        recommendationCards.appendChild(card);
                    });
                    
                    // 添加刷新按钮
                    const refreshButton = document.createElement('button');
                    refreshButton.classList.add('refresh-recommendations');
                    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> 换一批';
                    refreshButton.addEventListener('click', loadRecommendations);
                    recommendationCards.appendChild(refreshButton);
                } else {
                    console.error('获取产品数据失败:', data);
                    // 如果API请求失败，显示默认推荐
                    showDefaultRecommendations();
                }
            })
            .catch(error => {
                // 移除加载指示器
                recommendationCards.innerHTML = '';
                
                console.error('获取产品数据出错:', error);
                // 如果API请求出错，显示默认推荐
                showDefaultRecommendations();
            });
    }
    
    // 显示默认推荐
    function showDefaultRecommendations() {
        recommendationCards.innerHTML = '';
        
        // 默认产品数据
        const defaultProducts = [
            {
                id: 1,
                name: '薰衣草精油',
                description: '舒缓放松，帮助睡眠，缓解焦虑',
                image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                emotions: ['焦虑', '压力', '失眠']
            },
            {
                id: 2,
                name: '柠檬香薰蜡烛',
                description: '提振精神，增强专注力，改善情绪',
                image: 'https://images.unsplash.com/photo-1602178506153-472ef4810278?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                emotions: ['疲惫', '注意力不集中', '情绪低落']
            }
        ];
        
        defaultProducts.forEach(product => {
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
        // 使用产品图片或默认图片
        img.src = product.image || 'https://via.placeholder.com/300x200?text=无图片';
        img.alt = product.name;
        img.onerror = function() {
            // 如果图片加载失败，使用默认图片
            this.src = 'https://via.placeholder.com/300x200?text=无图片';
        };

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
        
        // 确保emotions是数组
        const emotions = Array.isArray(product.emotions) ? product.emotions : [];
        cardEmotions.textContent = emotions.length > 0 ? 
            '适用情绪: ' + emotions.join(', ') : 
            '适用情绪: 多种情绪';

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
        
        // 显示加载中
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('loading-indicator');
        loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载产品详情...';
        productDetails.appendChild(loadingElement);
        
        // 显示模态框
        productModal.classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
        document.body.classList.add('modal-open');
        
        // 从API获取产品详情
        fetch(`/api/product_details/${product.id}`)
            .then(response => response.json())
            .then(data => {
                // 清空加载指示器
                productDetails.innerHTML = '';
                
                if (data.success && data.product) {
                    const productData = data.product;
                    
                    // 创建产品图片
                    const productImage = document.createElement('div');
                    productImage.classList.add('product-image');

                    const img = document.createElement('img');
                    img.src = productData.image || 'https://via.placeholder.com/300x200?text=无图片';
                    img.alt = productData.name;

                    productImage.appendChild(img);

                    // 创建产品信息
                    const productInfo = document.createElement('div');
                    productInfo.classList.add('product-info');

                    const title = document.createElement('h3');
                    title.textContent = productData.name;

                    const description = document.createElement('p');
                    description.textContent = productData.full_description || productData.description;

                    // 添加基本信息到产品信息区域
                    productInfo.appendChild(title);
                    productInfo.appendChild(description);

                    // 首先添加产品图片和基本信息
                    productDetails.appendChild(productImage);
                    productDetails.appendChild(productInfo);

                    // 创建情绪效果部分 - 移至最下方
                    const emotionEffectsTitle = document.createElement('h4');
                    emotionEffectsTitle.textContent = '情绪效果:';
                    emotionEffectsTitle.classList.add('effects-header');
                    
                    // 创建一个空的情绪效果容器
                    const emotionEffectsContainer = document.createElement('div');
                    emotionEffectsContainer.classList.add('emotion-effects-container');
                    
                    // 常见香薰成分库及其特性
                    const aromaComponentLibrary = {
                        '薰衣草': {
                            '特性': '舒缓、放松、助眠',
                            '情绪效果': {
                                '焦虑': '薰衣草精油中的乙酸芳樟酯能够调节中枢神经系统，降低血清素水平，舒缓焦躁不安的心绪',
                                '失眠': '薰衣草的平静香气可以温和地刺激松果体释放褪黑素，帮助您进入深度睡眠状态',
                                '悲伤': '柔和的薰衣草气息能够平衡情绪波动，带来心灵的安定与慰藉',
                                '疲惫': '温和的薰衣草香气能平衡自律神经系统，缓解日常压力带来的身心疲惫',
                                '愤怒': '薰衣草的温柔香气能够平复急促的呼吸，降低交感神经的兴奋度，让思绪回归冷静',
                                '平静': '薰衣草的草本芳香能够维持心绪的宁静，延长放松状态'
                            }
                        },
                        '柠檬': {
                            '特性': '提神、振奋、清新',
                            '情绪效果': {
                                '快乐': '柠檬精油的清新柑橘香气能够立刻激活大脑奖励中枢，提升愉悦感和活力',
                                '疲惫': '柠檬中的柠檬烯能够刺激中枢神经系统，让您瞬间精神焕发，告别困倦',
                                '注意力不集中': '清新的柑橘香气可以提高大脑警觉性，帮助您重新聚焦',
                                '悲伤': '明亮的柠檬香气如同阳光般驱散阴霾，为心情带来轻盈感',
                                '焦虑': '柠檬的活泼气息能够重置紧张的心绪，带来轻松感',
                                '平静': '温和的柠檬香气能够保持头脑清醒的同时带来内心的平和'
                            }
                        },
                        '佛手柑': {
                            '特性': '平衡、舒缓、提振',
                            '情绪效果': {
                                '焦虑': '佛手柑精油中的醇类成分能调节自律神经系统，缓解紧张情绪',
                                '抑郁': '佛手柑的阳光香气能自然提升血清素水平，改善低落情绪',
                                '愤怒': '佛手柑的均衡特性可以调节呼吸节奏，帮助恢复情绪平衡',
                                '疲惫': '清新的柑橘调和草本香气能提振精神，同时不会过度刺激',
                                '平静': '佛手柑的多层次香气可以安抚神经系统，维持稳定心态'
                            }
                        },
                        '茉莉花': {
                            '特性': '提升、愉悦、浪漫',
                            '情绪效果': {
                                '抑郁': '茉莉花独特的馥郁香气能够刺激大脑释放多巴胺和血清素，提升情绪',
                                '自卑': '茉莉花温暖的花香能增强自信感，减轻自我怀疑',
                                '焦虑': '茉莉花香气的层次感能够分散对焦虑源的注意力，重新定向思维',
                                '悲伤': '甜美的茉莉花香能唤起美好回忆，减轻心灵的沉重感',
                                '平静': '细腻的茉莉花香带来感官的愉悦和心灵的宁静'
                            }
                        },
                        '薄荷': {
                            '特性': '清醒、冷静、集中',
                            '情绪效果': {
                                '疲惫': '薄荷醇可以迅速刺激三叉神经，立即唤醒大脑，消除精神倦怠',
                                '愤怒': '清凉的薄荷香气能够降低体感温度，缓解情绪"过热"状态',
                                '注意力不集中': '强劲的薄荷香气能够提高警觉性和专注力，适合学习和工作场景',
                                '头痛': '薄荷中的薄荷醇能舒缓紧张的血管，缓解压力导致的头痛',
                                '平静': '经过调和的薄荷精油能在提供清醒感的同时不过度刺激神经系统'
                            }
                        },
                        '檀香': {
                            '特性': '沉稳、冥想、根基',
                            '情绪效果': {
                                '焦虑': '檀香木中的檀香醇有助于降低皮质醇水平，减轻慢性焦虑',
                                '平静': '深沉而温暖的檀香气息能够引导意识进入冥想状态，促进α脑波活动',
                                '失眠': '檀香的厚重感能够给予心灵安全感，缓解夜间思绪过度活跃',
                                '悲伤': '沉稳的檀香能够提供情感支持，如同一个无声的知己',
                                '精神不集中': '檀香的深沉基调帮助心神安定，回归当下'
                            }
                        },
                        '玫瑰': {
                            '特性': '滋养、平衡、情感',
                            '情绪效果': {
                                '悲伤': '玫瑰精油中的醇类成分能滋养心灵，如同情感的抚慰者，缓解失落感',
                                '焦虑': '多层次的玫瑰香气能够调节心率和呼吸，缓解身体表现出的焦虑症状',
                                '情绪波动': '玫瑰精油有助于平衡荷尔蒙水平，特别适合缓解情绪起伏',
                                '疲惫': '玫瑰的温暖花香能够舒缓情绪疲惫，恢复内心的生机',
                                '平静': '古老的玫瑰香气能够唤起内心深处的平静，带来心灵满足感'
                            }
                        },
                        '洋甘菊': {
                            '特性': '温和、舒缓、平静',
                            '情绪效果': {
                                '焦虑': '洋甘菊中的桉叶素和α-俾斯波萜等成分能够自然舒缓神经系统，特别适合敏感体质',
                                '愤怒': '温和的甘菊香气能够缓解情绪冲动，防止过激反应',
                                '失眠': '洋甘菊的平和特性能够帮助神经系统从"战斗或逃跑"模式转换到休息状态',
                                '悲伤': '甘菊的温柔抚慰能够舒缓悲伤带来的情绪紧张',
                                '平静': '持久的洋甘菊香气创造出情绪稳定的环境，延长平静状态'
                            }
                        },
                        '柑橘': {
                            '特性': '振奋、活力、乐观',
                            '情绪效果': {
                                '快乐': '柑橘精油中的d-柠檬烯能够激活大脑中的"奖赏通路"，增强幸福感',
                                '抑郁': '明亮的柑橘香气能够迅速改变大脑化学平衡，减轻低落情绪',
                                '疲惫': '清新的柑橘香气如同阳光般注入活力，让身心迅速唤醒',
                                '消极思维': '柑橘的乐观气息有助于打破负面思维循环，重建积极心态',
                                '平静': '平衡的柑橘香气能在提供活力的同时不打扰内心的安宁'
                            }
                        },
                        '杉木': {
                            '特性': '沉稳、集中、正念',
                            '情绪效果': {
                                '焦虑': '杉木精油的接地气息能够稳定浮躁的思绪，带来森林般的宁静',
                                '注意力分散': '杉木的清新木质调有助于集中注意力，提高工作和学习效率',
                                '缺乏动力': '振奋的森林气息能够增强意志力和坚持性',
                                '压力': '杉木特有的松油醇成分能够降低血压和心率，减轻身体压力反应',
                                '平静': '杉木的深远香气营造出空间感，让心灵找到休憩之所'
                            }
                        },
                        '乳香': {
                            '特性': '冥想、精神、净化',
                            '情绪效果': {
                                '焦虑': '乳香中的乳香酸能够减轻焦虑症状，历史上一直被用于宗教仪式中创造静心环境',
                                '悲伤': '深沉的乳香香气能够支持情感处理过程，帮助接纳和释放悲伤',
                                '精神疲惫': '乳香能够平衡脑部活动，减轻精神耗竭感',
                                '冥想困难': '乳香特有的专注性香气能够帮助思绪沉淀，达到心灵澄明',
                                '平静': '乳香的神圣气息能够创造出庄严而平静的氛围，支持深度放松'
                            }
                        }
                    };
                    
                    // 为每种情绪创建效果说明时的基础模板
                    const emotionEffectBaseTemplates = {
                        '快乐': '{{成分}}的明亮特性能够进一步提升您愉悦的心情！{{效果描述}}',
                        '悲伤': '温柔的{{成分}}能够轻抚您的心灵。{{效果描述}}',
                        '愤怒': '{{成分}}的强效作用能迅速平复激动的情绪。{{效果描述}}',
                        '焦虑': '{{成分}}的芳香环绕着您，{{效果描述}}',
                        '疲惫': '{{成分}}的活力功效能让您恢复精神，{{效果描述}}',
                        '平静': '精选{{成分}}的珍贵提取物，{{效果描述}}'
                    };
                    
                    // 创建静态emotionEffectMap对象（作为回退选项）
                    const emotionEffectMap = {
                        '快乐': '这款香薰的柑橘精华会立刻点亮您的感官！阳光般的香气自然提升多巴胺水平，让微笑更持久。',
                        '悲伤': '温柔的薰衣草与玫瑰精油完美融合，仿佛是一次情感的安抚旅程。它不会强行改变您的感受，而是像一位老朋友，静静地陪伴、聆听，并在适当的时刻送上一个理解的拥抱。',
                        '愤怒': '佛手柑精油调节呼吸频率，薄荷醇成分降低肌肉紧张度，乳香提取物激活大脑前额叶，恢复理性思考能力。',
                        '焦虑': '薰衣草精油特殊成分可减少焦虑相关神经递质活动。轻轻一闻，紧绷的神经立刻被温柔地松开，就像是被一条柔软的丝绸覆盖。',
                        '疲惫': '薄荷醇分子直接刺激大脑觉醒中枢，柠檬草提取物增强氧气吸收效率，十分钟内感受明显的精力提升。',
                        '平静': '这款香薰包含珍贵的檀香木和白茶精华，能够自然诱导α脑波活动，带来深度平静。轻柔的香气如细雨滋润心田，洗去一天的浮躁与喧嚣。'
                    };
                    
                    // 全局调试开关，上线时设置为false
                    const DEBUG_MODE = false;
                    
                    if (DEBUG_MODE) {
                        console.log('产品数据:', productData);
                    }
                    
                    // 从产品描述或名称中提取可能的成分
                    function extractPossibleComponents(product) {
                        try {
                            const possibleComponents = [];
                            // 为每个提取的成分存储其匹配分数
                            const componentScores = {};
                            const allComponents = Object.keys(aromaComponentLibrary);
                            
                            // 扩展别名词典，增加更多变体
                            const componentAliases = {
                                '薰衣草': ['lavender', '薰草', '熏衣草', '紫花薰衣草', '薰衣', 'LAV', '法国薰衣草', '真正薰衣草', '狭叶薰衣草'],
                                '柠檬': ['柠', 'lemon', '柑', '清柠', '柠檬香', '柠檬精华', '柠檬香气', '柠檬皮', '意大利柠檬', '黄柠檬'],
                                '佛手柑': ['佛手', '香柑', 'bergamot', '柑橘精油', '佛手柑香', '柠檬佛手柑', '佛手柑皮', '佛手柑果', 'BERG'],
                                '茉莉花': ['茉莉', 'jasmine', '花香', '茉莉香', '茉莉精油', '白茉莉', '大花茉莉', '茉莉香气', 'JAS'],
                                '薄荷': ['mint', '薄荷精油', '薄荷醇', '清薄荷', '胡椒薄荷', '野薄荷', '留兰香', '绿薄荷', '薄荷叶', 'MINT'],
                                '檀香': ['檀香木', 'sandalwood', '白檀', '檀香精油', '印度檀香', '澳洲檀香', '檀木', '檀香粉', 'SNDL'],
                                '玫瑰': ['rose', '玫瑰精油', '玫瑰花', '玫瑰香', '大马士革玫瑰', '保加利亚玫瑰', '玫瑰花瓣', '玫瑰水', 'ROSE'],
                                '洋甘菊': ['甘菊', 'chamomile', '菊花精油', '德国洋甘菊', '罗马洋甘菊', '蓝色洋甘菊', '甘菊花', 'CHAM'],
                                '柑橘': ['橙', '柑', '橘', 'citrus', '柑橘精油', '橙花', '甜橙', '橘皮', '柑橘类', '甜橙油', '佛手柑'],
                                '杉木': ['杉', '松', 'cedar', 'pine', '松木', '雪松', '冷杉', '红雪松', '杉木油', '松针油', '香柏'],
                                '乳香': ['frankincense', '乳香精油', '香薰乳香', '乳香树脂', '印度乳香', '阿拉伯乳香', 'FRNK', '乳香油'],
                                '柏木': ['柏', 'cypress', '柏树', '柏木精油', '地中海柏木', '日本扁柏', '香柏木'],
                                '依兰': ['ylang', '依兰依兰', '依兰花', '依兰精油', '依兰香气', 'ylang-ylang'],
                                '葡萄柚': ['grapefruit', '西柚', '葡萄柚精油', '红葡萄柚', '白西柚'],
                                '天竺葵': ['geranium', '天竺葵精油', '玫瑰天竺葵', '香叶天竺葵'],
                                '肉桂': ['cinnamon', '桂皮', '肉桂精油', '锡兰肉桂', '中国肉桂'],
                                '迷迭香': ['rosemary', '迷迭香精油', '迷迭香叶', '迷迭香香气'],
                                '香根草': ['vetiver', '岩兰草', '香根草精油', '香根草根']
                            };
                            
                            // 创建一个包含所有别名和原始成分的映射
                            const aliasMapping = {};
                            for (const [component, aliases] of Object.entries(componentAliases)) {
                                aliasMapping[component] = component; // 映射自身
                                for (const alias of aliases) {
                                    aliasMapping[alias] = component;
                                }
                            }
                            
                            // 创建一个包含所有别名和原始成分的数组
                            const allSearchTerms = [...allComponents];
                            for (const component of allComponents) {
                                if (componentAliases[component]) {
                                    allSearchTerms.push(...componentAliases[component]);
                                }
                            }
                            
                            // 按长度降序排序搜索术语，以确保优先匹配较长的术语
                            allSearchTerms.sort((a, b) => b.length - a.length);
                            
                            // 拆分产品信息，允许对不同字段给予不同权重
                            const productName = product.name || '';
                            const productDesc = product.description || '';
                            const productFullDesc = product.full_description || '';
                            
                            // 函数：通过关键词搜索提取成分
                            function extractComponentsByKeywords(text, weightFactor = 1) {
                                if (!text) return;
                                
                                const textLower = text.toLowerCase();
                                
                                // 精确匹配 - 有最高权重
                                for (const term of allSearchTerms) {
                                    // 构建正则表达式，检查词边界
                                    const regex = new RegExp(`(^|[^\\p{L}])${term}([^\\p{L}]|$)`, 'iu');
                                    if (regex.test(text) || text.includes(term)) {
                                        const mappedComponent = aliasMapping[term] || term;
                                        
                                        // 如果是有效成分
                                        if (aromaComponentLibrary[mappedComponent]) {
                                            // 计算匹配分数 (更长的词和精确匹配有更高权重)
                                            const score = (term.length * 2) * weightFactor;
                                            
                                            if (!componentScores[mappedComponent]) {
                                                componentScores[mappedComponent] = 0;
                                            }
                                            componentScores[mappedComponent] += score;
                                            
                                            // 添加到可能成分列表，但避免重复
                                            if (!possibleComponents.includes(mappedComponent)) {
                                                possibleComponents.push(mappedComponent);
                                            }
                                        }
                                    }
                                }
                                
                                // 语境分析 - 寻找成分相关语境线索
                                const contextClues = {
                                    '香气': 3,
                                    '精油': 3,
                                    '香薰': 3,
                                    '提取': 2,
                                    '芳香': 2,
                                    '成分': 2,
                                    '香味': 2,
                                    '含有': 1.5,
                                    '混合': 1.5,
                                    '融合': 1.5
                                };
                                
                                // 检查是否有语境线索，增加关联成分的权重
                                for (const [clue, clueWeight] of Object.entries(contextClues)) {
                                    if (textLower.includes(clue)) {
                                        // 如果文本包含语境线索，增加已识别成分的权重
                                        for (const component in componentScores) {
                                            componentScores[component] *= clueWeight;
                                        }
                                    }
                                }
                            }
                            
                            // 对产品名称赋予最高权重（5倍）
                            extractComponentsByKeywords(productName, 5);
                            
                            // 对产品描述赋予中等权重（3倍）
                            extractComponentsByKeywords(productDesc, 3);
                            
                            // 对完整描述赋予标准权重
                            extractComponentsByKeywords(productFullDesc, 1);
                            
                            // 如果没有找到任何成分，尝试基于关键词提示进行猜测
                            if (possibleComponents.length === 0) {
                                // 关键词映射到可能的成分
                                const keywordComponentMapping = {
                                    '放松': ['薰衣草', '洋甘菊'],
                                    '睡眠': ['薰衣草', '洋甘菊', '檀香'],
                                    '助眠': ['薰衣草', '洋甘菊', '柏木'],
                                    '镇静': ['薰衣草', '洋甘菊', '乳香'],
                                    '宁神': ['薰衣草', '檀香', '乳香'],
                                    
                                    '提神': ['薄荷', '柠檬', '葡萄柚'],
                                    '振奋': ['柠檬', '柑橘', '薄荷'],
                                    '清新': ['薄荷', '柠檬', '柑橘', '依兰'],
                                    '醒脑': ['薄荷', '迷迭香', '柠檬'],
                                    '集中': ['薄荷', '迷迭香', '柠檬'],
                                    
                                    '平静': ['檀香', '乳香', '洋甘菊'],
                                    '冥想': ['檀香', '乳香', '柏木'],
                                    '宁静': ['檀香', '乳香', '薰衣草'],
                                    '安抚': ['洋甘菊', '薰衣草', '乳香'],
                                    
                                    '愉悦': ['柑橘', '茉莉花', '依兰'],
                                    '快乐': ['柑橘', '柠檬', '葡萄柚'],
                                    '开心': ['柑橘', '柠檬', '茉莉花'],
                                    '喜悦': ['柑橘', '依兰', '天竺葵'],
                                    '乐观': ['柑橘', '柠檬', '依兰'],
                                    
                                    '舒缓': ['玫瑰', '佛手柑', '薰衣草'],
                                    '抚慰': ['玫瑰', '佛手柑', '洋甘菊'],
                                    '情感': ['玫瑰', '茉莉花', '依兰'],
                                    '浪漫': ['玫瑰', '茉莉花', '依兰'],
                                    '温暖': ['玫瑰', '肉桂', '天竺葵'],
                                    
                                    '清凉': ['薄荷', '柠檬', '杉木'],
                                    '森林': ['杉木', '柏木', '香根草'],
                                    '木质': ['檀香', '杉木', '柏木'],
                                    '花香': ['玫瑰', '茉莉花', '依兰'],
                                    '柑橘': ['柠檬', '柑橘', '葡萄柚'],
                                    '草本': ['薄荷', '迷迭香', '洋甘菊'],
                                    '东方': ['檀香', '乳香', '香根草']
                                };
                                
                                // 合并所有文本进行关键词搜索
                                const combinedText = (productName + ' ' + productDesc + ' ' + productFullDesc).toLowerCase();
                                
                                // 检查关键词并分配相应的成分
                                for (const [keyword, components] of Object.entries(keywordComponentMapping)) {
                                    if (combinedText.includes(keyword)) {
                                        // 将这些成分添加到可能的成分中，同时记录一个低分数
                                        components.forEach((component, index) => {
                                            // 分配递减的分数 (第一个有最高权重)
                                            const score = (3 - Math.min(index, 2)) * 2;
                                            
                                            if (!componentScores[component]) {
                                                componentScores[component] = 0;
                                            }
                                            componentScores[component] += score;
                                            
                                            if (!possibleComponents.includes(component)) {
                                                possibleComponents.push(component);
                                            }
                                        });
                                    }
                                }
                            }
                            
                            // 如果仍然没有找到任何成分，基于情绪类型推荐成分
                            if (possibleComponents.length === 0 && product.emotions && product.emotions.length > 0) {
                                const emotion = product.emotions[0];
                                const normalizedEmotion = normalizeEmotionKey(emotion);
                                
                                // 为每种情绪提供更多样化的成分选择
                                const emotionComponentMap = {
                                    '快乐': ['柑橘', '柠檬', '葡萄柚', '依兰', '茉莉花'],
                                    '悲伤': ['薰衣草', '玫瑰', '洋甘菊', '乳香', '檀香'],
                                    '愤怒': ['佛手柑', '薄荷', '柏木', '洋甘菊', '薰衣草'],
                                    '焦虑': ['薰衣草', '洋甘菊', '乳香', '佛手柑', '檀香'],
                                    '疲惫': ['薄荷', '柠檬', '迷迭香', '葡萄柚', '柑橘'],
                                    '平静': ['檀香', '乳香', '薰衣草', '洋甘菊', '柏木']
                                };
                                
                                // 获取当前情绪的推荐成分列表
                                const recommendedComponents = emotionComponentMap[normalizedEmotion] || ['薰衣草', '佛手柑'];
                                
                                // 随机选择2个成分（避免每次都是同样的组合）
                                const shuffled = [...recommendedComponents].sort(() => 0.5 - Math.random());
                                return shuffled.slice(0, 2);
                            } else if (possibleComponents.length === 0) {
                                // 完全无法确定成分时的默认值
                                return ['薰衣草', '佛手柑']; 
                            }
                            
                            // 如果找到了可能的成分，根据分数排序
                            if (possibleComponents.length > 0) {
                                possibleComponents.sort((a, b) => componentScores[b] - componentScores[a]);
                                
                                if (DEBUG_MODE) {
                                    console.log('成分分数:', componentScores);
                                }
                                
                                // 最多返回两种分数最高的成分
                                return possibleComponents.slice(0, 2);
                            }
                            
                            return ['薰衣草', '佛手柑']; // 兜底方案
                        } catch (error) {
                            console.error('提取香薰成分时出错:', error);
                            return ['薰衣草'];  // 出错时返回最安全的默认成分
                        }
                    }
                    
                    // 尝试提取可能的成分
                    let possibleComponents = [];
                    try {
                        possibleComponents = extractPossibleComponents(productData);
                        if (DEBUG_MODE) {
                            console.log('已提取的成分:', possibleComponents);  // 调试信息
                        }
                    } catch (error) {
                        console.error('提取成分时出错:', error);
                        // 出错时不影响页面继续加载
                    }
                    
                    // 添加当前情绪的效果说明
                    if (productData.emotions && productData.emotions.length > 0) {
                        // 创建单个合并的效果项
                        const effectItem = document.createElement('div');
                        effectItem.classList.add('effect-item');
                        
                        // 提取所有情绪
                        const emotionNames = productData.emotions.map(emotion => {
                            return normalizeEmotionKey(emotion);
                        });
                        
                        // 情绪名称部分
                        const emotionName = document.createElement('span');
                        emotionName.classList.add('emotion-name');
                        
                        // 连接所有情绪名称
                        emotionName.textContent = emotionNames.join('、') + ': ';
                        
                        const effectDesc = document.createElement('span');
                        effectDesc.classList.add('effect-desc');
                        
                        // 生成合并的效果描述
                        let descriptionText = '';
                        try {
                            // 只有在有成分的情况下才生成具体描述
                            if (possibleComponents && possibleComponents.length > 0) {
                                // 主要成分
                                const mainComponent = possibleComponents[0];
                                // 可能的次要成分
                                const secondaryComponent = possibleComponents.length > 1 ? possibleComponents[1] : null;
                                
                                // 成分说明
                                let componentDesc = secondaryComponent ? 
                                    `${mainComponent}和${secondaryComponent}` : mainComponent;
                                
                                // 成分特性
                                let componentEffect = '';
                                if (aromaComponentLibrary[mainComponent] && aromaComponentLibrary[mainComponent]['特性']) {
                                    componentEffect = aromaComponentLibrary[mainComponent]['特性'];
                                }
                                
                                // 针对多种情绪的综合效果描述
                                let emotionEffects = [];
                                emotionNames.forEach(emotion => {
                                    if (aromaComponentLibrary[mainComponent] && 
                                        aromaComponentLibrary[mainComponent]['情绪效果'] && 
                                        aromaComponentLibrary[mainComponent]['情绪效果'][emotion]) {
                                        emotionEffects.push(aromaComponentLibrary[mainComponent]['情绪效果'][emotion]);
                                    }
                                });
                                
                                // 如果没有找到针对特定情绪的效果，使用通用描述
                                if (emotionEffects.length === 0) {
                                    const effectsList = emotionNames.map(emotion => `${emotion}情绪`).join('、');
                                    emotionEffects.push(`适合${effectsList}的调节，带来平衡与舒适`);
                                }
                                
                                // 组合最终描述文本
                                descriptionText = `${componentDesc}具有${componentEffect}的特性，${emotionEffects.join('；此外，')}`;
                            } else {
                                // 使用默认描述（没有识别到特定成分时）
                                let defaultDescriptions = [];
                                emotionNames.forEach(emotion => {
                                    if (emotionEffectMap[emotion]) {
                                        defaultDescriptions.push(emotionEffectMap[emotion]);
                                    }
                                });
                                
                                if (defaultDescriptions.length > 0) {
                                    descriptionText = defaultDescriptions.join('；此外，');
                                } else {
                                    descriptionText = '帮助调节情绪，促进身心健康';
                                }
                            }
                        } catch (error) {
                            console.error('生成描述时出错:', error);
                            descriptionText = '帮助调节情绪，促进身心健康';
                        }
                        
                        if (DEBUG_MODE) {
                            console.log(`情绪效果描述:`, descriptionText);
                        }
                        
                        // 处理特殊格式
                        effectDesc.innerHTML = '';
                        
                        // 按行分割文本
                        const lines = descriptionText.split('\n');
                        for (let i = 0; i < lines.length; i++) {
                            let line = lines[i];
                            
                            // 创建行容器
                            const lineContainer = document.createElement('div');
                            
                            // 处理表情符号
                            let processedLine = '';
                            
                            for (let j = 0; j < line.length; j++) {
                                const char = line[j];
                                
                                // 检测表情符号
                                if (/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}💫]/u.test(char)) {
                                    // 如果之前有普通文本，先添加
                                    if (processedLine) {
                                        lineContainer.appendChild(document.createTextNode(processedLine));
                                        processedLine = '';
                                    }
                                    
                                    // 添加表情符号
                                    const emojiSpan = document.createElement('span');
                                    emojiSpan.className = 'emoji';
                                    emojiSpan.textContent = char;
                                    lineContainer.appendChild(emojiSpan);
                                } 
                                // 处理项目符号 (·)
                                else if (char === '·') {
                                    // 如果之前有普通文本，先添加
                                    if (processedLine) {
                                        lineContainer.appendChild(document.createTextNode(processedLine));
                                        processedLine = '';
                                    }
                                    
                                    // 添加项目符号
                                    const bulletSpan = document.createElement('span');
                                    bulletSpan.className = 'bullet';
                                    bulletSpan.textContent = char;
                                    lineContainer.appendChild(bulletSpan);
                                } 
                                else {
                                    // 普通文本累加
                                    processedLine += char;
                                }
                            }
                            
                            // 添加剩余的文本
                            if (processedLine) {
                                lineContainer.appendChild(document.createTextNode(processedLine));
                            }
                            
                            // 添加行到描述
                            effectDesc.appendChild(lineContainer);
                            
                            // 如果不是最后一行，添加换行
                            if (i < lines.length - 1) {
                                effectDesc.appendChild(document.createElement('br'));
                            }
                        }
                        
                        effectItem.appendChild(emotionName);
                        effectItem.appendChild(effectDesc);
                        emotionEffectsContainer.appendChild(effectItem);
                        
                        // 如果当前情绪包含在产品支持的情绪中，添加高亮
                        if (currentEmotion && emotionNames.includes(currentEmotion)) {
                            effectItem.classList.add('current-emotion');
                            // 不再添加推荐理由
                        }
                    }
                    
                    // 将情绪效果容器添加到页面最下方
                    const emotionEffectsSection = document.createElement('div');
                    emotionEffectsSection.classList.add('emotion-effects-section');
                    emotionEffectsSection.appendChild(emotionEffectsTitle);
                    emotionEffectsSection.appendChild(emotionEffectsContainer);
                    
                    // 最后添加情绪效果部分
                    productDetails.appendChild(emotionEffectsSection);
                    
                    // 添加价格信息（如果有）
                    if (productData.price) {
                        const priceInfo = document.createElement('div');
                        priceInfo.classList.add('price-info');
                        priceInfo.innerHTML = `<strong>价格:</strong> ¥${productData.price.toFixed(2)}`;
                        productInfo.appendChild(priceInfo);
                    }
                    
                    // 添加评分信息（如果有）
                    if (productData.rating) {
                        const ratingInfo = document.createElement('div');
                        ratingInfo.classList.add('rating-info');
                        
                        // 创建星星评分
                        let starsHtml = '';
                        const fullStars = Math.floor(productData.rating);
                        const halfStar = productData.rating % 1 >= 0.5;
                        
                        for (let i = 1; i <= 5; i++) {
                            if (i <= fullStars) {
                                starsHtml += '<i class="fas fa-star"></i>';
                            } else if (i === fullStars + 1 && halfStar) {
                                starsHtml += '<i class="fas fa-star-half-alt"></i>';
                            } else {
                                starsHtml += '<i class="far fa-star"></i>';
                            }
                        }
                        
                        ratingInfo.innerHTML = `<strong>评分:</strong> ${starsHtml} (${productData.rating.toFixed(1)})`;
                        productInfo.appendChild(ratingInfo);
                    }
                } else {
                    // 显示错误信息
                    const errorMessage = document.createElement('div');
                    errorMessage.classList.add('error-message');
                    errorMessage.textContent = '无法加载产品详情，请稍后再试。';
                    productDetails.appendChild(errorMessage);
                }
            })
            .catch(error => {
                console.error('获取产品详情出错:', error);
                
                // 显示错误信息
                productDetails.innerHTML = '';
                const errorMessage = document.createElement('div');
                errorMessage.classList.add('error-message');
                errorMessage.textContent = '加载产品详情时出错，请稍后再试。';
                productDetails.appendChild(errorMessage);
            });
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

            /* 添加加载指示器样式 */
            .loading-indicator {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100px;
                color: var(--text-color);
                font-size: 14px;
            }
            
            .loading-indicator i {
                margin-right: 8px;
                color: var(--primary-color);
            }
            
            .personalization-info {
                width: 100%;
                padding: 8px;
                margin-bottom: 10px;
                background-color: var(--card-bg);
                border-radius: 8px;
                font-size: 12px;
                color: var(--text-color-secondary);
                text-align: center;
            }
            
            .personalization-info i {
                color: var(--primary-color);
                margin-right: 4px;
            }
            
            .refresh-recommendations {
                display: block;
                width: 100%;
                padding: 8px;
                margin-top: 10px;
                background-color: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                color: var(--text-color);
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .refresh-recommendations:hover {
                background-color: var(--hover-color);
            }
            
            .refresh-recommendations i {
                margin-right: 4px;
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
        // 初始化登录/注册模态框
        document.getElementById('authButton').addEventListener('click', () => {
            openModal('authModal');
        });
        
        // 初始化关闭按钮
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    // 使用window.closeModal函数关闭模态框
                    if (typeof window.closeModal === 'function') {
                        window.closeModal(modal.id);
                    } else {
                        // 如果全局函数不可用，则使用传统方式
                        modal.classList.remove('active');
                        const modalOverlay = document.getElementById('modalOverlay');
                        if (modalOverlay) {
                            modalOverlay.classList.remove('active');
                        }
                        document.body.classList.remove('modal-open');
                    }
                }
            });
        });
        
        // 初始化标签页切换
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // 更新标签页状态
                document.querySelectorAll('.auth-tab').forEach(t => {
                    t.classList.remove('active');
                });
                tab.classList.add('active');
                
                // 更新表单显示
                document.querySelectorAll('.auth-form').forEach(form => {
                    form.classList.remove('active');
                });
                document.querySelector(`.${tabName}-form`).classList.add('active');
            });
        });
        
        // 初始化便签删除功能
        document.querySelectorAll('.tag i').forEach(closeIcon => {
            closeIcon.addEventListener('click', function() {
                const tag = this.parentElement;
                tag.remove();
            });
        });
    }

    // 添加一个辅助函数来标准化情绪关键字
    function normalizeEmotionKey(emotion) {
        // 映射可能的情绪表述到标准关键字
        const emotionMapping = {
            // 标准情绪关键字
            '快乐': '快乐', 
            '悲伤': '悲伤',
            '愤怒': '愤怒',
            '焦虑': '焦虑',
            '疲惫': '疲惫',
            '平静': '平静',
            
            // 同义词映射
            '高兴': '快乐',
            '开心': '快乐',
            '喜悦': '快乐',
            '伤心': '悲伤',
            '忧郁': '悲伤',
            '难过': '悲伤',
            '生气': '愤怒',
            '恼怒': '愤怒',
            '担忧': '焦虑',
            '紧张': '焦虑',
            '累': '疲惫',
            '乏力': '疲惫',
            '放松': '平静',
            '安宁': '平静'
        };
        
        // 返回映射后的标准情绪，如果没有找到则返回原始值
        return emotionMapping[emotion] || emotion;
    }
} 