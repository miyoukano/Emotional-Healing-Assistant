import logging
import random
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.sql import func
from app import db
from app.models import AromaProduct, product_emotions

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AromatherapyRecommender:
    """香薰产品推荐器，基于用户情绪状态推荐合适的香薰产品"""
    
    # 情绪映射表，将用户输入的情绪映射到标准情绪关键词
    EMOTION_MAPPINGS = {
        # 悲伤相关
        '悲伤': ['悲伤', '伤心', '难过', '忧郁', '沮丧'],
        '伤心': ['悲伤', '伤心', '难过', '忧郁', '沮丧'],
        '难过': ['悲伤', '伤心', '难过', '忧郁', '沮丧'],
        '忧郁': ['悲伤', '伤心', '难过', '忧郁', '沮丧'],
        '沮丧': ['悲伤', '伤心', '难过', '忧郁', '沮丧'],
        
        # 焦虑相关
        '焦虑': ['焦虑', '紧张', '不安'],
        '紧张': ['焦虑', '紧张', '不安'],
        '不安': ['焦虑', '紧张', '不安'],
        
        # 愤怒相关
        '愤怒': ['愤怒', '生气', '恼火'],
        '生气': ['愤怒', '生气', '恼火'],
        '恼火': ['愤怒', '生气', '恼火'],
        
        # 疲惫相关
        '疲惫': ['疲惫', '疲劳', '乏力'],
        '疲劳': ['疲惫', '疲劳', '乏力'],
        '乏力': ['疲惫', '疲劳', '乏力'],
        
        # 快乐相关
        '快乐': ['快乐', '开心', '愉悦', '高兴'],
        '开心': ['快乐', '开心', '愉悦', '高兴'],
        '愉悦': ['快乐', '开心', '愉悦', '高兴'],
        '高兴': ['快乐', '开心', '愉悦', '高兴'],
        
        # 平静相关
        '平静': ['平静', '安宁', '放松'],
        '安宁': ['平静', '安宁', '放松'],
        '放松': ['平静', '安宁', '放松'],
    }
    
    # 情绪到产品类型的偏好映射
    EMOTION_TO_PRODUCT_TYPE = {
        '悲伤': ['精油', '香薰蜡烛'],
        '焦虑': ['精油', '香薰蜡烛', '扩香器'],
        '愤怒': ['精油', '香薰棒'],
        '疲惫': ['精油', '扩香器'],
        '快乐': ['扩香器', '香薰蜡烛'],
        '平静': ['香薰蜡烛', '香薰棒', '精油']
    }
    
    # 情绪到香味偏好的映射
    EMOTION_TO_SCENT = {
        '悲伤': ['花香', '木质'],
        '焦虑': ['花香', '草本'],
        '愤怒': ['柑橘', '草本'],
        '疲惫': ['柑橘', '薄荷'],
        '快乐': ['柑橘', '花香'],
        '平静': ['木质', '花香']
    }
    
    def __init__(self):
        """初始化推荐器"""
        logger.info("初始化香薰产品推荐器")
    
    def map_emotion_to_keywords(self, emotion: str) -> List[str]:
        """
        将用户输入的情绪映射到标准情绪关键词
        
        Args:
            emotion: 用户输入的情绪关键词
            
        Returns:
            List[str]: 映射后的情绪关键词列表
        """
        # 如果情绪在映射表中，返回映射的关键词
        if emotion in self.EMOTION_MAPPINGS:
            return self.EMOTION_MAPPINGS[emotion]
        
        # 否则尝试在映射表的值中查找匹配
        for key, values in self.EMOTION_MAPPINGS.items():
            if emotion in values:
                return values
        
        # 如果没有找到匹配，返回默认情绪"平静"的关键词
        logger.warning(f"未找到情绪 '{emotion}' 的映射，使用默认情绪'平静'")
        return self.EMOTION_MAPPINGS['平静']
    
    def recommend_for_emotion(self, emotion: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        根据情绪推荐香薰产品
        
        Args:
            emotion: 情绪关键词
            limit: 返回结果数量限制
            
        Returns:
            List[Dict[str, Any]]: 推荐产品列表
        """
        logger.info(f"为情绪 '{emotion}' 推荐产品")
        
        # 映射情绪关键词
        emotion_keywords = self.map_emotion_to_keywords(emotion)
        logger.info(f"情绪 '{emotion}' 映射到: {emotion_keywords}")
        
        # 尝试直接匹配情绪
        products = []
        
        try:
            # 查询与情绪关键词匹配的产品
            for keyword in emotion_keywords:
                query = db.session.query(AromaProduct).join(
                    product_emotions
                ).filter(
                    product_emotions.c.emotion == keyword
                ).order_by(
                    func.random()
                ).limit(limit)
                
                matched_products = query.all()
                
                if matched_products:
                    logger.info(f"找到 {len(matched_products)} 个与情绪 '{keyword}' 匹配的产品")
                    products.extend(matched_products)
                    
                    # 如果已经找到足够的产品，跳出循环
                    if len(products) >= limit:
                        break
            
            # 如果没有找到足够的产品，尝试根据产品类型和香味偏好推荐
            if len(products) < limit:
                logger.info(f"直接情绪匹配找到的产品不足 {limit} 个，尝试使用产品类型和香味偏好")
                
                # 获取主要情绪类别
                main_emotion = emotion_keywords[0] if emotion_keywords else '平静'
                
                # 获取该情绪偏好的产品类型和香味
                preferred_types = self.EMOTION_TO_PRODUCT_TYPE.get(main_emotion, ['精油', '香薰蜡烛'])
                preferred_scents = self.EMOTION_TO_SCENT.get(main_emotion, ['花香', '木质'])
                
                # 随机选择一个偏好的产品类型和香味
                random_type = random.choice(preferred_types)
                
                # 查询符合条件的产品
                additional_products = AromaProduct.query.filter(
                    ~AromaProduct.id.in_([p.id for p in products])  # 排除已推荐的产品
                ).order_by(func.random()).limit(limit - len(products)).all()
                
                if additional_products:
                    logger.info(f"找到 {len(additional_products)} 个额外的产品")
                    products.extend(additional_products)
            
            # 如果仍然没有找到足够的产品，随机推荐
            if len(products) < limit:
                logger.info("产品数量仍然不足，随机推荐产品")
                
                random_products = AromaProduct.query.filter(
                    ~AromaProduct.id.in_([p.id for p in products])  # 排除已推荐的产品
                ).order_by(func.random()).limit(limit - len(products)).all()
                
                if random_products:
                    logger.info(f"随机找到 {len(random_products)} 个产品")
                    products.extend(random_products)
            
            # 限制结果数量
            products = products[:limit]
            
            # 转换为字典格式并添加推荐理由
            result = []
            for product in products:
                product_dict = product.to_dict()
                product_dict['recommendation_reason'] = self._generate_recommendation_reason(
                    product, emotion
                )
                result.append(product_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"推荐产品时出错: {str(e)}", exc_info=True)
            return []
    
    def _generate_recommendation_reason(self, product: AromaProduct, emotion: str) -> str:
        """
        生成产品推荐理由
        
        Args:
            product: 产品对象
            emotion: 情绪关键词
            
        Returns:
            str: 推荐理由
        """
        # 情绪到推荐理由模板的映射
        emotion_templates = {
            '悲伤': [
                f"这款{product.name}能够帮助缓解悲伤情绪，带来温暖和安慰。",
                f"{product.name}的香气有助于提升情绪，减轻悲伤感。"
            ],
            '焦虑': [
                f"{product.name}的香气有助于缓解焦虑，带来平静感。",
                f"使用这款{product.name}可以帮助您放松身心，减轻焦虑感。"
            ],
            '愤怒': [
                f"{product.name}的香气有助于平复情绪，缓解愤怒感。",
                f"这款{product.name}能够帮助您找回内心的平静，减轻烦躁情绪。"
            ],
            '疲惫': [
                f"{product.name}的提神效果可以帮助缓解疲劳，恢复活力。",
                f"使用这款{product.name}能够振奋精神，减轻疲惫感。"
            ],
            '快乐': [
                f"{product.name}的香气可以进一步提升您的愉悦感，让好心情持续更久。",
                f"这款{product.name}能够增强积极情绪，让您的快乐更加持久。"
            ],
            '平静': [
                f"{product.name}的香气有助于维持内心的平静，带来宁静感。",
                f"使用这款{product.name}可以帮助您保持放松状态，享受宁静时刻。"
            ]
        }
        
        # 获取主要情绪类别
        main_emotion = self.map_emotion_to_keywords(emotion)[0] if emotion else '平静'
        
        # 获取该情绪的推荐理由模板
        templates = emotion_templates.get(main_emotion, emotion_templates['平静'])
        
        # 随机选择一个模板
        return random.choice(templates)
    
    def get_product_details(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        获取产品详细信息
        
        Args:
            product_id: 产品ID
            
        Returns:
            Optional[Dict[str, Any]]: 产品详细信息，如果未找到则返回None
        """
        try:
            # 查询产品
            product = AromaProduct.query.get(product_id)
            
            if not product:
                logger.warning(f"未找到ID为 {product_id} 的产品")
                return None
            
            # 转换为字典格式
            return product.to_dict()
            
        except Exception as e:
            logger.error(f"获取产品详情时出错: {str(e)}", exc_info=True)
            return None

# 创建推荐器实例
recommender = AromatherapyRecommender()

def recommend_products_for_emotion(emotion: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    根据情绪推荐香薰产品的便捷函数
    
    Args:
        emotion: 情绪关键词
        limit: 返回结果数量限制
        
    Returns:
        List[Dict[str, Any]]: 推荐产品列表
    """
    return recommender.recommend_for_emotion(emotion, limit)

def get_product_details(product_id: str) -> Optional[Dict[str, Any]]:
    """
    获取产品详细信息的便捷函数
    
    Args:
        product_id: 产品ID
        
    Returns:
        Optional[Dict[str, Any]]: 产品详细信息，如果未找到则返回None
    """
    return recommender.get_product_details(product_id) 