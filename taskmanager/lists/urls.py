from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskListViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'tasklists', TaskListViewSet)
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
]