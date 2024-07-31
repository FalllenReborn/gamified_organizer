# Generated by Django 4.2.13 on 2024-07-23 10:25

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('logic_endpoints', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Shop',
            fields=[
                ('shop_id', models.AutoField(primary_key=True, serialize=False)),
                ('shop_name', models.CharField(max_length=255)),
                ('x_axis', models.FloatField(default=0)),
                ('y_axis', models.FloatField(default=0)),
                ('size_vertical', models.FloatField(default=300)),
                ('size_horizontal', models.FloatField(default=300)),
                ('hidden', models.BooleanField(default=False)),
            ],
            options={
                'db_table': 'shops',
            },
        ),
        migrations.CreateModel(
            name='Price',
            fields=[
                ('price_id', models.AutoField(primary_key=True, serialize=False)),
                ('cost', models.PositiveIntegerField()),
                ('currency', models.ForeignKey(db_column='currency_id', on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.currency')),
                ('item', models.ForeignKey(db_column='item_id', on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.item')),
                ('shop', models.ForeignKey(db_column='shop_id', on_delete=django.db.models.deletion.CASCADE, to='logic_endpoints.shop')),
            ],
            options={
                'db_table': 'prices',
            },
        ),
    ]