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
    size_vertical = models.FloatField(default=0)
    size_horizontal = models.FloatField(default=0)

    def __str__(self):
        return self.list_name or f"List {self.list_id}"

    class Meta:
        db_table = 'task_lists'
