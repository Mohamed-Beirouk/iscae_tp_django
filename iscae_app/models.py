from django.db import models

from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models

class CustomUser(AbstractUser):
    tel = models.IntegerField(unique=True)
    email = models.EmailField(unique=True, blank=False, null=False)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = UserManager()



class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    groupe_sanguin = models.CharField(max_length=3, blank=True, null=True)
    maladie = models.TextField(blank=True, null=True)
    antecedents = models.TextField(blank=True, null=True)
    date_naissance = models.DateField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    pret_pour_don = models.BooleanField(default=False)
    nni = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s profile"


class DonationHistory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    date_don = models.DateField()
    lieu_don = models.CharField(max_length=255)
    quantite_donnee = models.FloatField()  

    def __str__(self):
        return f"Donation by {self.user.username} on {self.date_don}"
    



# centres_dons
class DonationCenter(models.Model):
    nom = models.CharField(max_length=255)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return self.nom