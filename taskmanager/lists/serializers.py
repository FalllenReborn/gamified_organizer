from rest_framework import serializers
from .models import TaskList, Task, Reward, Bar, Currency, Transaction, Layer


class LayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Layer
        fields = '__all__'


class TaskListSerializer(serializers.ModelSerializer):
    layer = LayerSerializer()

    class Meta:
        model = TaskList
        fields = '__all__'


class BarSerializer(serializers.ModelSerializer):
    layer = LayerSerializer()

    class Meta:
        model = Bar
        fields = '__all__'


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
