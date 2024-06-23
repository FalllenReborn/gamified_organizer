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
    nested_id = models.IntegerField(null=True, blank=True)
    expanded = models.BooleanField(default=False)

    def __str__(self):
        return self.task_name

    class Meta:
        db_table = 'tasks'


class Bar(models.Model):
    bar_id = models.AutoField(primary_key=True)
    bar_name = models.CharField(max_length=255, null=True, blank=True)
    xp_name = models.CharField(max_length=255, null=True, blank=True)
    x_axis = models.FloatField(default=0)
    y_axis = models.FloatField(default=0)
    size_vertical = models.FloatField(default=200)
    size_horizontal = models.FloatField(default=300)
    zindex = models.FloatField(default=5000000)
    total_points = models.IntegerField(default=0)
    full_cycle = models.IntegerField(default=200)
    partial_cycle1 = models.IntegerField(null=True, blank=True)
    partial_cycle2 = models.IntegerField(null=True, blank=True)
    partial_cycle3 = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.bar_name if self.bar_name else f'Bar {self.bar_id}'

    class Meta:
        db_table = 'bars'


class Reward(models.Model):
    reward_id = models.AutoField(primary_key=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, db_column='task_id')
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, db_column='bar_id')
    points = models.IntegerField(default=10)

    def __str__(self):
        return f'Reward {self.reward_id}: {self.points} points for task {self.task} and bar {self.bar}'

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
