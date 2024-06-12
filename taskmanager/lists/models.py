from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class TaskList(models.Model):
    list_id = models.AutoField(primary_key=True)
    list_name = models.CharField(max_length=255, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=1)  # Set default user_id to 1
    x_axis = models.FloatField(default=0)
    y_axis = models.FloatField(default=0)
    hidden = models.BooleanField(default=False)
    size_vertical = models.FloatField(default=200)
    size_horizontal = models.FloatField(default=300)
    zindex = models.FloatField(default=500)

    def __str__(self):
        return self.list_name or f"List {self.list_id}"

    class Meta:
        db_table = 'task_lists'


class Task(models.Model):
    task_id = models.AutoField(primary_key=True)
    list_task = models.ForeignKey(TaskList, on_delete=models.CASCADE, db_column='list_id')
    task_name = models.CharField(max_length=255)
    created_date_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.task_name

    class Meta:
        db_table = 'tasks'


class Reward(models.Model):
    task_reward = models.OneToOneField(
        Task,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='reward',
        db_column='task_id'
    )

    class Meta:
        db_table = 'rewards'


class Property(models.Model):
    task_property = models.OneToOneField(
        Task,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='property',
        db_column='task_id'
    )

    class Meta:
        db_table = 'properties'
