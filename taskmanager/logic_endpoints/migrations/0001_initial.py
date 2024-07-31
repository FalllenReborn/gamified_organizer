# Generated by Django 4.2.13 on 2024-07-20 19:43

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
            name='Bar',
            fields=[
                ('bar_id', models.AutoField(primary_key=True, serialize=False)),
                ('bar_name', models.CharField(blank=True, max_length=255, null=True)),
                ('xp_name', models.CharField(blank=True, max_length=255, null=True)),
                ('x_axis', models.FloatField(default=0)),
                ('y_axis', models.FloatField(default=0)),
                ('size_vertical', models.FloatField(default=125)),
                ('size_horizontal', models.FloatField(default=300)),
                ('total_points', models.IntegerField(default=0)),
                ('full_cycle', models.IntegerField(default=200)),
                ('hidden', models.BooleanField(default=False)),
            ],
            options={
                'db_table': 'bars',
            },
        ),
        migrations.CreateModel(
            name='Currency',
            fields=[
                ('currency_id', models.AutoField(primary_key=True, serialize=False)),
                ('currency_name', models.CharField(max_length=255)),
                ('owned', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
            ],
            options={
                'db_table': 'currencies',
            },
        ),
        migrations.CreateModel(
            name='Item',
            fields=[
                ('item_id', models.AutoField(primary_key=True, serialize=False)),
                ('item_name', models.CharField(max_length=255)),
                ('storage', models.PositiveIntegerField(default=0)),
            ],
            options={
                'db_table': 'items',
            },
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('task_id', models.AutoField(primary_key=True, serialize=False)),
                ('task_name', models.CharField(max_length=255)),
                ('created_date_time', models.DateTimeField(auto_now_add=True)),
                ('nested_id', models.IntegerField(blank=True, null=True)),
                ('expanded', models.BooleanField(default=False)),
            ],
            options={
                'db_table': 'tasks',
            },
        ),
        migrations.CreateModel(
            name='Property',
            fields=[
                ('task_property', models.OneToOneField(db_column='task_id', on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='property', serialize=False, to='logic_endpoints.task')),
            ],
            options={
                'db_table': 'properties',
            },
        ),
        migrations.CreateModel(
            name='Voucher',
            fields=[
                ('voucher_id', models.AutoField(primary_key=True, serialize=False)),
                ('quantity', models.PositiveIntegerField()),
                ('bar', models.ForeignKey(blank=True, db_column='bar_id', null=True, on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.bar')),
                ('item', models.ForeignKey(db_column='item_id', on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.item')),
                ('task', models.ForeignKey(blank=True, db_column='task_id', null=True, on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.task')),
            ],
            options={
                'db_table': 'vouchers',
            },
        ),
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('transaction_id', models.AutoField(primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('bar', models.ForeignKey(blank=True, db_column='bar_id', null=True, on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.bar')),
                ('currency', models.ForeignKey(db_column='currency_id', on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.currency')),
                ('task', models.ForeignKey(blank=True, db_column='task_id', null=True, on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.task')),
            ],
            options={
                'db_table': 'transactions',
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
                ('detail_view', models.BooleanField(default=True)),
                ('user', models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'task_lists',
            },
        ),
        migrations.AddField(
            model_name='task',
            name='list_task',
            field=models.ForeignKey(db_column='list_id', on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.tasklist'),
        ),
        migrations.CreateModel(
            name='Reward',
            fields=[
                ('reward_id', models.AutoField(primary_key=True, serialize=False)),
                ('points', models.IntegerField(default=10)),
                ('bar', models.ForeignKey(db_column='bar_id', on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.bar')),
                ('task', models.ForeignKey(db_column='task_id', on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.task')),
            ],
            options={
                'db_table': 'rewards',
            },
        ),
        migrations.CreateModel(
            name='Layer',
            fields=[
                ('layer_id', models.AutoField(primary_key=True, serialize=False)),
                ('layer', models.IntegerField(unique=True)),
                ('bar', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='layer', to='logic_endpoints.bar')),
                ('list', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='layer', to='logic_endpoints.tasklist')),
            ],
            options={
                'db_table': 'layers',
            },
        ),
    ]