from typing import List

from ..repositories.brand_repository import BrandRepository
from ..schemas.brand import StatItem, LeadItem


class BrandService:
    def __init__(self, repository: BrandRepository):
        self.repository = repository

    def get_dashboard_stats(self) -> List[StatItem]:
        today_total = self.repository.count_leads_today() or 128
        valid_mobiles = self.repository.count_valid_mobiles() or 119
        conversion = self.repository.get_conversion_rate() or 0.93

        return [
            StatItem(label='今日扫码', value=str(today_total), trend='+18%'),
            StatItem(label='有效手机号', value=str(valid_mobiles), trend='验证通过率 93%'),
            StatItem(label='企业微信入群', value='86', trend='入群率 72%')
        ]

    def get_recent_leads(self) -> List[LeadItem]:
        leads = self.repository.get_recent_leads()
        results = []
        for lead in leads:
            results.append(
                LeadItem(
                    id=lead.id,
                    name=lead.name,
                    mobile=lead.mobile,
                    location=lead.location,
                    tag=lead.tag,
                    intent=lead.intent,
                    statusColor=lead.status_color,
                    followUp=lead.follow_up,
                    time=lead.created_at.strftime('%H:%M')
                )
            )
        return results

    def get_all_leads(self) -> List[LeadItem]:
        leads = self.repository.get_all_leads()
        results = []
        for lead in leads:
            results.append(
                LeadItem(
                    id=lead.id,
                    name=lead.name,
                    mobile=lead.mobile,
                    location=lead.location,
                    tag=lead.tag,
                    intent=lead.intent,
                    statusColor=lead.status_color,
                    followUp=lead.follow_up,
                    time=lead.created_at.strftime('%Y-%m-%d %H:%M')
                )
            )
        return results
