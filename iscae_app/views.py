from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from iscae_app.models import CustomUser, UserProfile
from django.http import JsonResponse
import json


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
