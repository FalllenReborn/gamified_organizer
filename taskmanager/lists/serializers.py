from rest_framework import serializers
from .models import TaskList, Task, Reward, Bar


class TaskListSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskList
        fields = '__all__'


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'


class BarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bar
        fields = '__all__'
