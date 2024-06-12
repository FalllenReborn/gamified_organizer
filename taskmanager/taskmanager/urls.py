from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from lists.views import TaskListViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'tasklists', TaskListViewSet)
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('api/', include(router.urls)),
]

