from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from iscae_app.models import CustomUser, DonationHistory, UserProfile
from django.http import JsonResponse
import json

from iscae_app.utils import get_badge_from_count, is_eligible_for_donation


@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
             data = json.loads(request.body)
        except json.JSONDecodeError:
             return JsonResponse({'error': 'Invalid JSON'}, status=400)
        print(data)
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        tel = data.get('tel')
        
        groupe_sanguin = data.get('groupe_sanguin')
        maladie = data.get('maladie')
        antecedents = data.get('antecedents')
        date_naissance = data.get('date_naissance')
        location = data.get('location')
        pret_pour_don = data.get('pret_pour_don')
        nni = data.get('nni')
        bio = data.get('bio')

        if email is None:
            return JsonResponse({'error': 'Email is required'}, status=400)

        elif CustomUser.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already exists'}, status=400)
        elif CustomUser.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)
        
        if not password or len(password) < 4:
            return JsonResponse({'error': 'Password must be at least 4 characters long'}, status=400)
        
        if not first_name or not last_name or not email or not username:
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        


        user = CustomUser.objects.create_user(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=username,
            password=password,
            tel=tel
        )
        profile = UserProfile.objects.create(
            user=user,    
        )
        if groupe_sanguin:
            profile.groupe_sanguin = groupe_sanguin
        if maladie:
            profile.maladie = maladie
        if antecedents:
            profile.antecedents = antecedents
        if date_naissance:
            profile.date_naissance = date_naissance
        if location:
            profile.location = location
        if pret_pour_don:
            profile.pret_pour_don = pret_pour_don
        if nni:
            profile.nni = nni
        if bio:
            profile.bio = bio
        profile.save()

        user.save()
        return JsonResponse({'message': 'User registered successfully'}, status=201)
    return JsonResponse({'error': 'Invalid request method'}, status=400)



#  Historique des dons avec ApiView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated  



class DonationHistoryView(APIView):
    permission_classes = [IsAuthenticated]  
    def get(self, request):
        user = request.user
        if user.is_superuser:
            donations = DonationHistory.objects.all()
        else:   
            donations = DonationHistory.objects.filter(user=user)  

        donation_data = [
            {
                'date_don': donation.date_don,
                'lieu_don': donation.lieu_don,
                'quantite_donnee': donation.quantite_donnee,
            }
            for donation in donations
        ]
        return Response({'donation_history': donation_data})    
    def post(self, request):
        user = request.user
        data = request.data
        date_don = data.get('date_don')
        lieu_don = data.get('lieu_don')
        quantite_donnee = data.get('quantite_donnee')

        if not is_eligible_for_donation(user):
            return Response({'error': 'You are not eligible to donate at this time.'}, status=400)

        donation = DonationHistory.objects.create(
            user=user,
            date_don=date_don,
            lieu_don=lieu_don,
            quantite_donnee=quantite_donnee 
        )
        return Response({'message': 'Donation recorded successfully'}, status=201)
    





#  me api retunr infos of the connected user
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated  , AllowAny
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    profile = UserProfile.objects.get(user=user)
    count = DonationHistory.objects.filter(user=user).count()
    badge_name = get_badge_from_count(count)
    user_data = {
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'username': user.username,
        'tel': user.tel,
        'groupe_sanguin': profile.groupe_sanguin,
        'maladie': profile.maladie,
        'antecedents': profile.antecedents,
        'date_naissance': profile.date_naissance,
        'location': profile.location,
        'pret_pour_don': profile.pret_pour_don,
        'nni': profile.nni,
        'bio': profile.bio,
        'donation_count': count,
        'badge': badge_name,
    }
    return Response(user_data)





from datetime import datetime, timedelta
from django.db.models import Count
from django.utils.timezone import now

@api_view(['GET'])
@permission_classes([AllowAny])
def monthly_leaderboard(request):
    one_month_ago = now() - timedelta(days=30)
    leaderboard = (
        DonationHistory.objects
        .filter(date_don__gte=one_month_ago)
        .values('user__username')
        .annotate(donation_count=Count('id'))
        .order_by('-donation_count')[:10]
    )

    leaderboard_data = [
        {
            'username': entry['user__username'],
            'donation_count': entry['donation_count']
        }
        for entry in leaderboard
    ]

    return JsonResponse({'leaderboard': leaderboard_data})




# Lister les centres de don
from iscae_app.models import DonationCenter
@api_view(['GET'])
@permission_classes([AllowAny])
def centres_dons(request):
    centers = DonationCenter.objects.all()
    centers_data = [
        {
            'nom': center.nom,
            'adresse': center.adresse,
            'telephone': center.telephone,
            'email': center.email,
        }
        for center in centers
    ]
    return JsonResponse({'donation_centers': centers_data})