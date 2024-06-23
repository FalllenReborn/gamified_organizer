from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskListViewSet, TaskViewSet, BarViewSet, RewardViewSet


router = DefaultRouter()
router.register(r'tasklists', TaskListViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'bars', BarViewSet)
router.register(r'rewards', RewardViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
