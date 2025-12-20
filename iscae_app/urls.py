from django.urls import path

from iscae_app.views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # me
    path('me/', me, name='me'),



    # register_user
    path('register/', register_user, name='register_user'),

    # DonationHistoryView
    path('donations/', DonationHistoryView.as_view(), name='donation_history'),


    # monthly_leaderboard
    path('leaderboard/monthly/', monthly_leaderboard, name='monthly_leaderboard'),



    # centres_dons
    path('donation_centers/', centres_dons, name='donation_centers'),




    
]