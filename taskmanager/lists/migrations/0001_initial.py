# Generated by Django 4.2.13 on 2024-06-12 11:59

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Task',
            fields=[
                ('task_id', models.AutoField(primary_key=True, serialize=False)),
                ('task_name', models.CharField(max_length=255)),
                ('created_date_time', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'tasks',
            },
        ),
        migrations.CreateModel(
            name='Property',
            fields=[
                ('task_property', models.OneToOneField(db_column='task_id', on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='property', serialize=False, to='lists.task')),
            ],
            options={
                'db_table': 'properties',
            },
        ),
        migrations.CreateModel(
            name='Reward',
            fields=[
                ('task_reward', models.OneToOneField(db_column='task_id', on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='reward', serialize=False, to='lists.task')),
            ],
            options={
                'db_table': 'rewards',
            },
        ),
        migrations.CreateModel(
            name='TaskList',
            fields=[
                ('list_id', models.AutoField(primary_key=True, serialize=False)),
                ('list_name', models.CharField(blank=True, max_length=255, null=True)),
                ('x_axis', models.FloatField(default=0)),
                ('y_axis', models.FloatField(default=0)),
                ('hidden', models.BooleanField(default=False)),
                ('size_vertical', models.FloatField(default=200)),
                ('size_horizontal', models.FloatField(default=300)),
                ('zindex', models.FloatField(default=500)),
                ('user', models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'task_lists',
            },
        ),
        migrations.AddField(
            model_name='task',
            name='list_task',
            field=models.ForeignKey(db_column='list_id', on_delete=django.db.models.deletion.CASCADE, to='lists.tasklist'),
        ),
    ]
