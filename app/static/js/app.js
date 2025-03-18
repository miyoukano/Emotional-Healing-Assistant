// 全局变量
const MIN_TURNS_BEFORE_RECOMMEND = 1; // 减少对话轮数限制，只需要1轮对话就可以推荐香薰
let currentUser = null;
let isLoggedIn = false;
let currentEmotion = '平静';
let currentPersona = 'empathetic';
let currentSessionId = null; // 当前会话ID
let dialogTurns = 0;
let shouldRecommendAroma = false;
let userPreferences = {
    scents: [],
    aromatherapy_types: [],
    concerns: [],
    preferences_collected: false
};
let isTyping = false; // 追踪"正在输入"状态
let lastUserMessage = ""; // 记录最后一次用户发送的消息
let lastAssistantReply = ""; // 记录最后一次助手的回复
let hasAddedWelcomeMessage = false; // 跟踪是否已经添加了欢迎消息

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
        console.log('开始检查登录状态...');
        checkLoginStatus().then((isLoggedIn) => {
            console.log('登录状态检查完成，用户是否登录:', isLoggedIn);
            // 验证用户登录后，加载聊天历史
            if (isLoggedIn && currentUser) {
                console.log('用户已登录，用户信息:', currentUser.username);
                
                // 先加载聊天会话列表，确保它显示
                loadChatSessions().then(() => {
                    // 从URL中获取会话ID
                    const urlParams = new URLSearchParams(window.location.search);
                    const sessionIdFromUrl = urlParams.get('session_id');
                    
                    if (sessionIdFromUrl) {
                        console.log('从URL获取会话ID:', sessionIdFromUrl);
                        switchToSession(sessionIdFromUrl);
                    } else {
                        // 获取存储的会话ID
                        const storedSessionId = localStorage.getItem('currentSessionId');
                        console.log('从本地存储获取会话ID:', storedSessionId);
                        
                        if (storedSessionId) {
                            currentSessionId = storedSessionId;
                            loadChatHistory(storedSessionId);
                        } else {
                            // 如果没有存储的会话ID，加载默认聊天历史
                            loadChatHistory();
                        }
                    }
                    
                    // 如果存在活动会话，高亮显示它
                    if (currentSessionId) {
                        const sessionItems = document.querySelectorAll('.chat-session-item');
                        sessionItems.forEach(item => {
                            if (item.dataset.sessionId == currentSessionId) {
                                item.classList.add('active');
                            }
                        });
                    }
                });
                
                // 其他用户登录后需要执行的初始化操作...
            } else {
                // 未登录用户，显示欢迎消息
                if (!welcomeMessageShown && !hasAddedWelcomeMessage) {
                    addMessageToChat('assistant', '你好！我是你的情绪愈疗助手。今天感觉如何？有什么想和我分享的吗？');
                    updateAssistantAvatars();
                    welcomeMessageShown = true;
                    hasAddedWelcomeMessage = true;
                }
            }
        });
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 发送消息
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // 自动调整文本框高度
        messageInput.addEventListener('input', autoResizeTextarea);

        // 文本框聚焦时隐藏表情选择器
        messageInput.addEventListener('focus', () => {
            const emojiPicker = document.querySelector('.emoji-picker');
            if (emojiPicker) {
                emojiPicker.classList.remove('active');
            }
        });

        // 人设下拉菜单切换
        const personaDropdownToggle = document.querySelector('.persona-dropdown-toggle');
        const personaDropdown = document.getElementById('personaDropdown');
        
        if (personaDropdownToggle && personaDropdown) {
            // 清除可能存在的旧事件监听器
            const newToggle = personaDropdownToggle.cloneNode(true);
            personaDropdownToggle.parentNode.replaceChild(newToggle, personaDropdownToggle);
            
            // 重新获取DOM元素引用并添加事件监听器
            const updatedToggle = document.querySelector('.persona-dropdown-toggle');
            updatedToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                this.classList.toggle('active');
                personaDropdown.classList.toggle('active');
                console.log('Persona dropdown toggled', this.classList.contains('active'));
            });
            
            // 点击其他地方关闭下拉菜单
            document.addEventListener('click', function() {
                updatedToggle.classList.remove('active');
                personaDropdown.classList.remove('active');
            });
            
            // 阻止下拉菜单内部点击事件冒泡
            personaDropdown.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        // 人设选项点击事件
        const personaOptions = document.querySelectorAll('.persona-option');
        personaOptions.forEach(option => {
            // 移除可能存在的旧事件监听器
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
        });

        // 使用事件委托处理点击事件
        const personaDropdownElement = document.getElementById('personaDropdown');
        if (personaDropdownElement) {
            personaDropdownElement.addEventListener('click', function(e) {
                // 查找最近的persona-option父元素
                const personaOption = e.target.closest('.persona-option');
                if (personaOption) {
                    const persona = personaOption.dataset.persona;
                    changePersona(persona);
                    
                    // 获取更新后的元素引用
                    const updatedToggle = document.querySelector('.persona-dropdown-toggle');
                    const personaDropdown = document.getElementById('personaDropdown');
                    
                    // 关闭下拉菜单
                    if (updatedToggle && personaDropdown) {
                        updatedToggle.classList.remove('active');
                        personaDropdown.classList.remove('active');
                    }
                    
                    console.log('Persona changed to:', persona);
                }
            });
        }

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

        // 用户菜单切换按钮事件
        const userMenuToggle = document.querySelector('.user-menu-toggle');
        if (userMenuToggle) {
            // 确保移除任何现有事件监听器，防止重复
            userMenuToggle.removeEventListener('click', toggleUserMenu);
            // 添加新的事件监听器
            userMenuToggle.addEventListener('click', toggleUserMenu);
            console.log('用户菜单切换按钮事件监听器已添加');
        }

        // 用户菜单项点击事件
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            const menuItems = userMenu.querySelectorAll('li');
            menuItems.forEach((item, index) => {
                // 移除现有事件监听器
                const clonedItem = item.cloneNode(true);
                item.parentNode.replaceChild(clonedItem, item);
                
                // 添加新的事件监听器
                clonedItem.addEventListener('click', function(e) {
                    handleMenuItemClick(e, index);
            });
        });
        }

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

        // 为聊天输入框添加事件监听器
        document.getElementById('messageInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // 为发送按钮添加事件监听器
        document.querySelector('.send-button').addEventListener('click', function() {
            sendMessage();
        });
    }
    
    // 添加重置聊天的功能
    function resetChat() {
        // 确认对话框
        if (confirm('确定要开始新的对话吗？这将清除当前对话记录。')) {
            // 清空聊天区域
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            
            // 重置对话轮数和状态
            dialogTurns = 0;
            shouldRecommendAroma = false;
            
            // 重置最后的用户消息和助手回复
            lastUserMessage = "";
            lastAssistantReply = "";
            
            // 重置用户偏好（保留已收集的偏好，但标记为未使用）
            userPreferences = {
                scents: [],
                aromatherapy_types: [],
                concerns: [],
                preferences_collected: false
            };
            
            // 保存重置后的对话上下文
            saveDialogContext();
            
            // 重置欢迎消息标志
            hasAddedWelcomeMessage = false;
            
            // 添加欢迎消息
            const welcomeMessage = '你好！我是你的情绪愈疗助手。今天你感觉怎么样？有什么我可以帮助你的吗？';
            addMessageToChat('assistant', welcomeMessage);
            lastAssistantReply = welcomeMessage;
            hasAddedWelcomeMessage = true;
            
            // 更新推荐区域
            loadRecommendations();
            
            // 更新偏好显示
            updatePreferencesDisplay();
            
            console.log("对话已重置，所有上下文变量已清空");
        }
    }

    // 自动调整文本区域高度
    function autoResizeTextarea() {
        messageInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // 全局变量，用于跟踪用户最近的消息
    let recentUserMessages = [];
    const MAX_RECENT_MESSAGES = 5; // 记录最近5条消息
    
    function sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (message === '') return;
        
        // 注释掉重复消息检测逻辑
        // const isRepeatedMessage = checkRepeatedUserMessage(message);
        
        // 记录当前用户消息
        lastUserMessage = message;
        
        // 添加到最近消息列表
        addToRecentMessages(message);
        
        // 清空输入框
        messageInput.value = '';
        
        // 调整输入框高度
        autoResizeTextarea();
        
        // 添加用户消息到聊天区域
        addMessageToChat('user', message);
        
        // 从用户输入中提取情感关键词
        analyzeEmotion(message);
        
        // 增加对话轮数
        dialogTurns++;
        
        // 如果对话轮数达到阈值，设置为可以推荐香薰产品
        if (dialogTurns >= MIN_TURNS_BEFORE_RECOMMEND) {
            shouldRecommendAroma = true;
        }
        
        // 显示"正在输入"状态
        showTypingIndicator();
        
        // 延迟加载更新推荐
        setTimeout(function() {
            loadRecommendations();
        }, 500);
        
        // 保存对话上下文
        saveDialogContext();
        
        // 提取并更新用户偏好
        const extractedPreferences = extractUserPreferencesFromMessage(message);
        updateUserPreferences(extractedPreferences);
        
        // 注释掉重复消息处理逻辑
        /* 
        // 如果是重复消息，直接生成替代回复而不调用API
        if (isRepeatedMessage) {
            console.log('检测到用户重复消息，生成替代回复');
            removeTypingIndicator();
            const alternativeReply = generateAlternativeReply(message);
            addMessageToChat('assistant', alternativeReply);
            lastAssistantReply = alternativeReply;
            
            // 如果应该推荐香薰，加载推荐
            if (shouldRecommendAroma) {
                loadRecommendations();
            }
            return;
        }
        */
        
        // 发送消息到后端API
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken()  // 修改这里
            },
            body: JSON.stringify({
                message: message,
                emotion: currentEmotion,
                persona: currentPersona,
                dialogTurns: dialogTurns,
                shouldRecommendAroma: shouldRecommendAroma,
                userPreferences: userPreferences,
                session_id: currentSessionId
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
                // 检查是否有新的会话ID
                if (data.session_id && data.session_id !== currentSessionId) {
                    console.log('收到新的会话ID:', data.session_id);
                    currentSessionId = data.session_id;
                    // 重新加载会话列表
                    if (isLoggedIn) {
                        loadChatSessions();
                    }
                }
                
                // 检查是否有回复
                if (data.reply) {
                    // 验证回复是否重复或不相关
                    if (isReplyDuplicate(data.reply)) {
                        console.warn('检测到重复回复或不相关回复，生成替代回复');
                        // 生成一个替代回复，确保上下文衔接
                        const alternativeReply = generateAlternativeReply(lastUserMessage);
                        // 添加替代回复到聊天区域
                        addMessageToChat('assistant', alternativeReply);
                        // 更新最后一次回复
                        lastAssistantReply = alternativeReply;
                    } else {
                        // 检查回复是否与用户消息上下文相关
                        const isRelevant = checkReplyRelevance(lastUserMessage, data.reply);
                        
                        if (!isRelevant) {
                            console.warn('检测到回复与用户消息不够相关，生成替代回复');
                            // 生成一个替代回复，确保上下文衔接
                            const alternativeReply = generateAlternativeReply(lastUserMessage);
                            // 添加替代回复到聊天区域
                            addMessageToChat('assistant', alternativeReply);
                            // 更新最后一次回复
                            lastAssistantReply = alternativeReply;
                        } else {
                // 添加助手回复到聊天区域
                addMessageToChat('assistant', data.reply);
                            // 更新最后一次回复
                            lastAssistantReply = data.reply;
                        }
                    }
                
                // 更新情绪显示
                if (data.emotion) {
                    updateEmotionDisplay(
                            data.emotion.type || 'neutral', 
                            data.emotion.type || '平静', 
                            data.emotion.icon || 'fa-smile',
                            data.emotion.description || '您当前的情绪状态看起来很平静'
                    );
                }
                
                // 更新推荐
                if (data.recommendations) {
                    updateRecommendations(data.recommendations);
                    } else if (shouldRecommendAroma) {
                        // 如果应该推荐香薰但API没有返回推荐，则主动加载推荐
                        loadRecommendations();
                    }
                } else {
                    // 没有收到回复，生成一个替代回复
                    const alternativeReply = generateAlternativeReply(lastUserMessage);
                    addMessageToChat('assistant', alternativeReply);
                    lastAssistantReply = alternativeReply;
                    
                    // 如果用户表达了心情好转，加载推荐
                    if (shouldRecommendAroma) {
                        loadRecommendations();
                    }
                }
            } else {
                // 显示错误消息
                let errorMessage = '抱歉，我遇到了一些问题，无法回复您的消息。请稍后再试。';
                if (data.message) {
                    errorMessage = `抱歉，出现了问题: ${data.message}`;
                }
                addMessageToChat('assistant', errorMessage);
                lastAssistantReply = errorMessage;
                
                // 如果用户消息已保存但助手回复保存失败，提示用户刷新页面
                if (data.message && data.message.includes('保存回复失败')) {
                    setTimeout(() => {
                        addMessageToChat('assistant', '您可以尝试刷新页面，查看完整的对话历史。');
                    }, 1000);
                }
            }
        })
        .catch(error => {
            console.error('发送消息失败:', error);
            
            // 移除"正在输入"状态
            removeTypingIndicator();
            
            // 显示错误消息
            const errorMessage = '抱歉，发送消息时出现了网络问题，请检查您的网络连接并稍后再试。';
            addMessageToChat('assistant', errorMessage);
            lastAssistantReply = errorMessage;
        });
    }
    
    // 检查用户消息是否重复
    function checkRepeatedUserMessage(message) {
        // 检查最近的消息中是否有完全相同的消息
        return recentUserMessages.includes(message);
    }
    
    // 添加消息到最近消息列表
    function addToRecentMessages(message) {
        // 如果消息已经在列表中，先移除它
        const index = recentUserMessages.indexOf(message);
        if (index !== -1) {
            recentUserMessages.splice(index, 1);
        }
        
        // 添加到列表开头
        recentUserMessages.unshift(message);
        
        // 保持列表长度不超过最大值
        if (recentUserMessages.length > MAX_RECENT_MESSAGES) {
            recentUserMessages.pop();
        }
    }

    // 检查回复是否重复或不相关
    function isReplyDuplicate(reply) {
        // 如果与上一次回复完全相同，则认为是重复回复
        if (reply === lastAssistantReply) {
            console.log("检测到完全相同的回复");
            return true;
        }
        
        // 如果上一次回复为空，则不算重复
        if (!lastAssistantReply) {
            return false;
        }
        
        // 计算回复的相似度
        const similarity = calculateStringSimilarity(reply, lastAssistantReply);
        console.log(`回复相似度: ${similarity.toFixed(2)}`);
        
        // 相似度超过阈值，认为是重复回复
        if (similarity > 0.85) {
            console.log("检测到高度相似的回复");
            return true;
        }
        
        // 检查回复是否缺乏上下文相关性的通用套话
        const genericPhrases = [
            "感谢你继续和我分享你的感受",
            "通过我们的对话",
            "你是一个非常有韧性的人",
            "面对这些情况",
            "你内心最希望得到什么样的支持",
            "希望我的回答对你有所帮助",
            "如果你有任何其他问题"
        ];
        
        // 如果回复中包含通用套话且长度较短，可能是缺乏针对性的回复
        if (reply.length < 100) {
            for (const phrase of genericPhrases) {
                if (reply.includes(phrase)) {
                    console.log("检测到可能缺乏针对性的通用回复");
                    return true;
                }
            }
        }
        
        // 如果用户最后一条消息很具体，但回复很笼统，可能是不相关回复
        const specificKeywords = ['考试', '学习', '焦虑', '紧张', '压力', '难过', '开心', '准备'];
        
        return false;
    }

    // 计算两个字符串的相似度 (0-1之间，1表示完全相同)
    function calculateStringSimilarity(str1, str2) {
        // 如果两个字符串完全相同，直接返回1
        if (str1 === str2) return 1.0;
        
        // 长度相差过大，直接判定为不相似
        if (Math.max(str1.length, str2.length) > 3 * Math.min(str1.length, str2.length)) {
            return 0.1; // 返回一个很小的相似度值
        }
        
        // 转为小写并去除标点符号，分割成词组
        const normalize = text => {
            // 去除标点和特殊字符，转为小写
            return text.toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
                .replace(/\s{2,}/g, " ");
        };
        
        const normalStr1 = normalize(str1);
        const normalStr2 = normalize(str2);
        
        // 将文本分割成词组并去重
        const words1 = new Set(normalStr1.split(/\s+/));
        const words2 = new Set(normalStr2.split(/\s+/));
        
        // 计算Jaccard相似系数 (交集大小/并集大小)
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        // Jaccard系数
        const jaccard = union.size === 0 ? 0 : intersection.size / union.size;
        
        // 检查两个字符串的长度比率
        const lengthRatio = Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
        
        // 计算结构相似性（通过检查两段文本中的段落结构、列表项目等）
        let structureSimilarity = 0;
        
        // 检查是否都包含列表（数字列表或项目符号）
        const hasList1 = /\d+\.|\*|\-\s/.test(str1);
        const hasList2 = /\d+\.|\*|\-\s/.test(str2);
        if (hasList1 === hasList2) structureSimilarity += 0.1;
        
        // 检查段落结构（通过换行符数量）
        const paragraphs1 = str1.split('\n').filter(p => p.trim().length > 0);
        const paragraphs2 = str2.split('\n').filter(p => p.trim().length > 0);
        const paragraphRatio = Math.min(paragraphs1.length, paragraphs2.length) / 
                              Math.max(paragraphs1.length, paragraphs2.length);
        structureSimilarity += paragraphRatio * 0.1;
        
        // 检查问句数量（以？结尾的句子）
        const questions1 = str1.split(/[。？！.?!]/).filter(s => s.trim().endsWith('？') || s.trim().endsWith('?')).length;
        const questions2 = str2.split(/[。？！.?!]/).filter(s => s.trim().endsWith('？') || s.trim().endsWith('?')).length;
        if (Math.abs(questions1 - questions2) <= 1) structureSimilarity += 0.1;
        
        // 检查特殊标记 (** 粗体, * 斜体, ` 代码等)的使用情况
        const hasMarkers1 = /\*\*|\*|`/.test(str1);
        const hasMarkers2 = /\*\*|\*|`/.test(str2);
        if (hasMarkers1 === hasMarkers2) structureSimilarity += 0.1;
        
        // 检查是否都包含数字
        const hasNumbers1 = /\d+/.test(str1);
        const hasNumbers2 = /\d+/.test(str2);
        if (hasNumbers1 === hasNumbers2) structureSimilarity += 0.05;
        
        // 关键词匹配
        const keyPhrases = [
            "深呼吸", "冥想", "放松", "焦虑", "压力", "睡眠", "运动", "规律",
            "考试", "复习", "准备", "计划", "时间管理", "优先级", "效率",
            "心情", "情绪", "感受", "支持", "帮助", "建议", "分享"
        ];
        
        let keyPhraseMatches = 0;
        let keyPhraseTotal = 0;
        
        for (const phrase of keyPhrases) {
            const inStr1 = normalStr1.includes(phrase);
            const inStr2 = normalStr2.includes(phrase);
            
            if (inStr1 || inStr2) {
                keyPhraseTotal++;
                if (inStr1 === inStr2) {
                    keyPhraseMatches++;
                }
            }
        }
        
        const keyPhraseScore = keyPhraseTotal === 0 ? 0 : keyPhraseMatches / keyPhraseTotal;
        
        // 综合评分：结合Jaccard系数、长度比率、结构相似性和关键词匹配
        const finalScore = (jaccard * 0.5) + (lengthRatio * 0.1) + (structureSimilarity * 0.2) + (keyPhraseScore * 0.2);
        
        console.log(`相似度计算 - Jaccard: ${jaccard.toFixed(2)}, 长度比: ${lengthRatio.toFixed(2)}, 结构: ${structureSimilarity.toFixed(2)}, 关键词: ${keyPhraseScore.toFixed(2)}, 最终: ${finalScore.toFixed(2)}`);
        
        return Math.min(finalScore, 1.0);
    }

    // 生成替代回复
    function generateAlternativeReply(userMessage) {
        console.log("生成替代回复，基于用户消息:", userMessage);
        
        // 检查是否是重复消息
        const isRepeatedMessage = checkRepeatedUserMessage(userMessage);
        if (isRepeatedMessage) {
            console.log("检测到用户重复发送相同消息，生成提示回复");
            
            // 为重复消息生成不同的回复
            const repeatedReplies = [
                `我注意到你刚刚提到了同样的内容。你是想强调这一点，还是有其他想要补充的内容呢？`,
                `你似乎重复提到了这个话题，这对你来说一定很重要。你能告诉我更多关于这方面的想法吗？`,
                `我们刚才已经聊到了这个话题。也许你想从不同的角度探讨，或者有其他想要分享的内容？`,
                `我理解这个话题对你很重要。你想要我从不同角度回答，或者有其他方面想要讨论吗？`,
                `你再次提到了这个话题，这让我感到你对此很关注。有什么特别的原因吗？`
            ];
            
            // 随机选择一个回复，避免重复
            const randomIndex = Math.floor(Math.random() * repeatedReplies.length);
            return repeatedReplies[randomIndex];
        }
        
        // 根据用户的消息生成上下文相关的回复
        const lowerMessage = userMessage.toLowerCase();
        
        // 检查是否包含考试相关内容
        if (lowerMessage.includes('考试') || lowerMessage.includes('复习') || lowerMessage.includes('准备')) {
            if (lowerMessage.includes('准备不足') || lowerMessage.includes('没准备好') || 
                lowerMessage.includes('不够') || lowerMessage.includes('一般般') || 
                lowerMessage.includes('不懂') || lowerMessage.includes('无法') ||
                lowerMessage.includes('来不及')) {
                return `我理解考试前准备不足的感受确实很令人焦虑。即使时间有限，我们也可以做一些事情：

1. **专注优先级**：确定最重要和分值最高的内容，优先复习这些部分
2. **高效学习法**：使用闪卡、思维导图等方法快速掌握核心概念
3. **寻求帮助**：向同学或老师请教不懂的问题，有时候一个关键解释可以解开很多疑惑
4. **调整心态**：接受当前状况，集中精力做好能做的部分，而不是焦虑于无法改变的事实
5. **制定应急计划**：为考试中可能遇到的困难情况做准备，如遇到不会的题目时如何应对

距离考试还有多久？或许我们可以一起制定一个适合剩余时间的应急复习计划？`;
            } else {
                return `关于即将到来的考试，我能理解你的焦虑感。考试确实是一个压力较大的经历，但记住适度的紧张感实际上可以帮助你保持专注。

以下是一些可能对你有帮助的建议：
1. **划分重点**：确定考试的重点内容和难点，有针对性地复习
2. **规划时间**：根据剩余时间，制定合理的复习计划，确保每个科目都得到足够关注
3. **模拟测试**：尝试做一些模拟题或往年试题，熟悉考试形式和时间限制
4. **健康作息**：保证充足的睡眠和适当的休息，避免过度疲劳影响学习效率
5. **放松技巧**：学习一些简单的放松技巧，如深呼吸或短暂冥想，帮助缓解考试焦虑

你最担心的是哪部分内容？我们可以一起想想如何针对性地解决这些问题。`;
            }
        }
        // 检查是否包含焦虑相关内容
        else if (lowerMessage.includes('焦虑') || lowerMessage.includes('担心') || 
                 lowerMessage.includes('紧张') || lowerMessage.includes('压力')) {
            return `我能理解你感到焦虑的心情。焦虑是一种常见的情绪反应，尤其是在面对压力或不确定性时。

以下是一些可能帮助缓解焦虑的方法：
1. **深呼吸练习**：慢慢吸气5秒，屏住2秒，然后缓慢呼气7秒，重复几次可以帮助身心放松
2. **正念冥想**：尝试专注于当下的感受，而不评判它们，这可以帮助你与焦虑情绪保持一定距离
3. **身体活动**：即使是简单的伸展或短暂的步行也能帮助释放紧张情绪
4. **限制咖啡因摄入**：咖啡、茶和能量饮料可能会加重焦虑症状
5. **充足休息**：确保有足够的睡眠和放松时间

你能告诉我更多关于你焦虑的具体情况吗？这样我可以提供更有针对性的建议。`;
        }
        // 检查是否包含心情相关内容
        else if (lowerMessage.includes('心情') || lowerMessage.includes('情绪') || 
                 lowerMessage.includes('感觉') || lowerMessage.includes('感受')) {
            if (lowerMessage.includes('不好') || lowerMessage.includes('糟糕') || 
                lowerMessage.includes('难过') || lowerMessage.includes('伤心') || 
                lowerMessage.includes('失落') || lowerMessage.includes('沮丧')) {
                return `我很遗憾听到你现在心情不好。每个人都有情绪低落的时候，这是完全正常的。

请记住，情绪就像天气，它们会变化，不会永远持续。以下是一些可能帮助你改善心情的方法：

1. **允许自己感受**：不要压抑情绪，给自己空间和时间去感受它们
2. **温和活动**：尝试一些简单的活动，如散步、听喜欢的音乐或看一部轻松的电影
3. **与人交流**：与朋友或家人分享你的感受，有时候倾诉本身就是一种释放
4. **自我关爱**：做一些让自己感到舒适和愉悦的事情，比如泡个热水澡或享用喜欢的食物
5. **正念练习**：尝试将注意力集中在当下，观察自己的呼吸和身体感受

你愿意分享是什么让你感到难过的吗？或者有什么我能帮到你的地方？`;
            } else if (lowerMessage.includes('好') || lowerMessage.includes('开心') || 
                       lowerMessage.includes('愉快') || lowerMessage.includes('高兴')) {
                return `很高兴听到你现在心情不错！积极的情绪对我们的身心健康都有很大帮助。

你能分享一下是什么让你感到开心的吗？有时候回顾这些积极的经历可以帮助我们在未来的低落时刻找到力量。

趁着这个好心情，你可以考虑：
1. **记录感恩**：写下今天让你感恩的事情，这有助于培养积极的心态
2. **分享喜悦**：与朋友或家人分享你的好心情，积极情绪是会传染的
3. **创造性活动**：利用这种积极能量做一些创造性的事情，如绘画、写作或音乐
4. **户外活动**：如果天气允许，可以出去走走，阳光和自然环境能进一步提升心情
5. **设定目标**：在心情好的时候设定一些积极的目标，这时你的思维更加开阔和乐观

有什么特别的事情让你今天感到开心吗？`;
            } else {
                return `谢谢你分享你的心情。了解和接纳自己的情绪是情绪健康的重要一步。

无论你现在感受如何，都是完全有效和重要的。每种情绪都有其存在的价值和意义。

你能更具体地描述一下你现在的感受吗？这样我可以更好地理解你的情况，并提供更有针对性的支持。

同时，记住照顾自己的情绪健康也很重要：保持规律的作息、健康的饮食、适当的运动，以及与亲友的联系，这些都能帮助我们维持情绪的平衡。

有什么特别想和我分享或讨论的吗？`;
            }
        }
        // 检查是否包含天气相关内容
        else if (lowerMessage.includes('天气') || lowerMessage.includes('下雨') || 
                 lowerMessage.includes('晴天') || lowerMessage.includes('阴天') ||
                 lowerMessage.includes('雨天') || lowerMessage.includes('太阳')) {
            if (lowerMessage.includes('好') || lowerMessage.includes('晴') || lowerMessage.includes('太阳')) {
                return `天气好确实能让人心情愉悦。阳光明媚的日子，总是让人感到充满希望和活力。你有没有趁着好天气出去走走，享受一下大自然的美好呢？

研究表明，阳光能促进身体产生维生素D和血清素，这对我们的身心健康都很有益。在这样的好天气里，可以考虑：

1. **户外活动**：散步、骑行或只是坐在公园里享受阳光
2. **自然探索**：参观附近的公园、植物园或自然保护区
3. **户外用餐**：在户外享用一顿美食，感受微风和阳光
4. **户外运动**：打球、跑步或做瑜伽，户外运动更有活力
5. **摄影**：记录美丽的景色和瞬间

好天气对你的心情有什么特别的影响吗？`;
            } else if (lowerMessage.includes('不好') || lowerMessage.includes('雨') || lowerMessage.includes('阴')) {
                return `天气不好时确实容易影响心情。阴雨天气会让一些人感到情绪低落或缺乏活力，这是很常见的现象，甚至有一种称为"季节性情感障碍"的状况与此相关。

在这样的天气里，我们可以尝试：

1. **室内活动**：读一本好书、看电影或尝试新的烹饪食谱
2. **创造舒适环境**：点上香薰蜡烛、泡一杯热茶、裹上舒适的毯子
3. **社交联系**：与朋友视频聊天或打电话，保持社交连接
4. **创意项目**：绘画、写作或其他创意活动可以转移注意力
5. **室内运动**：瑜伽、舞蹈或简单的伸展运动也能提升心情

你有没有特别喜欢在雨天或阴天做的事情呢？`;
            } else {
                return `天气确实能影响我们的情绪和日常活动。无论是晴天还是雨天，每种天气都有其独特的美丽和可能性。

你对天气变化敏感吗？有些人会因为气压变化或光照条件的改变而感到身体或情绪上的变化。

适应不同的天气也是一种生活智慧。正如一句谚语所说："没有不好的天气，只有不合适的衣服。"我们可以通过调整活动和心态来适应各种天气条件。

你最喜欢什么样的天气？是温暖的夏日，清爽的秋天，还是其他季节？`;
            }
        }
        // 默认回复
        else {
            const defaultReplies = [
                `谢谢你的分享。你能告诉我更多关于这个话题的想法吗？我很想了解你的观点和感受。`,
                `这是个很有趣的话题。你对此有什么特别的想法或感受吗？我很乐意继续探讨这个话题。`,
                `感谢你与我交流这些内容。你想更深入地讨论这个话题的哪些方面呢？我很期待听到你的想法。`,
                `我很欣赏你愿意分享这些。这对你来说有什么特别的意义吗？我很想更好地理解你的视角。`,
                `这确实是个值得思考的话题。你有没有什么特别的经历或观察与此相关？我很想听你分享更多。`
            ];
            
            // 随机选择一个回复，避免重复
            const randomIndex = Math.floor(Math.random() * defaultReplies.length);
            return defaultReplies[randomIndex];
        }
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

    // 分析情绪
    function analyzeEmotion(message) {
        // 简单的情绪分析逻辑
        const lowerMessage = message.toLowerCase();

        // 情绪关键词映射
        const emotionKeywords = {
            '焦虑': ['焦虑', '紧张', '不安', '担心', '害怕', '恐惧', '慌张'],
            '压力': ['压力', '疲惫', '累', '劳累', '疲劳', '负担', '重担'],
            '悲伤': ['悲伤', '难过', '伤心', '痛苦', '哭', '抑郁', '消沉', '失落'],
            '愤怒': ['愤怒', '生气', '恼火', '烦躁', '暴躁', '发火', '怒火'],
            '失眠': ['失眠', '睡不着', '睡眠', '入睡', '失眠症', '睡眠质量'],
            '平静': ['平静', '放松', '舒适', '安心', '安宁', '平和', '宁静'],
            '快乐': ['快乐', '开心', '高兴', '喜悦', '欣喜', '愉快', '兴奋']
        };
        
        // 检测情绪
        let detectedEmotion = '平静'; // 默认情绪
        let maxMatches = 0;
        
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedEmotion = emotion;
            }
        }
        
        // 更新当前情绪
        if (maxMatches > 0) {
            currentEmotion = detectedEmotion;
            
            // 更新情绪显示
            updateEmotionDisplay(
                detectedEmotion,
                detectedEmotion,
                getEmotionIcon(detectedEmotion),
                getEmotionDescription(detectedEmotion)
            );
            
            // 情绪变化时立即更新香薰推荐
            loadRecommendations();
        }
        
        return detectedEmotion;
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
                
            case 'aromatherapist':
                // 香薰顾问人设的回复逻辑
                if (lowerMessage.includes('难过') || lowerMessage.includes('伤心') || lowerMessage.includes('悲伤')) {
                    return '我注意到你感到有些悲伤。薰衣草和甜橙精油对缓解悲伤情绪非常有效。薰衣草的香气能够舒缓神经系统，而甜橙则能提升心情。我可以根据你的具体情况为你推荐最适合的香薰产品，帮助你调节情绪。';
                } else if (lowerMessage.includes('焦虑') || lowerMessage.includes('担心') || lowerMessage.includes('紧张')) {
                    return '焦虑是现代生活中常见的情绪。洋甘菊和薰衣草精油对缓解焦虑特别有效。洋甘菊有温和的镇静作用，而薰衣草则能帮助放松身心。使用香薰扩散器在室内弥漫这些精油的香气，可以创造一个平静的环境，帮助你缓解焦虑感。';
                } else if (lowerMessage.includes('疲惫') || lowerMessage.includes('累') || lowerMessage.includes('疲劳')) {
                    return '疲惫感会影响我们的情绪和生活质量。薄荷和柠檬精油具有提神醒脑的效果，能够帮助缓解疲劳。你可以尝试在早晨使用这些精油，为一天注入活力。我们的数据库中有多款针对疲劳感的香薰产品，我很乐意为你推荐最适合的选择。';
                } else if (lowerMessage.includes('愤怒') || lowerMessage.includes('生气') || lowerMessage.includes('烦躁')) {
                    return '愤怒和烦躁是需要适当释放的情绪。佛手柑和依兰依兰精油有助于平复情绪，缓解愤怒感。佛手柑的清新香气能够提升心情，而依兰依兰则有助于平衡情绪。在感到愤怒时，可以尝试深呼吸并闻一闻这些精油的香气，帮助你找回内心的平静。';
                } else if (lowerMessage.includes('失眠') || lowerMessage.includes('睡不着')) {
                    return '睡眠问题会影响我们的情绪和健康。薰衣草、洋甘菊和罗马洋甘菊精油都有助于改善睡眠质量。在睡前30分钟使用香薰蜡烛或扩香器，让这些精油的香气充满卧室，可以帮助你更容易入睡。我们有专门针对睡眠问题的香薰套装，可以根据你的具体情况为你推荐。';
                } else {
                    return '作为香薰顾问，我可以根据你的情绪状态为你推荐最适合的香薰产品。不同的精油和香薰有不同的功效，可以帮助缓解焦虑、提升心情、改善睡眠或增强活力。告诉我你最近的情绪状态或你希望改善的方面，我会从我们的数据库中为你找到最合适的香薰推荐。';
                }

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
        // 移除对话轮数和心情好转的限制，直接根据当前情绪展示推荐
        // 只有在初始化时（dialogTurns === 0）才显示占位符
        if (dialogTurns === 0) {
            const recommendationsContainer = document.querySelector('.recommendation-cards');
            recommendationsContainer.innerHTML = '';
            
            const placeholder = document.createElement('div');
            placeholder.className = 'recommendation-placeholder';
            placeholder.textContent = '我是你的情感助手，让我们先聊聊你的感受...';
            
            recommendationsContainer.appendChild(placeholder);
            return;
        }
        
        recommendationCards.innerHTML = '';
        
        // 添加加载指示器
        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('loading-indicator');
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载推荐中...';
        recommendationCards.appendChild(loadingIndicator);
        
        // 检查用户是否登录
        const isLoggedIn = document.querySelector('.user-info') !== null;
        
        // 从API获取推荐产品，基于当前情绪
        fetch(`/api/recommend_products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emotion: currentEmotion,
                limit: 3
            })
        })
            .then(response => response.json())
            .then(data => {
                // 移除加载指示器
                recommendationCards.innerHTML = '';
                
                if (data.success && data.products && data.products.length > 0) {
                    // 更新全局产品数据
                    aromatherapyProducts = data.products;
                    
                    // 显示情绪相关提示
                    const emotionInfo = document.createElement('div');
                    emotionInfo.classList.add('personalization-info');
                    emotionInfo.innerHTML = `<i class="fas fa-info-circle"></i> 根据您的当前情绪（${currentEmotion}）推荐`;
                    recommendationCards.appendChild(emotionInfo);
                    
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
        const recommendationsContainer = document.querySelector('.recommendation-cards');
        recommendationsContainer.innerHTML = '';

        // 移除shouldRecommendAroma的限制，直接显示推荐
        if (recommendations && recommendations.length > 0) {
            // 显示情绪相关提示
            const emotionInfo = document.createElement('div');
            emotionInfo.classList.add('personalization-info');
            emotionInfo.innerHTML = `<i class="fas fa-info-circle"></i> 根据您的当前情绪（${currentEmotion}）推荐`;
            recommendationsContainer.appendChild(emotionInfo);

        recommendations.forEach(product => {
            const card = createProductCard(product);
                recommendationsContainer.appendChild(card);
        });
        } else {
            // 如果没有推荐，则加载推荐
            loadRecommendations();
        }
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
                            const allComponents = Object.keys(aromaComponentLibrary);
                            
                            // 首先，提前定义一些常见的其他可能表达方式和简写
                            const componentAliases = {
                                '薰衣草': ['lavender', '薰草', '熏衣草', '紫花薰衣草'],
                                '柠檬': ['柠', 'lemon', '柑', '清柠'],
                                '佛手柑': ['佛手', '香柑', 'bergamot', '柑橘精油'],
                                '茉莉花': ['茉莉', 'jasmine', '花香'],
                                '薄荷': ['mint', '薄荷精油', '薄荷醇', '清薄荷'],
                                '檀香': ['檀香木', 'sandalwood', '白檀'],
                                '玫瑰': ['rose', '玫瑰精油', '玫瑰花'],
                                '洋甘菊': ['甘菊', 'chamomile', '菊花精油'],
                                '柑橘': ['橙', '柑', '橘', 'citrus', '柑橘精油', '橙花'],
                                '杉木': ['杉', '松', 'cedar', 'pine', '松木'],
                                '乳香': ['frankincense', '乳香精油', '香薰乳香']
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
                            
                            // 检查产品信息中是否包含已知成分或其别名
                            const productTexts = [
                                product.name || '',
                                product.description || '',
                                product.full_description || ''
                            ].join(' ');
                            
                            for (const term of allSearchTerms) {
                                if (productTexts.includes(term)) {
                                    // 如果找到了别名，使用它对应的原始成分
                                    const mappedComponent = aliasMapping[term] || term;
                                    // 避免重复添加同一成分
                                    if (!possibleComponents.includes(mappedComponent) && aromaComponentLibrary[mappedComponent]) {
                                        possibleComponents.push(mappedComponent);
                                    }
                                }
                            }
                            
                            // 如果没有找到任何成分，进行一个更宽松的搜索
                            if (possibleComponents.length === 0) {
                                // 检查产品名称中是否有关键词暗示成分
                                const productLower = productTexts.toLowerCase();
                                
                                // 根据产品名称关键词猜测可能的成分
                                if (productLower.includes('放松') || productLower.includes('睡眠') || productLower.includes('助眠')) {
                                    possibleComponents.push('薰衣草');
                                    possibleComponents.push('洋甘菊');
                                }
                                else if (productLower.includes('提神') || productLower.includes('振奋') || productLower.includes('清新')) {
                                    possibleComponents.push('薄荷');
                                    possibleComponents.push('柠檬');
                                }
                                else if (productLower.includes('平静') || productLower.includes('冥想') || productLower.includes('宁神')) {
                                    possibleComponents.push('檀香');
                                    possibleComponents.push('乳香');
                                }
                                else if (productLower.includes('愉悦') || productLower.includes('快乐') || productLower.includes('开心')) {
                                    possibleComponents.push('柑橘');
                                    possibleComponents.push('茉莉花');
                                }
                                else if (productLower.includes('舒缓') || productLower.includes('抚慰') || productLower.includes('情感')) {
                                    possibleComponents.push('玫瑰');
                                    possibleComponents.push('佛手柑');
                                }
                            }
                            
                            // 如果仍然没有找到任何成分，根据情绪类型推荐合适的成分
                            if (possibleComponents.length === 0 && product.emotions && product.emotions.length > 0) {
                                const emotion = product.emotions[0];
                                const normalizedEmotion = normalizeEmotionKey(emotion);
                                switch(normalizedEmotion) {
                                    case '快乐': 
                                        return ['柑橘', '柠檬'];
                                    case '悲伤': 
                                        return ['薰衣草', '玫瑰'];
                                    case '愤怒': 
                                        return ['佛手柑', '薄荷'];
                                    case '焦虑': 
                                        return ['薰衣草', '洋甘菊'];
                                    case '疲惫': 
                                        return ['薄荷', '柠檬'];
                                    case '平静':
                                        return ['檀香', '乳香'];
                                    default:
                                        return ['薰衣草', '佛手柑']; // 通用成分
                                }
                            } else if (possibleComponents.length === 0) {
                                return ['薰衣草', '佛手柑']; // 通用成分
                            }
                            
                            // 最多返回两种成分
                            return possibleComponents.slice(0, 2);
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
                            // 如果不是"平静"情绪，才添加高亮效果
                            if (normalizeEmotionKey(currentEmotion) !== '平静') {
                                effectItem.classList.add('current-emotion');
                            }
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
                        priceInfo.innerHTML = `<strong>价格:</strong> ¥${productData.price}`;
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
        console.log('开始检查登录状态...');
        return new Promise((resolve, reject) => {
        // 从后端API获取当前用户信息
        fetch('/api/user/profile')
            .then(response => {
                console.log('收到登录状态API响应:', response.status);
                if (response.status === 401) {
                    // 未登录
                    console.log('用户未登录（401响应）');
                    isLoggedIn = false;
                    currentUser = null;
                        resolve(false);
                    return;
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    // 已登录
                    console.log('用户已登录，用户信息:', data.user);
                    currentUser = data.user;
                    isLoggedIn = true;
                    updateUIForLoggedInUser();
                        resolve(true);
                    } else if (data) {
                        console.log('登录状态API返回数据，但不成功:', data);
                        resolve(false);
                }
            })
            .catch(error => {
                console.error('检查登录状态失败:', error);
                    resolve(false);
                });
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

                    // 清空聊天区域，然后显示退出消息
                    const chatMessages = document.getElementById('chatMessages');
                    if (chatMessages) {
                        chatMessages.innerHTML = '';
                    }

                    // 显示消息
                    addMessageToChat('assistant', '你已退出登录。随时欢迎你回来！');
                    
                    // 隐藏聊天会话列表
                    const chatSessionsElement = document.getElementById('chatSessions');
                    if (chatSessionsElement) {
                        chatSessionsElement.style.display = 'none';
                    }
                    
                    // 重置欢迎消息标志，这样下次登录时会显示欢迎消息
                    welcomeMessageShown = false;
                }
            })
            .catch(error => {
                console.error('退出登录失败:', error);
            });
    }

    // 更新UI为已登录用户
    function updateUIForLoggedInUser() {
        console.log('执行updateUIForLoggedInUser函数，当前用户:', currentUser);
        
        if (!currentUser) {
            console.error('currentUser为空，无法更新UI');
            return;
        }
        
        try {
            console.log('更新UI为已登录用户:', currentUser.username);
            
            // 隐藏登录按钮，显示用户资料
            const authButton = document.getElementById('authButton');
            if (authButton) {
                authButton.style.display = 'none';
            } else {
                console.error('未找到authButton元素');
            }
            
            const userProfile = document.getElementById('userProfile');
            if (userProfile) {
            userProfile.style.display = 'flex';
            } else {
                console.error('未找到userProfile元素');
            }
            
            // 显示聊天会话列表
            const chatSessions = document.getElementById('chatSessions');
            if (chatSessions) {
                console.log('显示聊天会话列表');
                chatSessions.style.display = 'block';
            } else {
                console.error('未找到聊天会话列表元素');
            }
            
            // 更新用户信息
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = currentUser.username;
            } else {
                console.error('未找到.user-name元素');
            }
            
            const userEmailElement = document.querySelector('.user-email');
            if (userEmailElement) {
                userEmailElement.textContent = currentUser.email;
            } else {
                console.error('未找到.user-email元素');
            }
            
            // 更新用户头像
            const avatarImg = document.querySelector('.user-avatar img');
            if (avatarImg && currentUser.avatar) {
                // 添加错误处理，如果头像加载失败，使用备用头像
                avatarImg.onerror = function() {
                    console.log('头像加载失败，使用备用头像');
                    this.src = '/static/img/default_avatar.png';
                };
                avatarImg.src = currentUser.avatar + '?t=' + new Date().getTime();
            } else {
                console.log('未找到头像元素或用户头像为空');
            }
            
            // 更新个人资料表单
            const profileUsername = document.getElementById('profileUsername');
            if (profileUsername) {
                profileUsername.value = currentUser.username;
            } else {
                console.error('未找到profileUsername元素');
            }
            
            const profileEmail = document.getElementById('profileEmail');
            if (profileEmail) {
                profileEmail.value = currentUser.email;
            } else {
                console.error('未找到profileEmail元素');
            }
            
            // 更新个人资料头像
            const profileAvatar = document.querySelector('.profile-avatar img');
            if (profileAvatar && currentUser.avatar) {
                // 添加错误处理，如果头像加载失败，使用备用头像
                profileAvatar.onerror = function() {
                    console.log('个人资料头像加载失败，使用备用头像');
                    this.src = '/static/img/default_avatar.png';
                };
                profileAvatar.src = currentUser.avatar + '?t=' + new Date().getTime();
            } else {
                console.log('未找到个人资料头像元素或用户头像为空');
            }
            
            // 重置情绪和香薰偏好复选框
            const emotionCheckboxes = document.querySelectorAll('.emotion-preference input[type="checkbox"]');
            if (emotionCheckboxes.length > 0) {
                emotionCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            } else {
                console.log('未找到情绪偏好复选框');
            }
            
            const aromaCheckboxes = document.querySelectorAll('.aroma-preference input[type="checkbox"]');
            if (aromaCheckboxes.length > 0) {
                aromaCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            } else {
                console.log('未找到香薰偏好复选框');
            }
            
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
            
            // 绑定用户菜单事件
            if (typeof bindUserMenuEvents === 'function') {
                bindUserMenuEvents();
            } else {
                console.error('bindUserMenuEvents函数未定义');
            }
            
            // 加载用户的人设偏好
            if (typeof loadUserPersona === 'function') {
            loadUserPersona();
            } else {
                console.log('loadUserPersona函数未定义，使用默认人设');
            }
            
            console.log('UI更新完成');
        } catch (error) {
            console.error('更新UI为已登录用户时出错:', error);
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
    
    // 全局变量，用于跟踪是否已经显示了欢迎消息
    let welcomeMessageShown = false;
    
    // 全局变量，用于跟踪当前加载的会话ID和加载状态
    let currentlyLoadingSessionId = null;
    let isLoadingChatHistory = false;
    
    // 加载聊天历史
    function loadChatHistory(sessionId) {
        // 如果已经在加载相同的会话，则不重复加载
        if (isLoadingChatHistory && sessionId === currentlyLoadingSessionId) {
            console.log('已经在加载会话ID:', sessionId, '，跳过重复加载');
            return;
        }
        
        // 设置加载状态
        isLoadingChatHistory = true;
        currentlyLoadingSessionId = sessionId;
        console.log('开始加载聊天历史，会话ID:', sessionId || '默认会话');
        
        // 清空聊天区域
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        // 重置欢迎消息标志（如果指定了会话ID，表示是切换会话，需要重置）
        if (sessionId) {
            welcomeMessageShown = false;
        }
        
        // 如果用户未登录，只显示欢迎消息，不请求API
        if (!isLoggedIn) {
            console.log('用户未登录，显示欢迎消息');
            if (!welcomeMessageShown) {
                addMessageToChat('assistant', '你好！我是你的情绪愈疗助手。今天感觉如何？有什么想和我分享的吗？');
                updateAssistantAvatars();
                welcomeMessageShown = true;
            }
            isLoadingChatHistory = false;
            return;
        }
        
        // 构建API URL
        let url = '/api/chat-history';
        if (sessionId) {
            url += `?session_id=${sessionId}`;
        }
        
        // 从后端API获取聊天历史
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取聊天历史失败');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.messages && data.messages.length > 0) {
                    console.log('加载聊天历史:', data.messages.length, '条消息');
                    
                    // 更新当前会话ID
                    if (data.session_id) {
                        currentSessionId = data.session_id;
                    }
                    
                    // 按时间顺序排序消息（从旧到新）
                    const sortedMessages = data.messages.sort((a, b) => {
                        return new Date(a.timestamp) - new Date(b.timestamp);
                    });
                    
                    // 添加消息到聊天区域
                    sortedMessages.forEach(msg => {
                        const sender = msg.is_user ? 'user' : 'assistant';
                        addMessageToChat(sender, msg.content, false); // 不滚动到底部
                        
                        // 记录最后一次的用户消息和助手回复
                        if (msg.is_user) {
                            lastUserMessage = msg.content;
                            // 添加到最近消息列表，防止重复检测误判
                            addToRecentMessages(msg.content);
                        } else {
                            lastAssistantReply = msg.content;
                        }
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
                    
                    // 更新对话轮数
                    dialogTurns = Math.floor(data.messages.length / 2); // 一问一答算一轮
                    console.log(`加载了 ${dialogTurns} 轮对话历史，最后的用户消息: "${lastUserMessage}", 最后的助手回复: "${lastAssistantReply}"`);
                    
                    // 如果对话轮数达到阈值，设置推荐标志
                    if (dialogTurns >= MIN_TURNS_BEFORE_RECOMMEND) {
                        shouldRecommendAroma = true;
                    }
                    
                    // 已经显示了历史消息，不需要显示欢迎消息
                    welcomeMessageShown = true;
                } else {
                    console.log('没有聊天历史或加载失败，显示欢迎消息');
                    // 如果没有历史记录，显示欢迎消息
                    if (!welcomeMessageShown) {
                        addMessageToChat('assistant', '你好！我是你的情绪愈疗助手。今天感觉如何？有什么想和我分享的吗？');
                        updateAssistantAvatars();
                        welcomeMessageShown = true;
                    }
                }
                // 重置加载状态
                isLoadingChatHistory = false;
            })
            .catch(error => {
                console.error('加载聊天历史失败:', error);
                // 出错时也显示欢迎消息
                if (!welcomeMessageShown) {
                    addMessageToChat('assistant', '你好！我是你的情绪愈疗助手。今天感觉如何？有什么想和我分享的吗？');
                    updateAssistantAvatars();
                    welcomeMessageShown = true;
                }
                // 重置加载状态
                isLoadingChatHistory = false;
            });
    }
    
    // 从历史记录更新情绪显示
    function updateEmotionDisplayFromHistory(emotion) {
        let emotionType, emotionLabel, emotionIcon, emotionDescription;
        
        // 检查emotion是否为对象
        if (typeof emotion === 'object' && emotion !== null) {
            // 如果是对象，直接使用其属性
            updateEmotionDisplay(
                emotion.type || 'neutral',
                emotion.type || '平静',
                emotion.icon || 'fa-meh',
                emotion.description || '您的情绪似乎比较平静。'
            );
            return;
        }
        
        // 如果是字符串，使用原有的switch逻辑
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
        if (e) {
        e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡
        }
        console.log('切换用户菜单');
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            // 直接切换显示状态，不使用class
            if (userMenu.style.display === 'block') {
                userMenu.style.display = 'none';
            } else {
                userMenu.style.display = 'block';
                
                // 添加点击外部区域关闭菜单的事件
                setTimeout(() => {
                    document.addEventListener('click', function closeMenu(event) {
                        const userMenuToggle = document.querySelector('.user-menu-toggle');
                        if (!userMenu.contains(event.target) && !userMenuToggle.contains(event.target)) {
                            userMenu.style.display = 'none';
                            document.removeEventListener('click', closeMenu);
                        }
                    });
                }, 10);
            }
        }
    }

    // 处理菜单项点击
    function handleMenuItemClick(e, index) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.style.display = 'none';
        }

        if (index === 0) { // 个人资料
            openModal('profileModal');
        } else if (index === 1) { // Token使用统计
            window.location.href = "/token-stats";
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

    // 添加初始化对话上下文的函数
    function initDialogContext() {
        // 从localStorage获取持久化的对话上下文
        const savedContext = localStorage.getItem('dialogContext');
        if (savedContext) {
            try {
                const context = JSON.parse(savedContext);
                dialogTurns = context.dialogTurns || 0;
                userPreferences = context.userPreferences || {
                    scents: [],
                    aromatherapy_types: [],
                    concerns: [],
                    preferences_collected: false
                };
                shouldRecommendAroma = context.shouldRecommendAroma || false;
            } catch (e) {
                console.error('解析对话上下文失败:', e);
                resetDialogContext();
            }
        } else {
            resetDialogContext();
        }
    }

    // 添加重置对话上下文的函数
    function resetDialogContext() {
        dialogTurns = 0;
        userPreferences = {
            scents: [],
            aromatherapy_types: [],
            concerns: [],
            preferences_collected: false
        };
        shouldRecommendAroma = false;
        saveDialogContext();
    }

    // 添加保存对话上下文的函数
    function saveDialogContext() {
        const context = {
            dialogTurns,
            userPreferences,
            shouldRecommendAroma
        };
        localStorage.setItem('dialogContext', JSON.stringify(context));
        
        // 更新偏好显示
        updatePreferencesDisplay();
    }

    // 添加识别用户偏好的函数
    function extractUserPreferencesFromMessage(message) {
        // 香气类型关键词
        const scentKeywords = {
            '花香': ['花香', '玫瑰', '茉莉', '薰衣草', '花香调', '花香型'],
            '柑橘香': ['柑橘', '柠檬', '橙子', '柚子', '青柠', '柑橘香', '水果香'],
            '木质香': ['木质', '檀香', '雪松', '木质香', '檀木'],
            '草本香': ['草本', '迷迭香', '薄荷', '尤加利', '草药', '草本香'],
            '东方香': ['东方', '琥珀', '香草', '麝香', '辛香料'],
            '海洋香': ['海洋', '清新', '水生', '海盐']
        };
        
        // 香薰类型关键词
        const aromatherapyTypes = {
            '精油': ['精油', '香精油'],
            '香薰蜡烛': ['蜡烛', '香薰蜡烛', '香氛蜡烛'],
            '扩香器': ['扩香', '扩香器', '香薰机', '加湿器'],
            '香薰棒': ['香薰棒', '藤条', '香氛棒'],
            '香水': ['香水', '香氛水']
        };
        
        // 提取到的偏好
        let detectedScents = [];
        let detectedTypes = [];
        
        // 识别香气偏好
        for (const [scent, keywords] of Object.entries(scentKeywords)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    detectedScents.push(scent);
                    break;  // 找到一个关键词后跳出内循环
                }
            }
        }
        
        // 识别香薰类型偏好
        for (const [type, keywords] of Object.entries(aromatherapyTypes)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    detectedTypes.push(type);
                    break;  // 找到一个关键词后跳出内循环
                }
            }
        }
        
        // 去重
        detectedScents = [...new Set(detectedScents)];
        detectedTypes = [...new Set(detectedTypes)];
        
        return {
            scents: detectedScents,
            aromatherapy_types: detectedTypes
        };
    }

    // 更新用户偏好
    function updateUserPreferences(extractedPreferences) {
        if (!extractedPreferences) return;
        
        // 确保userPreferences已正确初始化
        if (!userPreferences) {
            userPreferences = {
                scents: [],
                aromatherapy_types: [],
                concerns: [],
                preferences_collected: false
            };
        }
        
        // 确保必要的数组属性存在
        if (!userPreferences.scents) userPreferences.scents = [];
        if (!userPreferences.aromatherapy_types) userPreferences.aromatherapy_types = [];
        
        // 合并现有偏好与新提取的偏好
        if (extractedPreferences.scents && extractedPreferences.scents.length > 0) {
            userPreferences.scents = [...new Set([...userPreferences.scents, ...extractedPreferences.scents])];
        }
        
        if (extractedPreferences.aromatherapy_types && extractedPreferences.aromatherapy_types.length > 0) {
            userPreferences.aromatherapy_types = [...new Set([...userPreferences.aromatherapy_types, ...extractedPreferences.aromatherapy_types])];
        }
        
        // 标记已收集到偏好
        if ((userPreferences.scents.length > 0 || userPreferences.aromatherapy_types.length > 0) && 
            !userPreferences.preferences_collected) {
            userPreferences.preferences_collected = true;
        }
        
        // 保存更新后的对话上下文
        saveDialogContext();
    }

    // 添加显示用户偏好的函数
    function updatePreferencesDisplay() {
        // 选择情绪显示区域
        const emotionDisplay = document.querySelector('.emotion-display');
        if (!emotionDisplay) return;
        
        // 确保userPreferences和其属性已正确初始化
        if (!userPreferences) {
            userPreferences = {
                scents: [],
                aromatherapy_types: [],
                concerns: [],
                preferences_collected: false
            };
        }
        
        // 确保scents和aromatherapy_types存在
        if (!userPreferences.scents) userPreferences.scents = [];
        if (!userPreferences.aromatherapy_types) userPreferences.aromatherapy_types = [];
        
        // 检查是否已有偏好显示区域
        let prefDisplay = document.querySelector('.preferences-display');
        
        // 如果偏好区域不存在且有偏好数据，则创建
        if (!prefDisplay && 
            (userPreferences.scents.length > 0 || userPreferences.aromatherapy_types.length > 0)) {
            
            prefDisplay = document.createElement('div');
            prefDisplay.className = 'preferences-display';
            
            const prefTitle = document.createElement('h3');
            prefTitle.textContent = '您的香薰偏好';
            prefTitle.className = 'preferences-title';
            prefDisplay.appendChild(prefTitle);
            
            // 添加到情绪显示区域后面
            emotionDisplay.appendChild(prefDisplay);
        }
        
        // 如果有偏好显示区域，更新内容
        if (prefDisplay) {
            // 清除现有内容（除了标题）
            while (prefDisplay.childNodes.length > 1) {
                prefDisplay.removeChild(prefDisplay.lastChild);
            }
            
            // 添加喜爱的香气
            if (userPreferences.scents && userPreferences.scents.length > 0) {
                const scentSection = document.createElement('div');
                scentSection.className = 'preference-section';
                
                const scentLabel = document.createElement('span');
                scentLabel.className = 'preference-label';
                scentLabel.textContent = '喜爱的香气：';
                scentSection.appendChild(scentLabel);
                
                const scentValue = document.createElement('span');
                scentValue.className = 'preference-value';
                scentValue.textContent = userPreferences.scents.join('、');
                scentSection.appendChild(scentValue);
                
                prefDisplay.appendChild(scentSection);
            }
            
            // 添加喜爱的香薰类型
            if (userPreferences.aromatherapy_types && userPreferences.aromatherapy_types.length > 0) {
                const typeSection = document.createElement('div');
                typeSection.className = 'preference-section';
                
                const typeLabel = document.createElement('span');
                typeLabel.className = 'preference-label';
                typeLabel.textContent = '喜爱的香薰类型：';
                typeSection.appendChild(typeLabel);
                
                const typeValue = document.createElement('span');
                typeValue.className = 'preference-value';
                typeValue.textContent = userPreferences.aromatherapy_types.join('、');
                typeSection.appendChild(typeValue);
                
                prefDisplay.appendChild(typeSection);
            }
        }
    }

    // 单独的函数来绑定用户菜单事件
    function bindUserMenuEvents() {
        const userMenuToggle = document.querySelector('.user-menu-toggle');
        const userMenu = document.querySelector('.user-menu');
        
        if (userMenuToggle && userMenu) {
            console.log('绑定用户菜单事件');
            
            // 确保初始状态为隐藏
            userMenu.style.display = 'none';
            
            // 移除并重新添加点击事件
            userMenuToggle.removeEventListener('click', toggleUserMenu);
            userMenuToggle.addEventListener('click', toggleUserMenu);
            
            // 为菜单项添加点击事件
            const menuItems = userMenu.querySelectorAll('li');
            menuItems.forEach((item, index) => {
                item.removeEventListener('click', handleMenuItemClick);
                item.addEventListener('click', function(e) {
                    handleMenuItemClick(e, index);
                });
            });
        }
    }

    // 检查回复与用户消息的相关性
    function checkReplyRelevance(userMessage, reply) {
        console.log("检查回复相关性");
        
        if (!userMessage || !reply) {
            return true; // 如果没有提供完整信息，默认为相关
        }
        
        // 提取用户消息和回复的关键主题
        const userLower = userMessage.toLowerCase();
        const replyLower = reply.toLowerCase();
        
        // 关键主题映射（主题 -> 关键词数组）
        const topicKeywords = {
            '考试': ['考试', '测试', '考核', '考', '成绩', '分数', '题目', '答案', '复习', '准备', '备考', '难题'],
            '学习': ['学习', '课程', '课本', '作业', '知识', '理解', '记忆', '学校', '大学', '老师', '学不会', '不懂'],
            '焦虑': ['焦虑', '紧张', '不安', '担心', '忧虑', '压力', '压抑', '不知所措', '慌张', '心慌'],
            '心情': ['心情', '情绪', '感受', '感觉', '心态', '难过', '开心', '伤心', '失落', '沮丧', '欣喜'],
            '工作': ['工作', '职业', '事业', '同事', '上司', '老板', '职场', '就业', '面试', '跳槽', '升职'],
            '人际关系': ['朋友', '友谊', '关系', '沟通', '交往', '亲密', '疏远', '社交', '互动', '孤独']
        };
        
        // 找出用户消息中提到的主题
        const userTopics = [];
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            for (const keyword of keywords) {
                if (userLower.includes(keyword)) {
                    userTopics.push(topic);
                    break; // 一个主题只添加一次
                }
            }
        }
        
        // 如果用户没有提及特定主题，则视为通用对话，回复被视为相关
        if (userTopics.length === 0) {
            console.log("用户消息未明确提及特定主题，默认回复相关");
            return true;
        }
        
        // 检查回复是否包含用户提及的主题
        let topicMatched = false;
        for (const topic of userTopics) {
            const keywords = topicKeywords[topic];
            for (const keyword of keywords) {
                if (replyLower.includes(keyword)) {
                    console.log(`主题匹配成功: 用户提到"${topic}", 回复包含关键词"${keyword}"`);
                    topicMatched = true;
                    break;
                }
            }
            if (topicMatched) break;
        }
        
        // 检查是否包含通用套话而没有实质内容
        const genericPhrases = [
            "感谢你的分享",
            "通过我们的对话",
            "你是一个非常",
            "希望我的回答对你有所帮助",
            "如果你有任何其他问题",
            "面对这些情况",
            "你内心最希望得到什么样的支持"
        ];
        
        let hasGenericOnly = false;
        if (reply.length < 100) { // 短回复更容易是套话
            hasGenericOnly = genericPhrases.some(phrase => replyLower.includes(phrase.toLowerCase()));
            if (hasGenericOnly) {
                console.log("检测到回复仅包含通用套话");
            }
        }
        
        // 如果回复中包含用户提到的主题关键词，且不仅仅是通用套话，则认为相关
        const isRelevant = topicMatched && !hasGenericOnly;
        console.log(`回复相关性检查结果: ${isRelevant ? '相关' : '不相关'}`);
        
        return isRelevant;
    }

    // 检查用户消息是否表达了心情好转
    function checkMoodImprovement(message) {
        if (!message) return false;
        
        const lowerMessage = message.toLowerCase();
        
        // 感谢相关关键词 - 用户表达感谢通常意味着得到了帮助
        const thankKeywords = [
            '谢谢', '感谢', '谢谢你', '谢了', '多谢', '感激', 
            '非常感谢', '谢谢您', '谢谢啦', '谢谢老师', '谢谢助手'
        ];
        
        // 心情好转相关关键词 - 用户直接表达情绪改善
        const improvedMoodKeywords = [
            '好多了', '感觉好些了', '舒服多了', '轻松多了', '好点了', 
            '没那么难受了', '心情好了', '感觉好了', '好转', '缓解', 
            '放松了', '安心了', '平静了', '不那么焦虑了', '不那么紧张了',
            '有帮助', '有用', '有效', '起作用', '管用', '有道理',
            '明白了', '理解了', '清楚了', '豁然开朗', '茅塞顿开'
        ];
        
        // 检查是否包含感谢关键词
        const containsThanks = thankKeywords.some(keyword => lowerMessage.includes(keyword));
        
        // 检查是否包含心情好转关键词
        const containsImprovedMood = improvedMoodKeywords.some(keyword => lowerMessage.includes(keyword));
        
        // 如果包含感谢或心情好转的关键词，则认为用户心情有所好转
        // 这是推荐香薰的好时机，因为用户可能更愿意接受建议
        const moodImproved = containsThanks || containsImprovedMood;
        
        if (moodImproved) {
            console.log('检测到用户表达了感谢或心情好转，这是推荐香薰的好时机');
        }
        
        return moodImproved;
    }
    
    // 获取CSRF令牌
    function getCsrfToken() {
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        return csrfMeta ? csrfMeta.getAttribute('content') : '';
    }

    // 加载聊天会话列表
    function loadChatSessions() {
        console.log('开始加载聊天会话列表...');
        
        // 显示聊天会话列表区域
        const chatSessionsElement = document.getElementById('chatSessions');
        if (chatSessionsElement) {
            console.log('找到chatSessions元素，设置为显示');
            chatSessionsElement.style.display = 'block';
            
            // 强制显示，防止CSS样式冲突
            setTimeout(() => {
                chatSessionsElement.style.display = 'block';
                console.log('再次确认chatSessions元素显示');
            }, 500);
        } else {
            console.error('未找到chatSessions元素');
        }
        
        // 从后端API获取聊天会话列表
        console.log('开始从API获取聊天会话列表...');
        fetch('/api/chat-sessions')
            .then(response => {
                console.log('收到API响应:', response.status);
                if (!response.ok) {
                    throw new Error('获取聊天会话列表失败');
                }
                return response.json();
            })
            .then(data => {
                console.log('解析API响应数据:', data);
                if (data.success && data.sessions) {
                    console.log('加载聊天会话列表:', data.sessions.length, '个会话');
                    updateChatSessionsUI(data.sessions);
                } else {
                    console.log('没有聊天会话或加载失败');
                    updateChatSessionsUI([]);
                }
            })
            .catch(error => {
                console.error('加载聊天会话列表失败:', error);
                updateChatSessionsUI([]);
            });
    }
    
    // 全局变量，用于存储新对话按钮的事件处理函数
    let newSessionBtnClickHandler = null;
    
    // 更新聊天会话列表UI
    function updateChatSessionsUI(sessions) {
        console.log('开始更新聊天会话列表UI...');
        
        const chatSessionsList = document.getElementById('chatSessionsList');
        if (!chatSessionsList) {
            console.error('未找到chatSessionsList元素');
            return;
        }
        
        console.log('找到chatSessionsList元素，开始清空列表');
        // 清空列表
        chatSessionsList.innerHTML = '';
        
        // 添加"新建会话"按钮事件
        const newSessionBtn = document.getElementById('newSessionBtn');
        if (newSessionBtn) {
            console.log('找到newSessionBtn元素，绑定点击事件');
            
            // 移除所有现有的点击事件处理程序
            if (newSessionBtnClickHandler) {
                console.log('移除现有的点击事件处理程序');
                newSessionBtn.removeEventListener('click', newSessionBtnClickHandler);
            }
            
            // 创建新的事件处理函数
            newSessionBtnClickHandler = function(e) {
                console.log('新对话按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                
                // 防止重复点击
                if (this.disabled) {
                    console.log('按钮已禁用，忽略点击');
                    return;
                }
                
                // 临时禁用按钮，防止重复点击
                this.disabled = true;
                
                // 创建新会话
                createNewSession();
                
                // 1秒后重新启用按钮
                setTimeout(() => {
                    this.disabled = false;
                }, 1000);
            };
            
            // 添加新的点击事件处理程序
            newSessionBtn.addEventListener('click', newSessionBtnClickHandler);
            console.log('成功绑定新的点击事件处理程序');
        } else {
            console.error('未找到newSessionBtn元素');
        }
        
        // 如果没有会话，显示提示信息
        if (sessions.length === 0) {
            console.log('没有会话，显示提示信息');
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-sessions-message';
            emptyMessage.textContent = '没有聊天记录，开始新的对话吧！';
            chatSessionsList.appendChild(emptyMessage);
            return;
        }
        
        console.log('开始添加会话项，共', sessions.length, '个会话');
        // 添加会话项
        sessions.forEach((session, index) => {
            console.log(`添加第${index + 1}个会话项:`, session.id, session.title);
            const sessionItem = document.createElement('div');
            sessionItem.className = 'chat-session-item';
            if (session.id === currentSessionId) {
                sessionItem.classList.add('active');
            }
            sessionItem.dataset.sessionId = session.id;
            
            const titleElement = document.createElement('div');
            titleElement.className = 'chat-session-title';
            titleElement.textContent = session.title || '新对话';
            
            const previewElement = document.createElement('div');
            previewElement.className = 'chat-session-preview';
            previewElement.textContent = session.preview || '没有内容';
            
            const actionsElement = document.createElement('div');
            actionsElement.className = 'chat-session-actions';
            
            // 编辑按钮
            const editAction = document.createElement('div');
            editAction.className = 'chat-session-action edit';
            editAction.innerHTML = '<i class="fas fa-edit"></i>';
            editAction.onclick = (e) => {
                e.stopPropagation();
                editSessionTitle(session.id);
            };
            
            // 删除按钮
            const deleteAction = document.createElement('div');
            deleteAction.className = 'chat-session-action delete';
            deleteAction.innerHTML = '<i class="fas fa-trash"></i>';
            deleteAction.onclick = (e) => {
                e.stopPropagation();
                deleteSession(session.id);
            };
            
            actionsElement.appendChild(editAction);
            actionsElement.appendChild(deleteAction);
            
            sessionItem.appendChild(titleElement);
            sessionItem.appendChild(previewElement);
            sessionItem.appendChild(actionsElement);
            
            // 点击会话项切换到该会话
            sessionItem.onclick = () => {
                switchToSession(session.id);
            };
            
            chatSessionsList.appendChild(sessionItem);
        });
    }
    
    // 全局变量，用于跟踪是否正在创建新会话
    let isCreatingNewSession = false;
    
    // 创建新会话
    function createNewSession() {
        console.log('点击创建新会话按钮');
        
        // 防止重复创建
        if (isCreatingNewSession) {
            console.log('已经在创建新会话中，忽略重复请求');
            return;
        }
        
        // 设置创建状态
        isCreatingNewSession = true;
        
        // 检查用户是否已登录
        if (!isLoggedIn) {
            console.log('用户未登录，显示登录提示');
            alert('请先登录后再创建新对话');
            // 打开登录模态框
            openModal('authModal');
            // 重置创建状态
            isCreatingNewSession = false;
            return;
        }
        
        // 获取CSRF令牌
        const csrfToken = getCsrfToken();
        console.log('获取到CSRF令牌:', csrfToken ? '成功' : '失败');
        
        fetch('/api/chat-sessions/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            console.log('创建新会话API响应状态:', response.status);
            if (!response.ok) {
                throw new Error('创建新会话失败，状态码: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('创建新会话API响应数据:', data);
            if (data.success && data.session) {
                console.log('创建新会话成功:', data.session);
                // 切换到新会话
                switchToSession(data.session.id);
                // 重新加载会话列表
                loadChatSessions();
            } else {
                console.error('创建新会话失败:', data.message);
                alert('创建新会话失败: ' + (data.message || '未知错误'));
            }
            // 重置创建状态
            isCreatingNewSession = false;
        })
        .catch(error => {
            console.error('创建新会话请求失败:', error);
            alert('创建新会话请求失败: ' + error.message);
            // 重置创建状态
            isCreatingNewSession = false;
        });
    }
    
    // 切换到指定会话
    function switchToSession(sessionId) {
        if (sessionId === currentSessionId) return;
        
        currentSessionId = sessionId;
        
        // 保存当前会话ID到localStorage
        localStorage.setItem('currentSessionId', sessionId);
        
        // 更新UI中的活动会话
        const sessionItems = document.querySelectorAll('.chat-session-item');
        sessionItems.forEach(item => {
            if (item.dataset.sessionId == sessionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // 重置欢迎消息标志，确保切换会话时不会显示重复的欢迎消息
        welcomeMessageShown = false;
        
        // 加载该会话的聊天历史
        loadChatHistory(sessionId);
    }
    
    // 编辑会话标题
    function editSessionTitle(sessionId) {
        const newTitle = prompt('请输入新的会话标题:');
        if (newTitle === null || newTitle.trim() === '') return;
        
        fetch(`/api/chat-sessions/${sessionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                title: newTitle.trim()
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('更新会话标题失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('更新会话标题成功');
                // 重新加载会话列表
                loadChatSessions();
            } else {
                console.error('更新会话标题失败:', data.message);
            }
        })
        .catch(error => {
            console.error('更新会话标题请求失败:', error);
        });
    }
    
    // 删除会话
    function deleteSession(sessionId) {
        if (!confirm('确定要删除这个会话吗？此操作不可撤销。')) return;
        
        fetch(`/api/chat-sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('删除会话失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('删除会话成功');
                
                // 如果删除的是当前会话，切换到其他会话或创建新会话
                if (sessionId === currentSessionId) {
                    // 重新加载会话列表，会自动切换到第一个会话或显示空状态
                    loadChatSessions();
                    // 清空聊天区域
                    const chatMessages = document.getElementById('chatMessages');
                    if (chatMessages) {
                        chatMessages.innerHTML = '';
                    }
                    currentSessionId = null;
                } else {
                    // 仅重新加载会话列表
                    loadChatSessions();
                }
            } else {
                console.error('删除会话失败:', data.message);
            }
        })
        .catch(error => {
            console.error('删除会话请求失败:', error);
        });
    }

    // 获取情绪图标
    function getEmotionIcon(emotion) {
        const emotionIcons = {
            '快乐': 'fa-grin-beam',
            '悲伤': 'fa-sad-tear',
            '愤怒': 'fa-angry',
            '焦虑': 'fa-frown',
            '压力': 'fa-tired',
            '疲惫': 'fa-tired',
            '失眠': 'fa-moon',
            '平静': 'fa-smile'
        };
        return emotionIcons[emotion] || 'fa-smile';
    }
    
    // 获取情绪描述
    function getEmotionDescription(emotion) {
        const emotionDescriptions = {
            '快乐': '您似乎心情不错！享受这美好的时刻，并记住这种感觉。',
            '悲伤': '您似乎感到有些悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。',
            '愤怒': '您似乎感到有些愤怒。这是一种正常的情绪，尝试找到健康的方式来表达它。',
            '焦虑': '您似乎感到有些焦虑。深呼吸可能会有所帮助，尝试放松您的身心。',
            '压力': '您似乎感到有些压力。适当的休息和放松对缓解压力很有帮助。',
            '疲惫': '您似乎感到有些疲惫。适当的休息对身心健康都很重要。',
            '失眠': '您似乎有些睡眠问题。建立良好的睡眠习惯可能会有所帮助。',
            '平静': '您当前的情绪状态看起来很平静。'
        };
        return emotionDescriptions[emotion] || '您当前的情绪状态看起来很平静。';
    }

    // 添加情绪状态切换函数
    function toggleEmotionDisplay() {
        // 情绪类型列表
        const emotions = ['平静', '快乐', '悲伤', '愤怒', '焦虑', '疲惫'];
        
        // 获取当前显示的情绪
        const currentLabel = document.querySelector('.emotion-label').textContent;
        
        // 确定下一个要显示的情绪
        let nextIndex = emotions.indexOf(currentLabel) + 1;
        if (nextIndex >= emotions.length) {
            nextIndex = 0;
        }
        
        const nextEmotion = emotions[nextIndex];
        
        // 更新情绪显示
        updateEmotionDisplay(
            nextEmotion,
            nextEmotion,
            getEmotionIcon(nextEmotion),
            getEmotionDescription(nextEmotion)
        );
        
        // 更新当前情绪变量
        currentEmotion = nextEmotion;
        
        // 更新情绪相关推荐
        loadRecommendations();
    }
} 