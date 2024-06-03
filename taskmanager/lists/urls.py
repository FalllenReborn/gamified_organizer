from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskListViewSet


router = DefaultRouter()
router.register(r'tasklists', TaskListViewSet)

urlpatterns = [
    path('api/tasklists/<int:list_id>/', TaskListViewSet.update_task_list_name),
    path('api/', include(router.urls)),
]
