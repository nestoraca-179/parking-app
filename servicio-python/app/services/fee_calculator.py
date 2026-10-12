from decimal import Decimal, ROUND_HALF_UP
from math import ceil


def calculate_fee(total_minutes, rate):
    if total_minutes <= rate.grace_minutes:
        return Decimal("0.00")
    full_days, remaining_minutes = divmod(total_minutes, 1440)
    remaining_fee = Decimal("0.00")
    if remaining_minutes > 0:
        billed_hours = ceil(remaining_minutes / 60)
        remaining_fee = rate.first_hour + (billed_hours - 1) * rate.extra_hour
    fee = full_days * rate.daily_cap + min(remaining_fee, rate.daily_cap)
    return fee.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
