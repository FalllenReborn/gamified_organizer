from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from lists.views import TaskListViewSet, TaskViewSet, BarViewSet, RewardViewSet, CurrencyViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'tasklists', TaskListViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'bars', BarViewSet)
router.register(r'rewards', RewardViewSet)
router.register(r'currencies', CurrencyViewSet)
router.register(r'transactions', TransactionViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('api/', include(router.urls)),
]

