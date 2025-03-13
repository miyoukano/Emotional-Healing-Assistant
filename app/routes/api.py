from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app import db, csrf
from app.models import User, ChatMessage, EmotionRecord, AromaProduct, product_emotions
from app.utils.spark_api import get_spark_client
from app.utils.aromatherapy_recommender import recommend_products_for_emotion, get_product_details
import json
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
import sys
import logging
from sqlalchemy.sql.expression import func

api_bp = Blueprint('api', __name__)

# 为聊天API豁免CSRF保护
@csrf.exempt
@api_bp.route('/chat', methods=['POST'])
@login_required
def chat():
    """处理聊天消息"""
    try:
        data = request.get_json()
        
        if not data:
            current_app.logger.error("无效的请求数据: %s", request.data)
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        message = data.get('message', '')
        persona = data.get('persona', 'empathetic')
        
        # 获取对话上下文相关数据
        dialog_turns = data.get('dialogTurns', 0)
        should_recommend_aroma = data.get('shouldRecommendAroma', False)
        user_preferences = data.get('userPreferences', {
            'scents': [],
            'aromatherapy_types': [],
            'concerns': [],
            'preferences_collected': False
        })
        
        current_app.logger.info("收到聊天消息: %s, 人设: %s, 对话轮数: %s", message, persona, dialog_turns)
        
        if not message:
            return jsonify({'success': False, 'message': '消息不能为空'}), 400
        
        # 分析情绪（简单实现，实际应用中应使用NLP）
        emotion, emotion_score = analyze_emotion(message)
        current_app.logger.info("情绪分析结果: %s, 分数: %s", emotion, emotion_score)
        
        # 如果用户已登录，更新用户的香薰偏好
        if current_user.is_authenticated and user_preferences:
            try:
                # 更新用户的香薰偏好
                current_user.aroma_preferences = json.dumps({
                    'scents': user_preferences.get('scents', []),
                    'types': user_preferences.get('aromatherapy_types', []),
                    'concerns': user_preferences.get('concerns', []),
                    'preferences_collected': user_preferences.get('preferences_collected', False)
                })
                db.session.commit()
                current_app.logger.info("更新用户香薰偏好成功")
            except Exception as e:
                db.session.rollback()
                current_app.logger.error("更新用户香薰偏好失败: %s", str(e), exc_info=True)
        
        try:
            # 保存用户消息
            user_message = ChatMessage(
                user_id=current_user.id,
                content=message,
                is_user=True,
                emotion=emotion,
                emotion_score=emotion_score,
                persona=persona
            )
            db.session.add(user_message)
            
            # 记录情绪
            emotion_record = EmotionRecord(
                user_id=current_user.id,
                emotion=emotion,
                score=emotion_score
            )
            db.session.add(emotion_record)
            
            # 提交数据库事务，保存用户消息和情绪记录
            db.session.commit()
            current_app.logger.info("用户消息和情绪记录已保存")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error("保存用户消息失败: %s", str(e), exc_info=True)
            return jsonify({'success': False, 'message': '保存消息失败'}), 500
        
        try:
            # 使用讯飞星火API生成回复
            reply = generate_reply_with_spark(message, emotion, persona, dialog_turns, user_preferences)
            current_app.logger.info("生成回复: %s", reply)
            
            # 保存助手回复
            assistant_message = ChatMessage(
                user_id=current_user.id,
                content=reply,
                is_user=False,
                emotion=emotion,
                emotion_score=emotion_score,
                persona=persona
            )
            db.session.add(assistant_message)
            
            # 提交数据库事务，保存助手回复
            db.session.commit()
            current_app.logger.info("助手回复已保存")
            
            # 获取情绪图标和描述
            emotion_icon = get_emotion_icon(emotion)
            emotion_description = get_emotion_description(emotion)
            
            # 是否推荐香薰产品
            recommendations = []
            if should_recommend_aroma and dialog_turns >= 7:  # 确保至少经过7轮对话
                # 从数据库获取推荐产品
                recommendations = recommend_products(emotion, current_user.id, user_preferences)
            
            return jsonify({
                'success': True,
                'reply': reply,
                'emotion': emotion,
                'emotion_score': emotion_score,
                'emotion_type': emotion,
                'emotion_icon': emotion_icon,
                'emotion_description': emotion_description,
                'recommendations': recommendations,
                'dialogTurns': dialog_turns,
                'shouldRecommendAroma': should_recommend_aroma,
                'userPreferences': user_preferences
            })
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error("保存助手回复失败: %s", str(e), exc_info=True)
            return jsonify({
                'success': False, 
                'message': '保存回复失败',
                'user_message_saved': True  # 表示用户消息已保存
            }), 500
        
    except Exception as e:
        current_app.logger.error("处理聊天消息失败: %s", str(e), exc_info=True)
        return jsonify({'success': False, 'message': '服务器内部错误'}), 500

@api_bp.route('/chat-history', methods=['GET'])
@login_required
def get_chat_history():
    """获取用户的聊天历史"""
    try:
        # 获取当前用户的聊天历史
        messages = ChatMessage.query.filter_by(user_id=current_user.id).order_by(ChatMessage.timestamp).all()
        
        # 转换为JSON格式
        messages_json = []
        for msg in messages:
            messages_json.append({
                'id': msg.id,
                'content': msg.content,
                'is_user': msg.is_user,
                'timestamp': msg.timestamp.isoformat(),
                'emotion': msg.emotion,
                'persona': msg.persona,
            })
            
        # 获取用户偏好数据
        user_preferences = {}
        if current_user.aroma_preferences:
            try:
                user_preferences = json.loads(current_user.aroma_preferences)
            except:
                user_preferences = {
                    'scents': [],
                    'aromatherapy_types': [],
                    'concerns': [],
                    'preferences_collected': False
                }
        
        return jsonify({
            'success': True,
            'messages': messages_json,
            'userPreferences': user_preferences
        })
    except Exception as e:
        current_app.logger.error("获取聊天历史失败: %s", str(e), exc_info=True)
        return jsonify({
            'success': False,
            'message': '获取聊天历史失败'
        }), 500

@api_bp.route('/save-persona', methods=['POST'])
@login_required
def save_persona():
    """保存用户选择的人设"""
    try:
        data = request.json
        persona = data.get('persona')
        
        if not persona:
            return jsonify({
                'success': False,
                'message': '人设参数缺失'
            }), 400
        
        # 检查人设是否有效
        valid_personas = ['empathetic', 'motivational', 'analytical', 'mindful']
        if persona not in valid_personas:
            return jsonify({
                'success': False,
                'message': '无效的人设'
            }), 400
        
        # 更新用户的人设偏好
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
        
        # 更新用户的人设偏好，存储在 emotion_preferences 字段中
        try:
            # 如果存在现有偏好，解析它
            preferences = json.loads(user.emotion_preferences) if user.emotion_preferences else {}
            
            # 确保 preferences 是一个字典
            if not isinstance(preferences, dict):
                preferences = {}
            
            # 添加或更新人设
            preferences['persona'] = persona
            
            # 保存回用户模型
            user.emotion_preferences = json.dumps(preferences)
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': '人设保存成功'
            })
        except Exception as e:
            db.session.rollback()
            current_app.logger.error("保存人设失败: %s", str(e), exc_info=True)
            return jsonify({
                'success': False,
                'message': '保存人设失败'
            }), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("保存人设失败: %s", str(e), exc_info=True)
        return jsonify({
            'success': False,
            'message': '保存人设失败'
        }), 500

@api_bp.route('/get-persona', methods=['GET'])
@login_required
def get_persona():
    """获取用户保存的人设"""
    try:
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
        
        # 获取用户的人设偏好
        persona = None
        # 使用 emotion_preferences 字段存储人设信息
        if user.emotion_preferences:
            try:
                preferences = json.loads(user.emotion_preferences)
                if isinstance(preferences, dict) and 'persona' in preferences:
                    persona = preferences['persona']
            except:
                pass
        
        return jsonify({
            'success': True,
            'persona': persona
        })
    except Exception as e:
        current_app.logger.error("获取人设失败: %s", str(e), exc_info=True)
        return jsonify({
            'success': False,
            'message': '获取人设失败'
        }), 500

@api_bp.route('/products', methods=['GET'])
def products():
    """获取香薰产品列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    emotion = request.args.get('emotion', None)
    random = request.args.get('random', 'false').lower() == 'true'
    personalized = request.args.get('personalized', 'false').lower() == 'true'
    
    query = AromaProduct.query
    
    if emotion:
        # 根据情绪筛选产品
        query = query.join(
            product_emotions
        ).filter(product_emotions.c.emotion == emotion)
    
    if random:
        if personalized and current_user.is_authenticated:
            # 基于用户情绪历史的个性化推荐
            try:
                # 获取用户最近的情绪记录
                recent_emotions = EmotionRecord.query.filter_by(
                    user_id=current_user.id
                ).order_by(EmotionRecord.timestamp.desc()).limit(20).all()
                
                if recent_emotions:
                    # 统计情绪频率
                    emotion_counts = {}
                    for record in recent_emotions:
                        emotion_counts[record.emotion] = emotion_counts.get(record.emotion, 0) + 1
                    
                    # 找出主要情绪
                    dominant_emotions = sorted(
                        [(e, c) for e, c in emotion_counts.items()],
                        key=lambda x: x[1],
                        reverse=True
                    )[:2]  # 取前两个主要情绪
                    
                    # 如果有主要情绪，优先推荐与这些情绪相关的产品
                    if dominant_emotions:
                        # 获取与主要情绪相关的产品ID
                        emotion_names = [e for e, _ in dominant_emotions]
                        related_product_ids = db.session.query(product_emotions.c.product_id).filter(
                            product_emotions.c.emotion.in_(emotion_names)
                        ).distinct().all()
                        related_product_ids = [id[0] for id in related_product_ids]
                        
                        # 如果找到了相关产品，随机选择其中的一部分
                        if related_product_ids:
                            # 确保至少有一半的产品与用户的主要情绪相关
                            related_limit = max(per_page // 2, 1)
                            other_limit = per_page - related_limit
                            
                            # 随机选择与主要情绪相关的产品
                            related_products = AromaProduct.query.filter(
                                AromaProduct.id.in_(related_product_ids)
                            ).order_by(func.random()).limit(related_limit).all()
                            
                            # 随机选择其他产品
                            if other_limit > 0:
                                other_products = AromaProduct.query.filter(
                                    ~AromaProduct.id.in_(related_product_ids)
                                ).order_by(func.random()).limit(other_limit).all()
                            else:
                                other_products = []
                            
                            # 合并产品列表
                            products_list = related_products + other_products
                            
                            return jsonify({
                                'success': True,
                                'products': [product.to_dict() for product in products_list],
                                'total': len(products_list),
                                'pages': 1,
                                'current_page': 1,
                                'personalized': True,
                                'dominant_emotions': [e for e, _ in dominant_emotions]
                            })
            except Exception as e:
                current_app.logger.error(f"个性化推荐出错: {str(e)}")
                # 如果个性化推荐失败，回退到普通随机推荐
        
        # 随机获取产品
        products_list = query.order_by(func.random()).limit(per_page).all()
        
        return jsonify({
            'success': True,
            'products': [product.to_dict() for product in products_list],
            'total': len(products_list),
            'pages': 1,
            'current_page': 1,
            'personalized': False
        })
    else:
        # 分页获取产品
        products_page = query.paginate(page=page, per_page=per_page)
        
        return jsonify({
            'success': True,
            'products': [product.to_dict() for product in products_page.items],
            'total': products_page.total,
            'pages': products_page.pages,
            'current_page': products_page.page,
            'personalized': False
        })

@api_bp.route('/products/<int:product_id>', methods=['GET'])
def product_detail(product_id):
    """获取香薰产品详情"""
    product = AromaProduct.query.get_or_404(product_id)
    
    return jsonify({
        'success': True,
        'product': product.to_dict()
    })

@api_bp.route('/user/profile', methods=['GET'])
@login_required
def get_profile():
    """获取用户个人资料"""
    try:
        # 处理默认头像
        avatar_url = current_user.avatar
        if not avatar_url or avatar_url.startswith('/default_avatar'):
            avatar_url = '/static/img/default_avatar.png'
        
        # 解析用户偏好
        emotions = json.loads(current_user.emotion_preferences) if current_user.emotion_preferences else []
        aromas = json.loads(current_user.aroma_preferences) if current_user.aroma_preferences else []
        
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'avatar': avatar_url,
                'preferences': {
                    'emotions': emotions,
                    'aromas': aromas
                },
                'created_at': current_user.created_at.isoformat(),
                'last_login': current_user.last_login.isoformat() if current_user.last_login else None
            }
        })
    except Exception as e:
        current_app.logger.error(f'获取用户资料异常: {str(e)}')
        return jsonify({'success': False, 'message': f'获取用户资料失败: {str(e)}'}), 500

# 为个人资料更新API豁免CSRF保护
@csrf.exempt
@api_bp.route('/user/profile', methods=['PUT'])
@login_required
def update_profile():
    """更新用户个人资料"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400
        
        current_app.logger.info(f'更新用户资料请求数据: {data}')
        
        # 更新用户名
        username = data.get('username')
        if username and username != current_user.username:
            # 检查用户名是否已存在
            if User.query.filter_by(username=username).first() and User.query.filter_by(username=username).first().id != current_user.id:
                return jsonify({'success': False, 'message': '用户名已存在'}), 400
            current_user.username = username
        
        # 更新情绪偏好
        emotion_preferences = data.get('emotion_preferences')
        if emotion_preferences is not None:
            current_user.emotion_preferences = json.dumps(emotion_preferences)
        
        # 更新香薰偏好
        aroma_preferences = data.get('aroma_preferences')
        if aroma_preferences is not None:
            current_user.aroma_preferences = json.dumps(aroma_preferences)
        
        # 更新密码
        password = data.get('password')
        if password:
            current_user.password = password
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': '个人资料更新成功',
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'avatar': current_user.avatar,
                'preferences': {
                    'emotions': json.loads(current_user.emotion_preferences) if current_user.emotion_preferences else [],
                    'aromas': json.loads(current_user.aroma_preferences) if current_user.aroma_preferences else []
                }
            }
        })
    except Exception as e:
        db.session.rollback()
        error_msg = f'更新用户资料异常: {str(e)}'
        current_app.logger.error(error_msg)
        return jsonify({'success': False, 'message': error_msg}), 500

# 为头像上传API单独豁免CSRF保护
@csrf.exempt
@api_bp.route('/user/avatar', methods=['POST'])
@login_required
def update_avatar():
    """更新用户头像"""
    # 简单的错误处理
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'message': '没有上传文件'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'success': False, 'message': '没有选择文件'}), 400
    
    # 检查文件类型
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'success': False, 'message': '只支持PNG、JPG、JPEG和GIF格式'}), 400
    
    try:
        # 确保上传目录存在
        upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'avatars')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 生成文件名并保存
        filename = f"user_{current_user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file.filename.rsplit('.', 1)[1].lower()}"
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # 更新用户头像
        avatar_url = f"/static/uploads/avatars/{filename}"
        current_user.avatar = avatar_url
        db.session.commit()
        
        # 返回成功响应
        return jsonify({
            'success': True,
            'avatar': avatar_url,
            'message': '头像上传成功'
        })
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"头像上传失败: {str(e)}")
        return jsonify({'success': False, 'message': '头像上传失败，请稍后再试'}), 500

def analyze_emotion(message):
    """分析情绪（简单实现，实际应用中应使用NLP）"""
    # 扩展的情绪关键词匹配
    message = message.lower()
    
    # 情绪类别和关键词映射
    emotion_keywords = {
        '悲伤': ['难过', '伤心', '悲', '哭', '失落', '绝望', '痛苦', '遗憾', '哀伤', '忧郁'],
        '焦虑': ['焦虑', '担心', '紧张', '害怕', '恐惧', '不安', '慌张', '忧虑', '惊慌', '压力'],
        '愤怒': ['生气', '愤怒', '烦', '恼火', '暴躁', '恨', '不满', '怒火', '气愤', '厌烦'],
        '快乐': ['开心', '高兴', '快乐', '喜悦', '兴奋', '愉快', '欣喜', '满足', '幸福', '欢乐'],
        '疲惫': ['疲惫', '累', '困', '倦怠', '精疲力竭', '没精神', '疲乏', '疲劳', '困倦', '乏力'],
        '平静': ['平静', '安宁', '放松', '舒适', '安心', '宁静', '祥和', '镇定', '安详', '平和']
    }
    
    # 情绪强度基准分数
    base_scores = {
        '悲伤': 30,
        '焦虑': 40,
        '愤怒': 35,
        '快乐': 85,
        '疲惫': 45,
        '平静': 60
    }
    
    # 计算每种情绪的匹配度
    emotion_matches = {}
    for emotion, keywords in emotion_keywords.items():
        match_count = sum(1 for keyword in keywords if keyword in message)
        if match_count > 0:
            # 计算情绪强度分数 (基础分数 + 匹配关键词数量的影响)
            emotion_matches[emotion] = base_scores[emotion] + (match_count * 5)
    
    # 如果没有匹配到任何情绪关键词，返回平静
    if not emotion_matches:
        return '平静', base_scores['平静']
    
    # 找出匹配度最高的情绪
    dominant_emotion = max(emotion_matches.items(), key=lambda x: x[1])
    return dominant_emotion[0], dominant_emotion[1]

def generate_reply(message, emotion, persona, dialog_turns=0, user_preferences=None):
    """生成回复（简单实现，实际应用中应使用NLP或LLM）"""
    # 根据对话轮数和人设生成不同的回复
    if dialog_turns < 3:
        # 初始对话阶段，建立初步情感联系
        if persona == 'empathetic':
            if emotion == '悲伤':
                return '我能感受到你的悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。能详细和我分享一下你最近经历了什么吗？'
            elif emotion == '焦虑':
                return '焦虑确实是一种很不舒服的感觉。深呼吸可能会有所帮助。能告诉我你焦虑的具体原因吗？这样我可以更好地理解你的处境。'
            elif emotion == '愤怒':
                return '我理解你感到愤怒。这是一种正常的情绪反应。是什么事情触发了这种情绪？如果你愿意分享，我很乐意倾听。'
            elif emotion == '快乐':
                return '很高兴看到你这么开心！能分享是什么让你如此愉快吗？分享快乐的事情通常能让这种积极情绪持续更长时间。'
            elif emotion == '疲惫':
                return '听起来你感到很疲惫。休息和自我照顾是很重要的。最近是什么让你感到特别疲惫呢？'
            else:
                return '谢谢你的分享。我很理解你的感受，这是很自然的反应。能详细告诉我你最近的生活和情绪变化吗？我希望能更好地了解你的状况。'
        elif persona == 'motivational':
            return '你做得很棒！每一步都是进步，即使是小小的分享也是勇气的表现。我很好奇，你平时如何面对挑战？有什么特别的方法帮助你保持积极？'
        elif persona == 'analytical':
            return '从你的描述来看，这种情况可能与几个因素有关。我们可以从不同角度分析：首先，环境因素可能在影响你的情绪；其次，认知模式也可能起作用。能详细描述一下你的具体情况吗？'
        elif persona == 'mindful':
            return '让我们一起深呼吸，专注于当下这一刻。注意你的感受，但不要评判它们。这些情绪就像天空中的云，它们会来也会去。你能描述一下你当前的感受吗？'
        else:
            return '我理解你的感受。请继续分享你的想法，我在这里倾听和支持你。你愿意多告诉我一些关于你现在的情况吗？'
    elif dialog_turns >= 3 and dialog_turns < 7:
        # 深入交流阶段，专注于情感支持和问题探讨
        if persona == 'empathetic':
            if emotion == '悲伤':
                return '看到你陷入悲伤，我也感到难过。每个人都有经历低谷的时候，这完全没关系。你觉得是什么原因导致你一直无法摆脱这种情绪呢？或许我们可以一起探讨一些应对的方法。'
            elif emotion == '焦虑':
                return '焦虑是一种非常常见的反应，尤其是在面对不确定性时。从你分享的情况来看，这段时间你承受了很多压力。你有尝试过哪些方法来减轻焦虑吗？有时候简单的放松练习就能带来很大的不同。'
            elif emotion == '愤怒':
                return '愤怒往往源于我们内心深处的其他感受，如委屈、不被尊重或无力感。仔细想想，是否有某些核心问题一直困扰着你？识别这些根源有时能帮助我们更好地处理愤怒情绪。'
            elif emotion == '快乐':
                return '你的快乐情绪真的很有感染力！能保持这种积极的心态非常难得。你是如何在面对生活中的挑战时仍然保持乐观的呢？这种能力值得被珍视。'
            elif emotion == '疲惫':
                return '长期的疲惫感可能是身体或心理压力的信号。听上去你最近确实承担了很多。你有为自己留出足够的休息和恢复的时间吗？有时候适当的"自我关怀时刻"是非常必要的。'
            else:
                return '感谢你继续和我分享你的感受。通过我们的对话，我能感受到你是一个非常有韧性的人。面对这些情况，你内心最希望得到什么样的支持或改变呢？'
        elif persona == 'motivational':
            return '你的坚持让我很感动！即使面对困难，你仍然在努力寻找解决方法，这本身就是一种成功。记住，每一个挑战都是成长的机会。你已经迈出了重要的一步，接下来，让我们一起思考如何将这些小进步转化为更大的成功。'
        elif persona == 'analytical':
            return '根据你分享的情况，我注意到几个关键因素可能相互影响。这种复杂的情绪状态通常需要从多角度分析。如果我们把问题分解成几个小部分，或许能更清晰地看到潜在的解决方案。你觉得我们应该先关注哪一方面？'
        elif persona == 'mindful':
            return '在繁忙的生活中，我们常常忽略了当下的感受。尝试暂时放下对过去和未来的思考，完全沉浸在此刻的体验中。你能感受到你的呼吸吗？感受它如何流经你的身体，带来平静和清明。这种简单的觉知练习往往能帮助我们重新获得内心的平衡。'
        else:
            return '听了你的分享，我能感受到你对自己的理解和反思。这种自我觉察是非常珍贵的品质。在接下来的旅程中，无论遇到什么挑战，请记住，每一次经历都是成长的养分，而你内在的力量远比你想象的要强大。'
    else:
        # 多轮对话后，可以开始考虑推荐
        if persona == 'empathetic':
            if emotion == '悲伤':
                return '我们聊了这么多，我真的能体会到你的情绪。在这种悲伤的状态下，有时候适当的外部帮助也很重要。我想提一点小建议，一些带有玫瑰或薰衣草成分的香薰可能对舒缓情绪有帮助。这些天然成分有着安抚心灵的特性。当然，最重要的是你能找到适合自己的方式，慢慢走出这段情绪。'
            elif emotion == '焦虑':
                return '通过我们的交流，我对你的焦虑有了更深的理解。面对这样的情绪，除了我们讨论的心理调适方法外，一些外部辅助也可能有益。薰衣草和洋甘菊的香气以其镇静特性而闻名，可能帮助缓解紧张情绪。无论你选择什么方式，请记住，管理焦虑是一个过程，给自己足够的耐心和关爱。'
            elif emotion == '愤怒':
                return '经过我们这段时间的交流，我更能理解你愤怒背后的原因了。处理这种强烈情绪时，除了我们讨论的方法，有时候一些辅助手段也能起到意外的效果。佛手柑和薄荷等香气有助于清新思绪，可能帮助平复烦躁情绪。当然，找到适合你的方式才是最重要的，无论是通过对话、反思还是其他途径。'
            elif emotion == '快乐':
                return '很高兴看到你一直保持着积极的心态！这种快乐情绪确实很珍贵。为了延续这种美好状态，除了我们聊过的方法，你可能也会对一些能增强愉悦感的香气感兴趣，比如柑橘类的柠檬或橙子。这些充满活力的香气与你现在的积极情绪非常匹配。无论如何，希望你的好心情能持续下去！'
            elif emotion == '疲惫':
                return '通过我们的交流，我能感受到你确实需要好好休息和恢复。除了我们讨论的放松和自我照顾方法，一些提神醒脑的辅助手段可能也有帮助。薄荷和迷迭香的香气以其振奋精神的特性而知名，可能帮助你对抗疲惫感。无论你选择什么方式，记得给自己足够的时间和空间来恢复能量。'
            else:
                return '感谢你一直以来的分享和信任。经过这段时间的交流，我想我们都对你的情况有了更深入的了解。有时候，适当的外部辅助也能带来不同的体验。根据我们的对话内容，一些温和的香薰产品可能适合你现在的状态，无论是帮助放松还是提升情绪。你对这方面有什么特别感兴趣的吗？'
        elif persona == 'motivational':
            return '通过我们这段时间的交流，我真的被你的毅力和进步所感动！为了进一步增强这种积极的状态，我想向你推荐一些能量型的香薰，比如含有柠檬或薄荷成分的产品。这些充满活力的香气可能会给你带来额外的动力，帮助你继续迎接挑战！记住，每一小步的前进都是值得庆祝的成就。'
        elif persona == 'analytical':
            return '基于我们之前的多次分析和讨论，我认为我们已经对情况有了较为清晰的理解。在考虑各种因素的基础上，我想补充一点关于环境影响的思考。某些特定的香薰成分，如薰衣草用于放松，或薄荷用于提神，可能会对整体的情绪状态产生辅助作用。这不是主要的解决方案，但作为环境因素的一部分，值得考虑如何利用它们来优化你的生活空间和情绪体验。'
            return '基于我们之前的多次分析和讨论，我认为我们已经对情况有了较为清晰的理解。在考虑各种因素的基础上，我想补充一点关于环境影响的思考。某些特定的香薰成分，如薰衣草用于放松，或薄荷用于提神，可能会对整体的情绪状态产生辅助作用。这不是主要的解决方案，但作为环境因素的一部分，值得考虑如何利用它们来优化你的生活空间和情绪体验。'
        elif persona == 'mindful':
            return '在我们的多次正念练习和交流中，我注意到你对当下体验的觉知已经有了显著的提升。为了进一步丰富这种体验，你可能会对香熏冥想感兴趣。特定的香气，如檀香或乳香，历来被用于加深冥想体验，帮助锚定意识。当然，这只是一种辅助工具，真正的平静来自于你内在的觉知和接纳。继续保持这种美好的觉察，让每一刻都充满意义。'
        else:
            return '通过我们这段时间的深入交流，我对你的情况和需求有了更全面的理解。在这个阶段，我想向你介绍一些可能有益的香薰产品，作为我们讨论的情感管理方法的补充。不同的香薰成分有着不同的特性，从舒缓情绪的薰衣草到提神醒脑的薄荷，选择适合你当前状态的可能会带来意想不到的帮助。你对这方面有什么特别的喜好或疑问吗？'

def generate_reply_with_spark(message, emotion, persona, dialog_turns=0, user_preferences=None):
    """使用讯飞星火API生成回复"""
    try:
        # 获取SparkAPI客户端
        spark_client = get_spark_client()
        if not spark_client:
            current_app.logger.error("无法获取SparkAPI客户端")
            return generate_reply(message, emotion, persona, dialog_turns, user_preferences)
        
        # 构建消息上下文
        messages = []
        
        # 添加系统提示
        system_prompt = (
            "你是一名资深的心理愈疗师，专注于情感分析和香薰疗法。你的目标是：\n"
            "1. 深入理解用户的情绪状态，不仅是当前对话中表达的，还包括潜在的情绪变化和模式\n"
            "2. 建立用户的情绪档案，记住他们的情绪偏好、触发因素和应对方式\n"
            "3. 提供个性化的香薰产品推荐，解释为什么特定产品适合用户当前的情绪状态\n"
            "4. 通过多轮对话逐渐深入了解用户，建立信任关系\n"
            "5. 主动引导对话，但保持自然和共情\n\n"
        )
        
        # 根据对话轮数调整提示内容
        if dialog_turns < 3:
            system_prompt += (
                "由于这是初始对话阶段（对话轮数0-3轮），你的目标是：\n"
                "1. 通过开放性问题了解用户的情绪状态和基本情况\n"
                "2. 建立初步的信任关系和情感连接\n"
                "3. 表现出充分的同理心，让用户感到被理解和接纳\n"
                "4. 不要询问香薰相关话题或偏好，专注于用户的情感体验\n"
                "5. 鼓励用户分享更多关于当前情绪的具体细节和背景\n"
                "6. 严格禁止在此阶段推荐任何香薰产品\n"
            )
        elif dialog_turns >= 3 and dialog_turns < 7:
            system_prompt += (
                "由于对话已进行3-7轮，这是深入交流阶段，你的目标是：\n"
                "1. 深入探讨用户情绪背后的原因和模式\n"
                "2. 提供有针对性的情感支持和应对策略建议\n"
                "3. 展示对用户个人经历的记忆和理解\n"
                "4. 不要主动提及香薰产品，而是专注于用户的具体情况\n"
                "5. 促进用户的自我觉察和情绪成长\n"
                "6. 严格禁止在此阶段推荐任何香薰产品\n"
            )
        else:
            system_prompt += (
                "由于对话已进行7轮以上，这是推荐整合阶段，你可以：\n"
                "1. 整合前面交流获得的信息，提供个性化的支持\n"
                "2. 基于深入了解的用户情况，适当提供香薰建议\n"
                "3. 解释为什么特定香薰成分可能对用户当前情绪有帮助\n"
                "4. 确保香薰建议是辅助性的，不要喧宾夺主\n"
                "5. 继续表现出高度的同理心和情感支持\n"
            )
            
            # 添加用户偏好信息（如果有）
            if user_preferences and (user_preferences.get('scents') or user_preferences.get('aromatherapy_types')):
                pref_scents = ", ".join(user_preferences.get('scents', [])) or "未知"
                pref_types = ", ".join(user_preferences.get('aromatherapy_types', [])) or "未知"
                system_prompt += f"\n用户偏好信息：\n- 喜欢的香气：{pref_scents}\n- 喜欢的香薰类型：{pref_types}\n"
        
        messages.append({"role": "system", "content": system_prompt})
        
        # 添加情绪信息
        emotion_prompt = f"用户当前情绪: {emotion}"
        messages.append({"role": "system", "content": emotion_prompt})
        
        # 添加对话轮数信息
        turn_prompt = f"当前对话轮数: {dialog_turns}"
        messages.append({"role": "system", "content": turn_prompt})
        
        # 添加最近的对话历史（最多5轮）
        try:
            if current_user and current_user.is_authenticated:
                # 获取最近的10条消息（5轮对话）
                recent_messages = ChatMessage.query.filter_by(
                    user_id=current_user.id
                ).order_by(ChatMessage.timestamp.desc()).limit(10).all()
                
                # 按时间顺序排序（从旧到新）
                recent_messages.reverse()
                
                # 添加到上下文
                for msg in recent_messages:
                    role = "user" if msg.is_user else "assistant"
                    messages.append({"role": role, "content": msg.content})
                
                # 添加情绪历史分析
                emotion_history = EmotionRecord.query.filter_by(
                    user_id=current_user.id
                ).order_by(EmotionRecord.timestamp.desc()).limit(20).all()
                
                if emotion_history and len(emotion_history) >= 5:
                    # 统计情绪频率
                    emotion_counts = {}
                    for record in emotion_history:
                        emotion_counts[record.emotion] = emotion_counts.get(record.emotion, 0) + 1
                    
                    # 找出主要情绪趋势
                    dominant_emotions = sorted(
                        [(e, c) for e, c in emotion_counts.items()],
                        key=lambda x: x[1],
                        reverse=True
                    )[:2]  # 取前两个主要情绪
                    
                    emotion_trend = "用户情绪趋势: " + ", ".join([f"{e}({c}次)" for e, c in dominant_emotions])
                    messages.append({"role": "system", "content": emotion_trend})
        except Exception as e:
            current_app.logger.error(f"添加对话历史时出错: {str(e)}")
        
        # 添加用户消息
        messages.append({"role": "user", "content": message})
        
        # 打印请求消息，用于调试
        current_app.logger.info("发送到讯飞星火API的消息: %s", json.dumps(messages, ensure_ascii=False))
        
        # 设置超时时间（秒）
        timeout = 10
        
        try:
            # 调用SparkAPI生成回复，添加超时处理
            import threading
            import time
            
            result = {"reply": None, "error": None}
            
            def call_api():
                try:
                    result["reply"] = spark_client.chat(messages)
                except Exception as e:
                    result["error"] = str(e)
            
            # 创建线程调用API
            api_thread = threading.Thread(target=call_api)
            api_thread.daemon = True
            api_thread.start()
            
            # 等待线程完成或超时
            start_time = time.time()
            while api_thread.is_alive() and time.time() - start_time < timeout:
                time.sleep(0.1)
            
            # 检查是否超时
            if api_thread.is_alive():
                current_app.logger.warning("讯飞星火API调用超时")
                return generate_reply(message, emotion, persona, dialog_turns, user_preferences)
            
            # 检查是否有错误
            if result["error"]:
                current_app.logger.error("讯飞星火API调用失败: %s", result["error"])
                return generate_reply(message, emotion, persona, dialog_turns, user_preferences)
            
            reply = result["reply"]
            
        except Exception as e:
            current_app.logger.error("调用讯飞星火API过程中发生异常: %s", str(e), exc_info=True)
            return generate_reply(message, emotion, persona, dialog_turns, user_preferences)
        
        # 打印响应，用于调试
        current_app.logger.info("讯飞星火API的响应: %s", reply)
        
        # 如果响应为空或包含默认错误消息，则使用本地回复生成
        if not reply or "抱歉，我暂时无法回答您的问题" in reply:
            current_app.logger.warning("讯飞星火API返回空响应或错误消息，使用本地回复生成")
            return generate_reply(message, emotion, persona, dialog_turns, user_preferences)
        
        # 在对话的前7轮，检测并过滤香薰推荐内容
        if dialog_turns < 7:
            # 检测是否包含香薰推荐关键词
            aromatherapy_keywords = [
                "精油", "香薰", "薰衣草", "香氛", "扩香", "蜡烛", "香气", "成分", 
                "依兰", "甜橙", "迷迭香", "柑橘", "檀香", "茉莉", "木质", "草本",
                "推荐以下", "建议使用", "可以考虑", "可以使用", "可以选择", "香味", "放松效果"
            ]
            
            # 检查回复是否涉及推荐
            contains_aromatherapy = False
            for keyword in aromatherapy_keywords:
                if keyword in reply:
                    contains_aromatherapy = True
                    current_app.logger.warning(f"API回复在早期对话阶段({dialog_turns}轮)包含香薰关键词: {keyword}")
                    break
            
            # 如果包含推荐关键词，使用本地生成的回复替代
            if contains_aromatherapy:
                current_app.logger.info("API回复在早期阶段包含香薰内容，使用本地回复替代")
                return generate_reply(message, emotion, persona, dialog_turns, user_preferences)
        
        return reply
    except Exception as e:
        current_app.logger.error("调用讯飞星火API失败: %s", str(e), exc_info=True)
        # 如果API调用失败，回退到原始的回复生成方法
        return generate_reply(message, emotion, persona, dialog_turns, user_preferences)

def recommend_products(emotion, user_id=None, user_preferences=None):
    """
    根据情绪、用户ID和用户偏好推荐香薰产品
    
    Args:
        emotion: 情绪关键词
        user_id: 用户ID，用于个性化推荐
        user_preferences: 用户偏好数据
        
    Returns:
        list: 推荐产品列表
    """
    try:
        # 从数据库获取推荐产品
        products_from_db = recommend_products_for_emotion(emotion, limit=3)
        
        # 确保所有推荐都来自数据库
        if not products_from_db or len(products_from_db) == 0:
            # 如果没有根据情绪找到匹配的产品，尝试随机获取
            products_query = AromaProduct.query.order_by(func.random()).limit(3)
            products_from_db = [product.to_dict() for product in products_query.all()]
            
            # 添加推荐理由
            for product in products_from_db:
                product['recommendation_reason'] = f"这款{product['name']}可能适合你尝试。虽然它可能不是专门针对你当前的情绪设计的，但它的香气可能会给你带来新的体验。"
        
        # 如果有用户偏好，进一步调整推荐结果
        if user_preferences and user_id:
            try:
                # 调整推荐顺序，优先推荐符合用户偏好的产品
                preferred_scents = user_preferences.get('scents', [])
                preferred_types = user_preferences.get('aromatherapy_types', [])
                
                if preferred_scents or preferred_types:
                    # 对产品进行评分（简单实现）
                    scored_products = []
                    for product in products_from_db:
                        score = 0
                        product_name = product['name'].lower()
                        
                        # 根据产品名称简单匹配偏好（实际应用中应有更复杂的匹配逻辑）
                        for scent in preferred_scents:
                            if scent.lower() in product_name:
                                score += 1
                                
                        for type_name in preferred_types:
                            if type_name.lower() in product_name:
                                score += 1
                                
                        scored_products.append((product, score))
                    
                    # 根据分数排序
                    scored_products.sort(key=lambda x: x[1], reverse=True)
                    
                    # 返回排序后的产品列表
                    return [p[0] for p in scored_products]
            except Exception as e:
                current_app.logger.error(f"应用用户偏好时出错: {str(e)}")
        
        return products_from_db
    
    except Exception as e:
        current_app.logger.error(f"推荐产品时出错: {str(e)}")
        # 不再返回默认推荐，而是查询数据库获取一些产品
        try:
            fallback_products = AromaProduct.query.limit(3).all()
            return [product.to_dict() for product in fallback_products]
        except:
            # 如果数据库查询也失败，返回空列表
            return []

# 获取情绪类型
def get_emotion_type(emotion):
    emotion_types = {
        '快乐': 'happy',
        '悲伤': 'sad',
        '愤怒': 'angry',
        '焦虑': 'anxious',
        '疲惫': 'tired',
        '平静': 'neutral'
    }
    return emotion_types.get(emotion, 'neutral')

# 获取情绪图标
def get_emotion_icon(emotion):
    emotion_icons = {
        '快乐': 'fa-grin-beam',
        '悲伤': 'fa-sad-tear',
        '愤怒': 'fa-angry',
        '焦虑': 'fa-frown',
        '疲惫': 'fa-tired',
        '平静': 'fa-smile'
    }
    return emotion_icons.get(emotion, 'fa-smile')

# 获取情绪描述
def get_emotion_description(emotion):
    emotion_descriptions = {
        '快乐': '您似乎心情不错！享受这美好的时刻，并记住这种感觉。',
        '悲伤': '您似乎感到有些悲伤。请记住，这些感受是暂时的，允许自己感受它们是很重要的。',
        '愤怒': '您似乎感到有些愤怒。这是一种正常的情绪，尝试找到健康的方式来表达它。',
        '焦虑': '您似乎感到有些焦虑。深呼吸可能会有所帮助，尝试放松您的身心。',
        '疲惫': '您似乎感到有些疲惫。适当的休息对身心健康都很重要。',
        '平静': '您当前的情绪状态看起来很平静'
    }
    return emotion_descriptions.get(emotion, '您当前的情绪状态看起来很平静')

@api_bp.route('/recommend_products', methods=['POST'])
@csrf.exempt
def api_recommend_products():
    """根据情绪推荐香薰产品"""
    if not request.is_json:
        return jsonify({"success": False, "message": "请求必须是JSON格式"}), 400
    
    data = request.json
    emotion = data.get('emotion')
    limit = data.get('limit', 3)
    
    if not emotion:
        return jsonify({"success": False, "message": "必须提供情绪参数"}), 400
    
    try:
        # 调用推荐函数
        products = recommend_products_for_emotion(emotion, limit)
        
        return jsonify({
            "success": True,
            "emotion": emotion,
            "products": products
        })
    
    except Exception as e:
        current_app.logger.error(f"推荐产品时出错: {str(e)}")
        return jsonify({
            "success": False,
            "message": "推荐产品时出错",
            "error": str(e)
        }), 500

@api_bp.route('/product_details/<product_id>', methods=['GET'])
@csrf.exempt
def api_product_details(product_id):
    """获取产品详细信息"""
    try:
        # 调用获取产品详情函数
        product = get_product_details(product_id)
        
        if not product:
            return jsonify({
                "success": False,
                "message": f"未找到ID为 {product_id} 的产品"
            }), 404
        
        return jsonify({
            "success": True,
            "product": product
        })
    
    except Exception as e:
        current_app.logger.error(f"获取产品详情时出错: {str(e)}")
        return jsonify({
            "success": False,
            "message": "获取产品详情时出错",
            "error": str(e)
        }), 500 