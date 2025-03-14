
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `emotional_assistant` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `emotional_assistant`;
DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
INSERT INTO `alembic_version` VALUES ('bb14712526ed');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `aroma_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aroma_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` text,
  `full_description` text,
  `image_url` varchar(200) DEFAULT NULL,
  `price` float DEFAULT NULL,
  `stock` int DEFAULT NULL,
  `rating` float DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_aroma_products_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `aroma_products` WRITE;
/*!40000 ALTER TABLE `aroma_products` DISABLE KEYS */;
INSERT INTO `aroma_products` VALUES (6,'柑橘香氛蜡烛','精心调配的香氛，能够帮助您放松身心，缓解压力。','精心调配的香氛，能够帮助您放松身心，缓解压力。\n\n主要香调: 柑橘香\n\n成分: 植物蜡、香精、棉芯\n\n持续时间: 长效(6小时以上)\n\n对于提神情绪: 柑橘香有助于提神醒脑 适用场景: 工作中、学习时','https://www.diptyque-cn.com/media/catalog/product/d/i/diptyque-oyedo-candle-190g-oy1-1_1.jpg',120,100,5,'2025-03-11 19:35:51','2025-03-11 19:35:51'),(7,'琥珀香氛蜡烛','精致的香气能够提升您的心情，为您的家居空间增添一丝温馨。','精致的香气能够提升您的心情，为您的家居空间增添一丝温馨。\n\n主要香调: 柑橘香\n\n成分: 植物蜡、香精、棉芯\n\n持续时间: 中效(3-5小时)\n\n对于放松情绪: 木质香有助于放松身心 适用场景: 压力大时、工作后\n\n对于提神情绪: 柑橘香有助于提神醒脑 适用场景: 工作中、学习时','https://www.diptyque-cn.com/media/catalog/product/1/1/111111_1.png',120,100,5,'2025-03-11 19:35:51','2025-03-11 19:35:51'),(8,'橙花香氛蜡烛','精心调配的香氛，能够帮助您放松身心，缓解压力。','精心调配的香氛，能够帮助您放松身心，缓解压力。\n\n主要香调: 东方香\n\n成分: 植物蜡、香精、棉芯\n\n持续时间: 中效(3-5小时)\n\n对于愉悦情绪: 花香有助于提升愉悦感 适用场景: 日常使用，心情低落时','https://www.diptyque-cn.com/media/catalog/product/d/i/diptyque-choisya-orange-blossom-candle-190g-cy1-1.jpg',120,100,5,'2025-03-11 19:35:51','2025-03-11 19:35:51'),(9,'无花果香氛蜡烛','淡雅的香气能够提神醒脑，帮助您保持专注和清醒。','淡雅的香气能够提神醒脑，帮助您保持专注和清醒。\n\n主要香调: 木质香\n\n成分: 植物蜡、香精、棉芯\n\n持续时间: 中效(3-5小时)\n\n对于放松情绪: 木质香有助于放松身心 适用场景: 压力大时、工作后\n\n对于温暖情绪: 果香有助于营造温暖氛围 适用场景: 寒冷天气、需要温馨氛围时','https://www.diptyque-cn.com/media/catalog/product/d/i/diptyque-figuier-fig-tree-candle-190g-fi1-1.jpg',120,100,5,'2025-03-11 19:35:51','2025-03-11 19:35:51'),(10,'薰衣草\r\n\r\n香氛蜡烛','独特的香调组合，让您的居室充满活力与温暖。','独特的香调组合，让您的居室充满活力与温暖。\n\n主要香调: 木质香\n\n成分: 植物蜡、香精、棉芯\n\n持续时间: 中效(3-5小时)\n\n对于放松情绪: 木质香有助于放松身心 适用场景: 压力大时、工作后\n\n对于安抚情绪: 薰衣草香有助于安抚情绪 适用场景: 焦虑时、睡前','https://www.diptyque-cn.com/media/catalog/product/3/3/33333_8.png',120,100,5,'2025-03-11 19:35:51','2025-03-11 19:35:51'),(11,'茉莉与金盏花香氛蜡烛','100%纯天然茉莉花精油，采用蒸馏提取工艺，保留了茉莉花的天然芳香成分。具有舒缓情绪、提升愉悦感的功效。','100%纯天然茉莉花精油，采用蒸馏提取工艺，保留了茉莉花的天然芳香成分。具有舒缓情绪、提升愉悦感的功效。\n\n主要香调: 花香\n\n成分: 茉莉花\n\n持续时间: 中效(3-5小时)\n\n对于抑郁情绪: 茉莉花精油中的芳香成分能够帮助缓解抑郁情绪，带来愉悦感 适用场景: 情绪低落时、压力大时\n\n对于焦虑情绪: 茉莉花精油有助于缓解焦虑情绪，带来平静感 适用场景: 压力大时、紧张时','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LF9501_1000x1000_0.png',80,100,5,'2025-03-11 19:35:51','2025-03-11 19:35:51'),(17,'柚子香氛蜡烛','闪耀清新的香调拉开香氛的序幕，弥散出微苦却极具辨识度的清爽气息。, 与清爽的薰衣草、樟脑与薄荷融合为香氛打造剔透芬芳。, 翠绿的青苔以泥土气息与木本温暖为香氛烘托收尾。','来自西班牙海岸的西柚树林。迷迭香、薄荷与甘椒为 西柚的明亮灿烂增添完美俏皮， 令人精神振奋，神清气爽。','https://www.jomalone.com/media/export/cms/products/1000x1000/jo_sku_L03E01_1000x1000_0.png',241.34,100,4.37289,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(18,'杏桃花与蜂蜜香氛蜡烛','多汁而成熟，为香氛增添些许爽脆之感。, 可口的蜜香为氤氲香气注入蜜蜡与鲜花的丝滑甜美。, 甘醇多汁的香气中弥散出缜密柔软的芬芳。','伦敦科文特花园的早市上，饱满的杏、诱人的桃、 多汁的黑醋栗，交织着春花的香气，融化在刺槐蜜的温暖 之中。甜蜜愉悦，趣意盎然。','https://www.jomalone.com/media/export/cms/products/1000x1000/jo_sku_L0YF01_1000x1000_0.png',213.432,100,4.59775,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(19,'青柠罗勒与柑橘香氛蜡烛','明媚而微酸的柑橘搭配清爽的青柠，营造动感、清新的前调。, 罗勒的温暖草本气息，夹着一丝胡椒的辛香，为活力的柑橘调带来惊喜转折。, 温暖的木质香调，为香氛增加一丝深度，气场十足，令人心生爱慕。','祖·玛珑的经典香氛。罗勒的辛香与芳香四溢的白色百里香为青柠增添奇妙的变调，宛如加勒比海的微风，堪称现代经典。','https://www.jomalone.com/media/export/cms/products/1000x1000/jo_sku_L0W201_1000x1000_0.png',429.09,100,4.28209,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(22,'末药与冬加豆馥郁香氛蜡烛','与樟树油、蜂蜜与干草的清爽气息相互交织，孕育出令人倾心的芬芳, 中调的末药树脂是感性和醇厚的。, 而循循诱人的冬加豆，带来精致又温润之感。','大漠孤烟，长河落日 牧歌悠扬的纳米比亚沙漠广袤无垠 传承数世纪古法采撷的末药树树脂芳香神秘 香草与愈创木的木质气息交织着杏仁的温暖耳语 冬加豆与愈创木更添令人上瘾的悠长醇香 高贵感性，神醉心往','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LJ3101_1000x1000_0.png',279.445,100,4.08745,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(23,'丝绒玫瑰与乌木香氛蜡烛','佛手柑的清新气息使前调明媚而又澄澈, 雪松木温暖的木质香调，则使香味更加深沉迷人, 神秘而又富有质感的沉香木树脂香气，使香氛神秘而魅力十足','珍贵沉香，全新演绎。备受尊崇的木香在烟熏气息中透出神秘之感，这亦是中东传统香氛的核心所在，利落而澄澈的佛手柑香气于其间萦绕。微醺、诱人。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LJ2Y01_1000x1000_0.png',349.617,100,4.21293,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(24,'晚香玉与天使草香水','天使草略带辛辣而富有层次的草本气息，使前调充满精致华贵质感。, 奢华馥郁的晚香玉带来无与伦比的华贵质感，芳香撩人，不失典雅，令人着迷。, 温暖的木质香调，为香氛增加一丝深度，气场十足，令人心生爱慕。','白花女王晚香玉，诱惑天成。 由天使草的绿意辛香清新开启， 温暖醇厚的琥珀木更显深度。 雍容华贵却又气场十足。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LGX401_1000x1000_0.png',492.57,100,4.83763,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(25,'丝绒玫瑰与乌木古龙水','前调满溢出丁香的辛香温暖，一缕入魂摄魄。, 采撷晨曦之中的大马士革玫瑰，花香馥郁饱满，引人沉沦, 深沉慵懒的沉香木气息，辅以果仁糖的甜蜜，尽显颓靡之美','浓墨重彩的大马士革玫瑰。馥郁而颇具质感，在沉香木的烟熏香气中层层铺展。极致的丁香芬芳过后，果仁糖的香气令人难以自拔。磁石般的吸引。','https://www.jomalone.com/media/export/cms/products/1000x1000/jo_sku_LGX501_1000x1000_0.png',263.021,100,4.88619,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(26,'黑琥珀与姜百合香氛蜡烛','温暖芳香的烟熏香调，在姜的清新味道下，散发出性感诱人的气息。, 稀有的黑色兰花拥有深沉馥郁的质地，丰盈的睡莲和茉莉更令回味悠长。, 稀有的枷罗木焚香混合黑琥珀的温暖，令香氛增添与众不同的不凡的气息。','珍稀伽罗木。日本鉴香艺术的巅峰——香道仪式的核心。洋溢着琥珀与黑兰的芬芳。棕豆蔻、姜与睡莲的纯净气息萦绕弥散。舒缓身心。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LJ3201_1000x1000_0.png',317.663,100,4.08521,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(27,'香根草与香子兰香水','辛香中透着淡淡的柠檬清凉，就像一束光芒点亮中调温暖的花香。, 香根草尽释神秘的土壤气息使香味深沉馥郁，沁人心脾, 温暖感性的香子兰烘托收尾为香氛带来萦绕不散的暖意','深沉静谧的香根草邂逅明媚温暖的香子兰 创新呈现令人沉溺的东方木质香调 宛若春临大地，万物复苏','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LH3301_1000x1000_0.png',306.97,100,4.08614,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(28,'绯红虞美人香水','其质茧状、粉状效果在前调中很少见，并且与香味中的其他香调很好地协调。, 性感的花香调和大胆的花朵，为香味的中心带来丰富的强度。, 零陵香豆以杏仁、香草和烟草的味道为香味带来温暖，增添了更多的气息。','东方虞美人自顾怒放 颠覆传统美食调 轻触肌肤后 浓烈馥香相拥苏醒 层叠碰撞 裹挟鸢尾烟雾与粗砺木质 穿透猩红迷雾 才能目睹魅惑真容','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LHG101_1000x1000_0.png',401.615,100,4.78681,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(29,'英国梨与小苍兰香氛蜡烛','略带水汽的清透果香清甜不腻, 斑斓甜意隐隐而出与花香绵延升空, 似灿金色日光下的果园柔和而欢欣','金灿日光下，初熟英国梨邂逅灵动香豌豆 梨与花的奇妙组合，蔓延无限生机 当阵阵轻盈香气在菱格纹瓶中涌动扩散 凌凌波光随着香气，不断变幻折射万千英伦奇想与浪漫新生','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L2A601_1000x1000_0.png',243.865,100,4.30533,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(30,'英国梨与小苍兰香水','非同寻常的创新成分，芳醇的果香无比清新，多汁之感令香型倍显饱满。, 纯正英伦格调，清爽的白色小苍兰为中调注入细腻而独特的芬芳。, 感性而深沉的木香令整体香氛历久弥新。','秋日精髓。初熟秋梨的感性清爽包围在 白色苍兰花束中，又因琥珀、广藿香和 木香而愈加芳醇，甜美金灿。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L26L01_1000x1000_0.png',276.898,100,4.23592,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(31,'无垢木与雪松香水','青苔芳香糅合肉桂香如初入林中,在青苔上留下一串湿漉漉的脚印, 桧木在丁香和英国薰衣草的衬托下,木香愈显,散发出原生的纯净气息, 雪松摇曳,捎来广藿香与冬加豆的气息,自然对生命力的包容滋养纷呈眼前','寻至日本青森之地，汲取日式森林浴的净化灵感 洗练出最原生无雕饰的纯质森林气息 让囿于都市的灵魂随时从纷扰中转身 心愈一场林间的净化徒步','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LKMJ01_1000x1000_0.png',401.458,100,4.26009,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(32,'伯爵茶与小黄瓜香水','佛手柑的清新气息使前调明媚而又澄澈, 清凉、碧绿、略带脆嫩之感的香调洋溢着清新而多汁的气息。, 深厚、馥郁，蜂蜜的香甜与淡淡的烟草味赋予香氛优雅甜蜜。','英伦传统的下午茶。香氛散发着伯爵茶独有的佛手柑 香气与多汁脆嫩的黄瓜带来的清爽气息，与蜜蜡、 香草和麝香的甜蜜巧妙糅合。活力四射、格调优雅。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L38L01_1000x1000_0.png',211.097,100,4.85584,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(33,'蓝风铃香氛蜡烛','清新野花香调，辅以绿叶的青翠、丁香花蕾的甜蜜，与细腻的朝露气息, 散发乳香的蜜桃香，清纯且透出诱人甜蜜。, 粉质纯净，烘托收尾，为香氛带来萦绕不散的柔软气息。','充满活力的蓝色花蕾盛开在阴凉林地间。点缀露珠的蓝风铃甜蜜娇弱，遍布在铃兰与蔷薇之间，更流露出柿子的甜美气息，令人如痴如醉。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L93101_1000x1000_0.png',224.458,100,4.36616,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(34,'野浆果与树莓香氛蜡烛','多汁气息扑面而来，天然黑加仑嫩芽为香氛带来微酸的果香，布枯树精油营造出黑莓叶的脆嫩碧绿与生机勃勃之感。, 白松香的天然芬芳，为香氛带来植物的明媚气息与翠绿逼人。, 醇厚的木质气息，令人为之一振，为香氛奠定层次丰富的基调。','童年时采摘黑莓的美好回忆。深邃酸涩的黑莓果汁，融合初摘的月桂和多刺木香的清新，生动青翠。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LCK601_1000x1000_0.png',74.7126,100,4.23872,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(35,'牡丹与胭红麂绒香氛蜡烛','爽脆利落，多汁的苹果香令人垂涎不已，纯粹的果香奏响香氛的序章。, 精致花香中交织着娇嫩玫瑰与蜂蜜的香气，亦不乏细腻碧绿的清新感。牡丹的芬芳层层弥散，宛如绽放。, 饱满质感，完美衬托牡丹的馥郁花香，为香氛增添撩人魅惑。','魅力精髓。盛放的牡丹，精致而娇嫩。多汁的红苹果香气 与剔透的茉莉、玫瑰、紫罗兰芬芳分外撩人。 柔软胭红麂绒的感官气息交织其间。奢华、诱人。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L3AG01_1000x1000_0.png',314.089,100,4.8908,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(36,'鼠尾草与海盐香氛蜡烛','珍贵的黄葵籽，带来层次分明的青翠香气, 如一阵海风掺着咸咸的雾气，糅合了砂粒与岩石特有的矿物质感。, 带着泥土气息的鼠尾草与愈创木所构成的本木香调，仿佛英国海岸独特的浮木气味，带来奇趣多变的嗅觉体验。','仿若置身于海风习习的海岸。海浪翻卷出细碎白色泡沫，空气中弥漫海盐和水花的清新。悬崖上独有的天然矿物香调，糅合着鼠尾草的木质大地芬芳。自由、活力、纵情畅享。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LH0M01_1000x1000_0.png',206.114,100,4.57716,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(37,'含羞草与小豆蔻香水','辛香中透着淡淡的柠檬清凉，就像一束光芒点亮中调温暖的花香。, 金黄的含羞草，温暖甜美，粉香四溢，如同冬日暖阳。, 而循循诱人的冬加豆，带来精致又温润之感。','甜美、和煦的含羞草迷雾飘散，新鲜压榨的豆蔻辛辣清香若隐若现。在细腻的天芥菜和拂晓采摘的大马士革蔷薇的掩映下，柔滑的香豆与醇柔的檀香交织。温暖、轻盈而迷醉。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L51C01_1000x1000_0.png',495.564,100,4.11151,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(38,'罗勒与橙花香水','罗勒的温暖草本气息，夹着一丝胡椒的辛香，为活力的柑橘调带来惊喜转折。, 闪耀的花香调，奏响甘苦交织的剔透香氛序曲。, 粉质纯净，烘托收尾，为香氛带来萦绕不散的柔软气息。','游走伦敦街头，轻率恣意，妙趣无穷。 橙花的花香气息挑逗着感官，罗勒的绿意香气不安分地若隐若现。经典的英伦气质中，流露着不羁个性。清新、跃动、充满冒险 。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L5NH01_1000x1000_0.png',92.8249,100,4.46793,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(39,'英国橡树与榛子香水','一种绿色的音符，能在香味中产生清新和坚果的感觉。, 醇厚的木质气息，令人为之一振，为香氛奠定层次丰富的基调。, 历经烘烤的橡木散发温暖而引入入胜的木质气息，令人难以抗拒。','被奇妙的声音吸引，于森林中游走，青色的榛子散落在满地落叶之间，随着脚步劈啪作响，香根草的本质芬芳混杂着苔藓的阴冷潮湿感，与橡木的温暖气息完美融合，温暖、稳重、直击人心。','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L6TF01_1000x1000_0.png',59.2883,100,4.72489,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(40,'玫瑰与白麝香纯香香水','玫瑰精油、玫瑰净油和玫瑰水三种原料共同作为中调包含了玫瑰成分中的不同特点三者结合呈现出更为完整而馥郁的玫瑰香气, 粉质纯净，烘托收尾，为香氛带来萦绕不散的柔软气息。','蕴含玫瑰成分中的不同特点呈现完整馥郁的玫瑰香气以干净清澈的白麝香为主令整体香氛后调愈发通透温暖','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L6NM01_1000x1000_0.png',348.263,100,4.19117,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(41,'忍冬与印蒿香水','跃动的绿意交织印蒿的异域果香 娓娓道出一丝香甜明媚, 忍冬花的芳香融化在蜂蜜丝滑微甜中闪烁熠熠光芒, 苔藓与广藿香的木质香调温暖收尾 增添悠长余味','静放幽香的忍冬花，还原英伦乡间的本真气息玫瑰与桂花的鲜香交织蜂蜜的甜美在木质基调的拥抱中，散发四射光芒','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L7JL01_1000x1000_0.png',370.036,100,4.56506,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(42,'紫罗兰与琥珀纯香香水','柔软的紫罗兰叶结合温暖且带有粉质气息的紫罗兰花营造了生动而又优雅的动人前调, 木质香调的温暖层层萦绕，低调渲染感性魅力。','紫罗兰叶结合粉质气息的花瓣，营造生动优雅的动人中。乌木、白麝香将琥珀的温润与醇厚交融，烘托温暖尾调，令香氛更持久。探索纯香系列','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_L6NN01_1000x1000_0.png',215.087,100,4.15369,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(43,'虞美人与大麦香水','\"多汁而成熟，为香氛增添些许爽脆之感\", \"风中漫舞的红色虞美人，为中调带来一抹绿意花香\", \"大麦的醇厚谷香和白麝香交织其间尽情勾勒出温暖迷人的悠远余味\"','黑醋栗的香气飘散在田野间，奠定清爽的前调 红色虞美人在玫瑰掩映之中，注入生动醉人的诱惑 大麦的温暖芬芳和白麝香交缠，糅合出灿烂香气','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LA0001_1000x1000_0.png',63.5884,100,4.87811,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(44,'威士忌与雪松香水','辛辣性感的西班牙干椒搭配微醺威士忌给人充满诱惑力的挑逗 像一件精工打造的传统西服套装, 一杯香气丰富的上乘威士忌与一捧瑰丽多姿的甜美玫瑰, 雪松木温暖的木质香调，则使香味更加深沉迷人','一杯香气丰富的上乘威士忌与一捧瑰丽多姿的甜美玫瑰 环绕辛辣甘椒，温暖杜松，和一抹上过蜡木地板的迷人气息 神秘至醇，辛香迷醉 最彰显性感魅力的香氛 辛辣性感的西班牙干椒搭配微醺威士忌给人充满诱惑力的挑逗 像一件精工打造的传统西服套装 是来自萨维尔街最为经典的街头型格 也是伦敦绅士的经典诠释','https://www.jomalone.com.cn/media/export/cms/products/1000x1000/jo_sku_LAPC01_1000x1000_0.png',151.342,100,4.81096,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(45,'桦木与黑胡椒古龙水','闪耀清新的香调拉开香氛的序幕，弥散出微苦却极具辨识度的清爽气息。, 柔软新鲜的花香中带着青翠果香，赋予香醇的芬芳。, 它清凉，木质特点使其前调充满魅力，余味悠长','以鲜明对比碰撞绝妙演绎现代英伦遵循经典传统的同时 闪耀着朋克的叛逆气质黑胡椒和小豆蔻的酷辣辛香 层叠烟熏桦树的木本气息却在性感墨香与温暖古芸中完美融合 摩登大胆，个性张扬 张扬而叛逆，最为不羁的型格 烟熏的桦树和具有书墨气息的古芸香形成鲜明的对比 宛如一件身着多年的机车皮衣 闪耀着朋克的叛逆气质','https://www.jomalone.com/media/export/cms/products/1000x1000/jo_sku_LAPE01_1000x1000_0.png',64.1191,100,4.79828,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(46,'琥珀与广藿香古龙水','辛香的芫荽包裹在神秘的芳香琥珀中 身穿一件低调奢华的高定礼服 定格在晚宴中随音乐起舞的高光时刻, 诱人的烟熏木香交织萦绕，散发魅惑气息。, 木质香调的温暖层层萦绕，低调渲染感性魅力。','颓废的夜晚，包裹在感性的琥珀里 搭配了深沉的广藿香，以及愈创木诱人的烟熏气质 仿佛手指轻轻抚摸丝绒的质地，柔软而又诱人 最显神秘优雅气质的男香 辛香的芫荽包裹在神秘的芳香琥珀中 身穿一件低调奢华的高定礼服 定格在晚宴中随音乐起舞的高光时刻','https://www.jomalone.com/media/export/cms/products/1000x1000/jo_sku_LAPF01_1000x1000_0.png',321.918,100,4.47144,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(47,'阿萨姆 & 葡萄柚古龙水','闪耀清新的香调拉开香氛的序幕，弥散出微苦却极具辨识度的清爽气息。, 一杯清茶带来的活力与浓郁，搭配爽朗的葡萄柚 阿萨姆红茶的独特音香气在空气中舒展, 感性而深沉的木香令整体香氛历久弥新。','一杯清茶带来的活力与浓郁，搭配爽朗的葡萄柚 阿萨姆红茶的独特音香气在空气中舒展 马黛茶的草本气味混合着辛辣的小豆蔻和广藿香的温暖 最包容并蓄的温柔香气 同时兼具极冷的柚子和极暖的茶香 完美的交融互补 是清晨醒来身着的丝质薄衫 从未喧宾夺主，却温柔满溢','https://www.jomalone.com/media/export/cms/products/1000x1000/jo_sku_LAPG01_1000x1000_0.png',429.54,100,4.10159,'2025-03-12 15:16:03','2025-03-12 15:16:03'),(48,'栀子花与乌木精油','柔滑、阳光般的花香调，给香水的中调带来明亮的白色花束的香味。, 深沉慵懒的沉香木气息，辅以果仁糖的甜蜜，尽显颓靡之美','栀子花释放出纯澈清香 乌木与白麝香的东方气息捎来暖意 为清新明亮的花香增添奇妙变调 令整体香调愈发温暖通透','https://www.jomalone.com/media/export/cms/products/1000x1000/jo_sku_L6NP01_1000x1000_0.png',181.07,100,4.4729,'2025-03-12 15:16:03','2025-03-12 15:16:03');
/*!40000 ALTER TABLE `aroma_products` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `content` text,
  `is_user` tinyint(1) DEFAULT NULL,
  `emotion` varchar(20) DEFAULT NULL,
  `emotion_score` float DEFAULT NULL,
  `persona` varchar(20) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (97,5,'最近有点焦虑',1,'焦虑',45,'empathetic','2025-03-13 09:05:04'),(98,5,'我理解你的焦虑，这确实让人感到困扰。能和我多聊聊吗？是什么让你感到焦虑呢？',0,'焦虑',45,'empathetic','2025-03-13 09:05:06'),(99,5,'快要考试了，但是我还没准备好',1,'平静',60,'empathetic','2025-03-13 09:05:36'),(100,5,'考试前的焦虑是很正常的，尤其是当感觉准备不充分时。能具体说说你感到焦虑的方面吗？是时间不够，还是对某些科目没有把握？',0,'平静',60,'empathetic','2025-03-13 09:05:38'),(101,5,'有很多的地方还不懂，感觉在考试之前没有足够的时间去全部弄懂了',1,'平静',60,'empathetic','2025-03-13 09:06:25'),(102,5,'这种情况确实让人感到压力很大。我们可以一起看看哪些地方你还需要加强，或许能找出一些有效的学习方法来提高效率。你觉得怎么样？',0,'平静',60,'empathetic','2025-03-13 09:06:27'),(103,5,'还有7天就要考操作系统了，但我基本上都还不懂',1,'平静',60,'empathetic','2025-03-13 09:07:17'),(104,5,'我理解你的焦虑，时间紧迫确实让人感到压力。不过，我们可以一起制定一个短期的学习计划，帮助你在有限的时间内尽可能地掌握重点内容。你想先从哪个部分开始呢？',0,'平静',60,'empathetic','2025-03-13 09:07:19'),(105,5,'从操作系统的复习卡死好',1,'平静',60,'empathetic','2025-03-13 09:07:34'),(106,5,'好的，让我们从操作系统的复习卡死开始。你可以先告诉我你目前对操作系统的理解程度，以及你觉得最难的部分是什么？这样我可以更好地帮助你。',0,'平静',60,'empathetic','2025-03-13 09:07:37'),(107,5,'我觉得最难的是线程的调度和死锁问题',1,'平静',60,'empathetic','2025-03-13 09:08:10'),(108,5,'线程调度和死锁确实是操作系统中比较复杂的内容。我们可以一步一步来，先理解基本概念，再通过一些例子来加深印象。\n\n**线程调度**：\n1. **进程与线程的区别**：进程是资源分配的基本单位，而线程是CPU调度的基本单位。一个进程可以包含多个线程。\n2. **调度算法**：常见的调度算法有先来先服务（FCFS）、短作业优先（SJF）、时间片轮转（RR）等。每种算法都有其优缺点，适用于不同的场景。\n3. **优先级**：线程可以有不同的优先级，调度时通常会考虑优先级，以确保高优先级的任务能够及时执行。\n\n**死锁问题**：\n1. **死锁的定义**：当两个或多个线程在等待彼此释放资源时，导致所有线程都无法继续执行，就形成了死锁。\n2. **死锁的必要条件**：互斥、占有且等待、不可抢占、循环等待。了解这些条件有助于我们识别和预防死锁。\n3. **解决死锁的方法**：预防、避免、检测和恢复。例如，使用银行家算法可以避免死锁，通过资源分配图来检测死锁，或者通过终止某个线程并回收其资源来恢复系统。\n\n如果你能具体描述一下你在这两个部分遇到的具体困难，我可以提供更针对性的帮助。',0,'平静',60,'empathetic','2025-03-13 09:08:19'),(109,5,'我不知道在实际的开发过程中如何避免死锁的问题',1,'平静',60,'empathetic','2025-03-13 09:09:30'),(110,5,'感谢你一直以来的分享和信任。经过这段时间的交流，我想我们都对你的情况有了更深入的了解。有时候，适当的外部辅助也能带来不同的体验。根据我们的对话内容，一些温和的香薰产品可能适合你现在的状态，无论是帮助放松还是提升情绪。你对这方面有什么特别感兴趣的吗？',0,'平静',60,'empathetic','2025-03-13 09:09:40'),(111,5,'今天心情还不错',1,'平静',60,'empathetic','2025-03-13 09:10:40'),(112,5,'很高兴听到你今天心情还不错！生活中的小确幸总是能让人感到愉悦。如果你愿意，可以和我分享一下是什么让你今天这么开心吗？无论是天气、工作还是生活中的小事，都值得庆祝和分享呢！',0,'平静',60,'empathetic','2025-03-13 09:10:43');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `emotion_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotion_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `emotion` varchar(20) DEFAULT NULL,
  `score` float DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `emotion_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `emotion_records` WRITE;
/*!40000 ALTER TABLE `emotion_records` DISABLE KEYS */;
INSERT INTO `emotion_records` VALUES (1,5,'焦虑',40,'2025-03-11 02:30:53'),(2,5,'焦虑',40,'2025-03-11 02:35:53'),(3,5,'焦虑',40,'2025-03-11 02:42:25'),(4,5,'平静',60,'2025-03-11 02:44:19'),(5,5,'平静',60,'2025-03-11 02:45:45'),(6,5,'焦虑',40,'2025-03-11 02:46:46'),(7,5,'平静',60,'2025-03-11 02:47:07'),(8,5,'平静',60,'2025-03-11 02:58:09'),(9,5,'焦虑',40,'2025-03-11 02:59:18'),(10,5,'焦虑',40,'2025-03-11 02:59:35'),(11,5,'平静',60,'2025-03-11 03:24:54'),(12,5,'平静',60,'2025-03-11 06:25:26'),(13,5,'平静',60,'2025-03-11 06:25:41'),(14,5,'疲惫',45,'2025-03-11 06:34:06'),(15,5,'焦虑',45,'2025-03-11 09:05:32'),(16,5,'平静',60,'2025-03-11 09:10:27'),(17,5,'平静',60,'2025-03-11 09:12:04'),(18,5,'平静',60,'2025-03-11 09:16:03'),(19,5,'焦虑',45,'2025-03-11 09:17:02'),(20,5,'平静',60,'2025-03-11 10:28:20'),(21,5,'平静',60,'2025-03-11 10:29:28'),(22,5,'焦虑',45,'2025-03-11 10:29:56'),(23,5,'平静',60,'2025-03-11 10:30:35'),(24,5,'焦虑',45,'2025-03-13 02:16:55'),(25,5,'平静',60,'2025-03-13 02:19:08'),(26,5,'焦虑',45,'2025-03-13 07:25:18'),(27,5,'焦虑',45,'2025-03-13 07:26:58'),(28,5,'焦虑',45,'2025-03-13 07:35:39'),(29,5,'焦虑',45,'2025-03-13 07:42:21'),(30,5,'焦虑',45,'2025-03-13 07:44:14'),(31,5,'焦虑',45,'2025-03-13 07:45:16'),(32,5,'平静',60,'2025-03-13 07:45:39'),(33,5,'平静',60,'2025-03-13 07:46:55'),(34,5,'平静',60,'2025-03-13 07:47:45'),(35,5,'平静',60,'2025-03-13 07:49:01'),(36,5,'平静',60,'2025-03-13 07:50:50'),(37,5,'平静',60,'2025-03-13 07:52:12'),(38,5,'平静',60,'2025-03-13 07:57:50'),(39,5,'平静',60,'2025-03-13 08:19:50'),(40,5,'平静',60,'2025-03-13 08:41:25'),(41,5,'平静',60,'2025-03-13 08:43:27'),(42,5,'平静',60,'2025-03-13 08:44:16'),(43,5,'平静',60,'2025-03-13 08:51:18'),(44,5,'平静',60,'2025-03-13 08:53:14'),(45,5,'焦虑',45,'2025-03-13 08:53:58'),(46,5,'平静',60,'2025-03-13 08:54:33'),(47,5,'平静',60,'2025-03-13 08:56:07'),(48,5,'焦虑',45,'2025-03-13 09:04:35'),(49,5,'焦虑',45,'2025-03-13 09:05:04'),(50,5,'平静',60,'2025-03-13 09:05:36'),(51,5,'平静',60,'2025-03-13 09:06:25'),(52,5,'平静',60,'2025-03-13 09:07:17'),(53,5,'平静',60,'2025-03-13 09:07:34'),(54,5,'平静',60,'2025-03-13 09:08:10'),(55,5,'平静',60,'2025-03-13 09:09:30'),(56,5,'平静',60,'2025-03-13 09:10:40');
/*!40000 ALTER TABLE `emotion_records` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `product_emotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_emotions` (
  `product_id` int NOT NULL,
  `emotion` varchar(20) NOT NULL,
  PRIMARY KEY (`product_id`,`emotion`),
  CONSTRAINT `product_emotions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `aroma_products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `product_emotions` WRITE;
/*!40000 ALTER TABLE `product_emotions` DISABLE KEYS */;
INSERT INTO `product_emotions` VALUES (6,'提神'),(7,'提神'),(7,'放松'),(8,'愉悦'),(9,'放松'),(9,'温暖'),(10,'安抚'),(10,'放松'),(11,'抑郁'),(11,'焦虑'),(17,'提神'),(17,'温暖'),(18,'快乐'),(18,'温暖'),(19,'提神'),(19,'温暖'),(22,'温暖'),(23,'温暖'),(24,'温暖'),(25,'温暖'),(26,'安抚'),(26,'温暖'),(27,'温暖'),(28,'温暖'),(29,'平静'),(30,'平静'),(31,'平静'),(32,'提神'),(33,'提神'),(34,'平静'),(35,'放松'),(36,'提神'),(37,'温暖'),(38,'提神'),(38,'温暖'),(38,'焦虑'),(39,'温暖'),(40,'温暖'),(41,'温暖'),(42,'温暖'),(43,'温暖'),(44,'温暖'),(45,'温暖'),(46,'温暖'),(47,'提神'),(47,'温暖'),(48,'温暖');
/*!40000 ALTER TABLE `product_emotions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(64) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `password_hash` varchar(256) DEFAULT NULL,
  `avatar` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `is_confirmed` tinyint(1) DEFAULT NULL,
  `emotion_preferences` varchar(200) DEFAULT NULL,
  `aroma_preferences` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`),
  UNIQUE KEY `ix_users_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@example.com','pbkdf2:sha256:260000$wNLF0johCD59mnGv$fcb9d4e57b56821067b1136a89e744bbec645b32b2f7ea0aad3960908008bf0e','default_avatar.jpg','2025-03-07 06:53:09','2025-03-10 18:32:39',1,1,'[]','[]'),(2,'test','test@example.com','pbkdf2:sha256:260000$bjzHsDYNljsXaIr2$77e374c8566dea39575665b81a67949558806c7597f76adb25f6103c9a9d6a57','default_avatar.jpg','2025-03-07 06:53:09','2025-03-07 06:53:09',1,1,'[\"\\u7126\\u8651\", \"\\u5931\\u7720\"]','[\"\\u85b0\\u8863\\u8349\", \"\\u8309\\u8389\\u82b1\"]'),(5,'miyou','2540701905@qq.com','pbkdf2:sha256:260000$FkaSQJjnZzrAzk9o$6d2bfec7dd92ecb91887b439a07924aaa21bce8ab2c2a2ad564f4cdcd99d7f07','/static/uploads/avatars/user_5_20250310194107.png','2025-03-10 07:19:04','2025-03-13 19:38:15',1,0,'[]','{\"scents\": [], \"types\": [], \"concerns\": [], \"preferences_collected\": false}');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

