from app import db

# 产品和情绪的多对多关系表
product_emotions = db.Table('product_emotions',
    db.Column('product_id', db.Integer, db.ForeignKey('aroma_products.id'), primary_key=True),
    db.Column('emotion', db.String(20), primary_key=True)
)

class AromaProduct(db.Model):
    __tablename__ = 'aroma_products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, index=True)
    description = db.Column(db.Text)
    full_description = db.Column(db.Text)
    image_url = db.Column(db.String(200))
    price = db.Column(db.Float)
    stock = db.Column(db.Integer, default=100)
    rating = db.Column(db.Float, default=5.0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
    def __repr__(self):
        return f'<AromaProduct {self.name}>'
    
    def to_dict(self):
        """将产品转换为字典，方便JSON序列化"""
        emotions = db.session.query(product_emotions.c.emotion).filter(
            product_emotions.c.product_id == self.id
        ).all()
        
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'full_description': self.full_description,
            'image': self.image_url,
            'price': self.price,
            'stock': self.stock,
            'rating': self.rating,
            'emotions': [e[0] for e in emotions]
        } 