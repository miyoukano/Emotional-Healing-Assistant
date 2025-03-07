from app import create_app, db
from app.models import User, AromaProduct, product_emotions
import json

app = create_app()

def init_db():
    with app.app_context():
        # 创建所有表
        db.create_all()
        
        # 检查是否已有用户
        if User.query.first() is None:
            # 创建管理员用户
            admin = User(
                username='admin',
                email='admin@example.com',
                password='admin123',
                is_confirmed=True
            )
            db.session.add(admin)
            
            # 创建测试用户
            test_user = User(
                username='test',
                email='test@example.com',
                password='test123',
                is_confirmed=True,
                emotion_preferences=json.dumps(['焦虑', '失眠']),
                aroma_preferences=json.dumps(['薰衣草', '茉莉花'])
            )
            db.session.add(test_user)
        
        # 检查是否已有香薰产品
        if AromaProduct.query.first() is None:
            # 创建香薰产品
            products = [
                {
                    'name': '薰衣草精油',
                    'description': '舒缓放松，帮助睡眠，缓解焦虑',
                    'full_description': '薰衣草精油以其舒缓特性而闻名，能有效缓解焦虑和压力。它的香气有助于改善睡眠质量，减轻紧张情绪。在情绪低落时，薰衣草的温和香气能带来平静与安宁。',
                    'image_url': 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                    'price': 68.0,
                    'emotions': ['焦虑', '压力', '失眠']
                },
                {
                    'name': '柠檬香薰蜡烛',
                    'description': '提振精神，增强专注力，改善情绪',
                    'full_description': '柠檬香薰蜡烛散发出清新的柑橘香气，能有效提振精神和改善情绪。它的香气有助于增强专注力，适合在工作或学习时使用。柠檬的香气也被认为能促进积极思考，驱散消极情绪。',
                    'image_url': 'https://images.unsplash.com/photo-1602178506153-472ef4810278?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                    'price': 45.0,
                    'emotions': ['疲惫', '注意力不集中', '情绪低落']
                },
                {
                    'name': '茉莉花精油扩香器',
                    'description': '平衡情绪，缓解抑郁，增强自信',
                    'full_description': '茉莉花精油以其甜美而浓郁的香气著称，能有效平衡情绪，缓解抑郁症状。它的香气被认为能增强自信，提升积极情绪。茉莉花精油扩香器可以持续释放香气，为空间营造温馨舒适的氛围。',
                    'image_url': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                    'price': 88.0,
                    'emotions': ['抑郁', '自卑', '情绪波动']
                },
                {
                    'name': '薄荷精油',
                    'description': '清新提神，缓解头痛，舒缓肌肉疲劳',
                    'full_description': '薄荷精油具有强烈的清新香气，能迅速提神醒脑，缓解头痛和肌肉疲劳。它的凉爽感觉有助于在炎热天气中保持清爽，同时也能帮助缓解呼吸不畅。薄荷的刺激性香气能够迅速唤醒感官，提高警觉性。',
                    'image_url': 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                    'price': 56.0,
                    'emotions': ['疲惫', '头痛', '注意力不集中']
                },
                {
                    'name': '玫瑰精油',
                    'description': '舒缓情绪，增强幸福感，改善皮肤',
                    'full_description': '玫瑰精油被誉为"精油之后"，其芬芳的香气能够舒缓情绪，增强幸福感和自信心。玫瑰精油也被广泛用于护肤，有助于改善皮肤弹性，减少细纹。它的温暖香气能创造浪漫氛围，提升积极情绪。',
                    'image_url': 'https://images.unsplash.com/photo-1518982380512-5a3c6a7c6a7a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                    'price': 120.0,
                    'emotions': ['悲伤', '自卑', '情绪低落']
                }
            ]
            
            for product_data in products:
                emotions = product_data.pop('emotions')
                product = AromaProduct(**product_data)
                db.session.add(product)
                db.session.flush()  # 获取产品ID
                
                # 添加产品与情绪的关联
                for emotion in emotions:
                    stmt = product_emotions.insert().values(
                        product_id=product.id,
                        emotion=emotion
                    )
                    db.session.execute(stmt)
        
        db.session.commit()
        print("数据库初始化完成！")

if __name__ == '__main__':
    init_db() 