def get_badge_from_count(count):
    if count <= 0:
        return None
    if 1 <= count <= 2:
        return "Starter"
    if 3 <= count <= 5:
        return "Bronze"
    if 6 <= count <= 10:
        return "Silver"
    if 11 <= count <= 20:
        return "Gold"
    if 21 <= count <= 40:
        return "Platinum"
    if 41 <= count <= 70:
        return "Diamond"
    if 71 <= count <= 100:
        return "Legendary"
    return "Grand Master"


from datetime import datetime, timedelta

from iscae_app.models import DonationHistory    

def is_eligible_for_donation(user):
    two_months_ago = datetime.now().date() - timedelta(days=60)
    recent_donations = DonationHistory.objects.filter(user=user, date_don__gte=two_months_ago)
    return not recent_donations.exists()