from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (TaskListViewSet, TaskViewSet, BarViewSet,
                    RewardViewSet, CurrencyViewSet, TransactionViewSet,
                    LayerViewSet, ItemViewSet, VoucherViewSet, ShopViewSet, PriceViewSet)

router = DefaultRouter()
router.register(r'tasklists', TaskListViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'bars', BarViewSet)
router.register(r'rewards', RewardViewSet)
router.register(r'currencies', CurrencyViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'layers', LayerViewSet)
router.register(r'items', ItemViewSet)
router.register(r'vouchers', VoucherViewSet)
router.register(r'shops', ShopViewSet)
router.register(r'prices', PriceViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
