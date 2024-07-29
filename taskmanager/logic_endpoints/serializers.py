from rest_framework import serializers
from .models import TaskList, Task, Reward, Bar, Currency, Transaction, Layer, Item, Voucher, Shop, Price


class LayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layer
        fields = '__all__'


class TaskListSerializer(serializers.ModelSerializer):
    layer = serializers.SerializerMethodField(required=False)

    class Meta:
        model = TaskList
        fields = '__all__'

    @staticmethod
    def get_layer(obj):
        try:
            layer = Layer.objects.get(foreign_id=obj.list_id, foreign_table=1)
            return LayerSerializer(layer).data
        except Layer.DoesNotExist:
            return None


class BarSerializer(serializers.ModelSerializer):
    layer = serializers.SerializerMethodField(required=False)

    class Meta:
        model = Bar
        fields = '__all__'

    @staticmethod
    def get_layer(obj):
        try:
            layer = Layer.objects.get(foreign_id=obj.bar_id, foreign_table=2)
            return LayerSerializer(layer).data
        except Layer.DoesNotExist:
            return None


class ShopSerializer(serializers.ModelSerializer):
    layer = serializers.SerializerMethodField(required=False)

    class Meta:
        model = Shop
        fields = '__all__'

    @staticmethod
    def get_layer(obj):
        try:
            layer = Layer.objects.get(foreign_id=obj.shop_id, foreign_table=3)
            return LayerSerializer(layer).data
        except Layer.DoesNotExist:
            return None


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'


class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = '__all__'


class PriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Price
        fields = '__all__'
