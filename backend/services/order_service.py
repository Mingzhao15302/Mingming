from datetime import datetime
from ..repositories.order_repository import OrderRepository
from ..schemas.order import OrderResponse


class OrderService:
    def __init__(self, repository: OrderRepository):
        self.repository = repository

    def _generate_preview(self, content: str) -> str:
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M')
        header = f"【辉云OS 智能订单】\n生成时间：{timestamp}\n------------------------------\n"
        body = content.strip()
        suggestion = "\n\n【AI 建议】\n1. 自动匹配最优优惠券\n2. 推荐下次直播邀约话术\n3. 同步至企业微信 CRM"
        return header + body + suggestion

    def _generate_pdf_url(self, order_id: int) -> str:
        return f"https://cdn.huixin-cloud.com/orders/{order_id}.pdf"

    def create_order(self, content: str) -> OrderResponse:
        preview = self._generate_preview(content)
        pdf_url = None
        order = self.repository.create_order(content, preview, pdf_url)
        pdf_url = self._generate_pdf_url(order.id)
        order.pdf_url = pdf_url
        self.repository.session.commit()
        return OrderResponse(
            id=order.id,
            preview=order.preview,
            pdf_url=pdf_url,
            created_at=order.created_at
        )

    def preview_order(self, content: str) -> OrderResponse:
        preview = self._generate_preview(content)
        return OrderResponse(
            id=0,
            preview=preview,
            pdf_url=None,
            created_at=datetime.utcnow()
        )
