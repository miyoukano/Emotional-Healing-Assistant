// 全局变量
const MIN_TURNS_BEFORE_RECOMMEND = 7; // 至少经过多少轮对话后才推荐香薰
let currentUser = null;
let isLoggedIn = false;
let currentEmotion = '平静';
let currentPersona = 'empathetic';
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
        checkLoginStatus().then(() => {
            // 验证用户登录后，加载聊天历史
            if (isLoggedIn && currentUser) {
                console.log('用户已登录，加载聊天历史...');
                loadChatHistory();
                
                // 直接绑定用户菜单事件
                bindUserMenuEvents();
            } else {
                // 未登录用户也加载聊天历史（可能有本地存储的历史）
                // 如果没有历史记录，loadChatHistory会添加欢迎消息
                console.log('用户未登录，尝试加载本地聊天历史...');
                loadChatHistory();
            }
        });

        // 初始化聊天区域滚动
        scrollChatToBottom();
        
        // 初始化对话轮数和用户偏好
        initDialogContext();
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

    // 发送消息
    function sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (message === '') return;
        
        // 记录当前用户消息
        lastUserMessage = message;
        
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
        
        // 增加对话轮数
        dialogTurns++;
        
        // 检查是否应该推荐香薰 - 基于对话轮数的标准条件
        if (dialogTurns >= MIN_TURNS_BEFORE_RECOMMEND && !shouldRecommendAroma) {
            shouldRecommendAroma = true;
        }
        
        // 检查用户是否表达了心情好转 - 新增的推荐条件
        // 当用户表达感谢或心情好转时，即使对话轮数未达到标准，也可以推荐香薰
        // 这是因为此时用户可能更愿意接受建议，推荐的接受度会更高
        const moodImproved = checkMoodImprovement(message);
        if (moodImproved && !shouldRecommendAroma) {
            console.log('用户表达了心情好转，将推荐香薰，即使对话轮数未达到标准');
            shouldRecommendAroma = true;
        }
        
        // 保存对话上下文
        saveDialogContext();
        
        // 提取并更新用户偏好
        const extractedPreferences = extractUserPreferencesFromMessage(message);
        updateUserPreferences(extractedPreferences);
        
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
                persona: currentPersona,
                dialogTurns: dialogTurns,
                shouldRecommendAroma: shouldRecommendAroma,
                userPreferences: userPreferences
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
                        data.emotion_type || 'neutral', 
                        data.emotion || '平静', 
                        data.emotion_icon || 'fa-smile',
                        data.emotion_description || '您当前的情绪状态看起来很平静'
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
                if (data.user_message_saved) {
                    setTimeout(() => {
                        const refreshMessage = '您的消息已保存，但我的回复保存失败。刷新页面可能会看到完整对话。';
                        addMessageToChat('assistant', refreshMessage);
                        lastAssistantReply = refreshMessage;
                    }, 1000);
                }
            }
        })
        .catch(error => {
            console.error('发送消息失败:', error);
            
            // 移除"正在输入"状态
            removeTypingIndicator();
            
            // 显示错误消息
            const errorMessage = `抱歉，发生了错误: ${error.message || '网络连接问题'}。请检查您的网络连接并稍后再试。`;
            addMessageToChat('assistant', errorMessage);
            lastAssistantReply = errorMessage;
            
            // 添加重试按钮
            setTimeout(() => {
                const retryMessage = document.createElement('div');
                retryMessage.className = 'message assistant retry-message';
                retryMessage.innerHTML = `
                    <div class="message-content">
                        <p>您可以 <button class="retry-button">重试发送</button> 这条消息。</p>
                    </div>
                `;
                
                // 添加重试按钮点击事件
                chatMessages.appendChild(retryMessage);
                const retryButton = retryMessage.querySelector('.retry-button');
                retryButton.addEventListener('click', () => {
                    // 移除重试消息
                    retryMessage.remove();
                    // 重新发送最后一条消息
                    messageInput.value = lastUserMessage;
                    sendMessage();
                });
            }, 2000);
        });
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
        let userHasSpecificContext = false;
        
        for (const keyword of specificKeywords) {
            if (lastUserMessage.toLowerCase().includes(keyword)) {
                userHasSpecificContext = true;
                // 检查回复是否包含相同的关键词，确保上下文连贯
                if (!reply.toLowerCase().includes(keyword)) {
                    console.log(`用户提到了"${keyword}"，但回复中未包含相关内容，可能不够相关`);
                    return true;
                }
            }
        }
        
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

你能告诉我更多关于让你感到焦虑的具体情况吗？这样我可以提供更有针对性的建议。`;
        }
        // 检查是否包含情绪相关内容
        else if (lowerMessage.includes('难过') || lowerMessage.includes('伤心') || 
                 lowerMessage.includes('不开心') || lowerMessage.includes('失落')) {
            return `听到你感到难过，我很理解这种感受。有时候情绪会让我们感到沉重，这是完全正常的。

面对这些情绪，你可以尝试：
1. **允许自己感受**：不要压抑情绪，给自己空间和时间去感受它们
2. **温和对待自己**：就像对待一位正在经历困难的朋友一样对待自己
3. **寻找支持**：与信任的朋友或家人分享你的感受
4. **小小的愉悦活动**：做一些简单的、能让你感到一丝愉悦的事情
5. **规律作息**：保持规律的生活节奏可以帮助稳定情绪

你愿意分享是什么让你感到难过吗？或者有什么我可以帮助你的地方？`;
        }
        // 检查是否包含学业或工作压力相关内容
        else if (lowerMessage.includes('学习') || lowerMessage.includes('工作') || 
                 lowerMessage.includes('压力') || lowerMessage.includes('忙')) {
            return `学习和工作的压力确实会让人感到焦虑和不堪重负。这种感受很常见，但也有方法可以帮助你更好地应对：

1. **任务分解**：将大任务分解成小步骤，逐一完成，这样会减轻心理负担
2. **优先级排序**：确定哪些任务最重要或最紧急，先处理这些任务
3. **时间管理**：尝试番茄工作法（25分钟专注工作，5分钟休息）等技巧提高效率
4. **设定界限**：学会说"不"，避免承担过多责任
5. **寻求协助**：不要犹豫向同事、同学或导师寻求帮助

你最近面临哪些具体的学习或工作挑战？或许我们可以一起想办法解决。`;
        }
        // 针对游戏开发和面试相关的替代回复
        else if (lowerMessage.includes('面试') || lowerMessage.includes('工作')) {
            if (lowerMessage.includes('网易') || lowerMessage.includes('实习')) {
                return `看来你收到了网易游戏客户端开发实习岗的面试邀请，这真是个好消息！网易在游戏行业的地位不言而喻。面试前，我建议你可以：

1. 熟悉网易主要游戏产品和技术栈（Unity/Unreal等）
2. 复习图形渲染、游戏引擎架构、性能优化等核心知识点
3. 准备1-2个你参与过的游戏项目案例，能够清晰地阐述你的贡献和解决的技术挑战
4. 了解一些网易的游戏，比如《阴阳师》《第五人格》《梦幻西游》等热门产品

你对面试中哪方面技术问题比较担心？或者你想重点准备哪些方面？`;
            } else {
                return `恭喜你收到面试邀请！作为游戏客户端开发者，这是展示你技能的好机会。

游戏客户端面试通常会关注这些方面：
1. 编程基础与数据结构
2. 图形学与渲染管线知识
3. 游戏引擎使用经验（Unity/Unreal等）
4. 性能优化技巧
5. 项目经验与解决问题的能力

你已经有什么准备了吗？或者有特定的技术领域需要重点复习？`;
            }
        }
        // 通用回复，尝试基于用户最后一条消息提供相关的回应
        else {
            return `我注意到你提到了"${userMessage.substring(0, Math.min(20, userMessage.length))}..."。能否告诉我更多关于这方面的情况？我很想了解你的想法和感受，这样我才能提供更有针对性的支持。

有时候，与他人分享我们的想法和经历可以帮助我们更好地理解自己的情绪。无论你想讨论什么，我都在这里倾听和支持你。`;
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
        // 判断是否应该显示推荐
        // 有两种情况会显示推荐：
        // 1. 对话轮数达到MIN_TURNS_BEFORE_RECOMMEND（默认7轮）
        // 2. 用户表达了心情好转（通过shouldRecommendAroma标志判断）
        if (!shouldRecommendAroma && dialogTurns < MIN_TURNS_BEFORE_RECOMMEND) {
            const recommendationsContainer = document.querySelector('.recommendation-cards');
            recommendationsContainer.innerHTML = '';
            
            const placeholder = document.createElement('div');
            placeholder.className = 'recommendation-placeholder';
            
            // 根据对话轮数提供不同的提示信息
            if (dialogTurns === 0) {
                placeholder.textContent = '我是你的情感助手，让我们先聊聊你的感受...';
            } else if (dialogTurns < 3) {
                placeholder.textContent = '继续交流，我希望能更好地了解你的情况...';
            } else {
                placeholder.textContent = `再聊${MIN_TURNS_BEFORE_RECOMMEND - dialogTurns}轮后，我会为你推荐合适的香薰产品...`;
            }
            
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
        const recommendationsContainer = document.querySelector('.recommendation-cards');
        recommendationsContainer.innerHTML = '';

        // 只有当应该推荐香薰时才显示推荐
        if (shouldRecommendAroma) {
        recommendations.forEach(product => {
            const card = createProductCard(product);
                recommendationsContainer.appendChild(card);
            });
        } else {
            // 显示占位符或提示信息
            const placeholder = document.createElement('div');
            placeholder.className = 'recommendation-placeholder';
            placeholder.textContent = '与助手多聊聊，了解你的需求后将为你推荐合适的香薰产品...';
            recommendationsContainer.appendChild(placeholder);
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
        return new Promise((resolve, reject) => {
        // 从后端API获取当前用户信息
        fetch('/api/user/profile')
            .then(response => {
                if (response.status === 401) {
                    // 未登录
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
                    currentUser = data.user;
                    isLoggedIn = true;
                    updateUIForLoggedInUser();
                        resolve(true);
                    } else if (data) {
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
            
            // 绑定用户菜单事件
            bindUserMenuEvents();
            
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
                        
                        // 记录最后一次的用户消息和助手回复
                        if (msg.is_user) {
                            lastUserMessage = msg.content;
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
                    
                    // 从服务器获取用户偏好
                    if (data.userPreferences) {
                        userPreferences = data.userPreferences;
                        
                        // 检查转换格式，确保结构一致
                        if (!userPreferences.scents && userPreferences.aromas) {
                            userPreferences.scents = userPreferences.aromas;
                        }
                        
                        if (!userPreferences.aromatherapy_types && userPreferences.types) {
                            userPreferences.aromatherapy_types = userPreferences.types;
                        }
                        
                        // 确保所有必要的字段都存在
                        userPreferences.scents = userPreferences.scents || [];
                        userPreferences.aromatherapy_types = userPreferences.aromatherapy_types || [];
                        userPreferences.concerns = userPreferences.concerns || [];
                        userPreferences.preferences_collected = userPreferences.preferences_collected || 
                            (userPreferences.scents.length > 0 || userPreferences.aromatherapy_types.length > 0);
                    }
                    
                    // 保存对话上下文并更新偏好显示
                    saveDialogContext();
                    
                    // 加载推荐区域
                    loadRecommendations();
                } else {
                    console.log('没有聊天历史或加载失败');
                    // 检查是否已经添加了欢迎消息
                    if (!hasAddedWelcomeMessage) {
                        // 添加欢迎消息
                        addMessageToChat('assistant', '你好！我是你的情绪愈疗助手。今天你感觉怎么样？有什么我可以帮助你的吗？');
                        lastAssistantReply = '你好！我是你的情绪愈疗助手。今天你感觉怎么样？有什么我可以帮助你的吗？';
                        hasAddedWelcomeMessage = true;
                    }
                }
            })
            .catch(error => {
                console.error('加载聊天历史错误:', error);
                // 检查是否已经添加了欢迎消息
                if (!hasAddedWelcomeMessage) {
                    // 添加欢迎消息
                    addMessageToChat('assistant', '你好！我是你的情绪愈疗助手。今天你感觉怎么样？有什么我可以帮助你的吗？');
                    lastAssistantReply = '你好！我是你的情绪愈疗助手。今天你感觉怎么样？有什么我可以帮助你的吗？';
                    hasAddedWelcomeMessage = true;
                }
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
        } else if (index === 1) { // 退出登录
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
} 