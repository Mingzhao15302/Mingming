from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .controllers.brand_controller import router as brand_router
from .controllers.script_controller import router as script_router
from .controllers.order_controller import router as order_router
from .controllers.auth_controller import router as auth_router
from .models import tables
from .models.database import engine, SessionLocal, Base
from .utils.security import hash_password

app = FastAPI(title='HuiYun OS API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(brand_router, prefix='/api')
app.include_router(script_router, prefix='/api')
app.include_router(order_router, prefix='/api')
app.include_router(auth_router, prefix='/api')


def seed_data():
    session = SessionLocal()
    try:
        Base.metadata.create_all(bind=engine)

        if session.query(tables.User).count() == 0:
            session.add(
                tables.User(
                    username='pm_admin',
                    password_hash=hash_password('123456'),
                    name='辉云运营官',
                    role='超级管理员'
                )
            )

        if session.query(tables.Lead).count() == 0:
            leads = [
                {'name': '李晓晨', 'mobile': '138****8231', 'location': '上海 · 浦东', 'tag': '视频号关注', 'intent': 'B端采购', 'status_color': '#22d3ee', 'follow_up': '明日邀约演示'},
                {'name': '王静', 'mobile': '137****5210', 'location': '深圳 · 南山', 'tag': '企业微信添加', 'intent': '直播报名', 'status_color': '#34d399', 'follow_up': '已下单 5W'},
                {'name': '陈坤', 'mobile': '150****1023', 'location': '广州 · 天河', 'tag': '线下活动', 'intent': '高意向', 'status_color': '#fbbf24', 'follow_up': '今日回访'},
                {'name': '赵丽', 'mobile': '139****8890', 'location': '杭州 · 余杭', 'tag': '视频号私信', 'intent': '了解套餐', 'status_color': '#38bdf8', 'follow_up': '待发送报价'},
                {'name': '周强', 'mobile': '136****7721', 'location': '成都 · 高新', 'tag': '老客户', 'intent': '续费', 'status_color': '#60a5fa', 'follow_up': '安排客服跟进'}
            ]
            for lead in leads:
                session.add(tables.Lead(**lead))

        if session.query(tables.Script).count() == 0:
            business_scripts = [
                ('scene', '场景开场', '即刻拉近距离', '开场', 8, "### 开场引导\n- 老客户福利升级\n- 数据化私域运营场景展示\n- 引导扫码领取资料"),
                ('product', '塑品结构', '突出产品实力', '产品', 6, "### 产品结构\n- 三层云管平台\n- 行业专属模版\n- 数据可视化驾驶舱"),
                ('brand', '品牌故事', '建立信任背书', '品牌', 5, "### 品牌背书\n- 辉鑫科技 15 年企业服务经验\n- 服务 1200+ 企业客户\n- 与腾讯、华为生态合作"),
                ('selling_point', '核心卖点', '三大亮点打动客户', '卖点', 7, "### 核心卖点\n- 扫码 15 秒完成留资\n- 话术库每日自动更新\n- 订单自动生成 PDF"),
                ('endorsement', '行业背书', '引用成功案例', '背书', 4, "### 行业案例\n- 制造业：30 天增长 230% 线索\n- 医美：直播转化率提升 2.3 倍\n- 教培：线上裂变新增 800+"),
                ('persona', '主播人设', '人设定位与情绪', '人设', 5, "### 人设建议\n- 角色：数字化顾问\n- 口吻：专业亲和\n- 节奏：问答穿插案例"),
                ('quote', '报价策略', '灵活定价组合', '报价', 6, "### 报价话术\n- 标准版：￥9980/年\n- 旗舰版：￥13980/年\n- 定制版：按月度 GMV 结算"),
                ('conversion', '促单提炼', '营造稀缺感', '促单', 5, "### 促单要点\n- 限量赠送运营培训营\n- 当天签约送专属客服\n- 提供落地执行手册"),
                ('benefits', '福利权益', '强化客户收益', '福利', 4, "### 入会福利\n- 首月专属陪跑\n- 视频号诊断报告\n- 企业微信 SOP 包"),
            ]
            livestream_scripts = [
                ('scene', '直播暖场', '迅速升温气氛', '场控', 6, "### 暖场脚本\n- 30 秒自我介绍\n- 引导关注+点赞\n- 公布福利倒计时"),
                ('product', '产品拆解', '清晰呈现亮点', '产品', 7, "### 产品拆解\n- 模块化功能演示\n- 手机端实操展示\n- 客户案例切片"),
                ('brand', '品牌植入', '强化信任度', '品牌', 5, "### 品牌植入\n- 介绍辉鑫科技荣誉\n- 用户数与核心数据\n- 专属顾问团队亮相"),
                ('selling_point', '卖点强化', '击中痛点场景', '卖点', 8, "### 卖点强化\n- AI 话术助手实时推送\n- 订单生成一键导出\n- 企业微信自动建群"),
                ('endorsement', '权威背书', '引用第三方数据', '背书', 5, "### 权威背书\n- 艾媒咨询报告数据\n- 行业协会推荐\n- 腾讯云生态合作伙伴"),
                ('persona', '主播节奏', '控场节奏卡点', '节奏', 4, "### 节奏控场\n- 黄金 5 分钟揭示福利\n- 每 8 分钟穿插案例\n- 评论互动抽奖"),
                ('quote', '优惠发布', '折扣组合方案', '报价', 6, "### 优惠发布\n- 直播专属折扣 9 折\n- 下单送千元投放券\n- 叠加老客转介绍礼"),
                ('conversion', '临门催单', '刺激立即下单', '促单', 5, "### 临门一脚\n- 仅剩 30 个名额\n- 送企业微信私域诊断\n- 即刻锁定顾问号"),
                ('benefits', '售后权益', '保障服务体验', '福利', 4, "### 售后权益\n- 7x12 小时服务\n- 入驻专属知识库\n- 每周直播运营课"),
            ]
            for script in business_scripts:
                session.add(tables.Script(
                    script_type='business',
                    key=script[0],
                    title=script[1],
                    subtitle=script[2],
                    badge=script[3],
                    count=script[4],
                    content=script[5]
                ))
            for script in livestream_scripts:
                session.add(tables.Script(
                    script_type='livestream',
                    key=script[0],
                    title=script[1],
                    subtitle=script[2],
                    badge=script[3],
                    count=script[4],
                    content=script[5]
                ))

        session.commit()
    finally:
        session.close()


seed_data()


@app.get('/api/health')
def health_check():
    return {'status': 'ok'}
