from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskListViewSet


router = DefaultRouter()
router.register(r'tasklists', TaskListViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
