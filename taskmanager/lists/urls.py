# urls.py in your lists app
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskListViewSet, update_task_list_name


router = DefaultRouter()
router.register(r'tasklists', TaskListViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/tasklists/<int:list_id>/', update_task_list_name),
]
