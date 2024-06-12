from rest_framework import serializers
from .models import TaskList, Task, Reward, Property


class TaskListSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskList
        fields = '__all__'


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = '__all__'


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    reward = RewardSerializer()
    property = PropertySerializer()

    class Meta:
        model = Task
        fields = '__all__'
