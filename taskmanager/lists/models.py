from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import pre_delete
from django.dispatch import receiver


class Layer(models.Model):
    layer_id = models.AutoField(primary_key=True)
    layer = models.IntegerField(unique=True)
    foreign_id = models.IntegerField()
    foreign_table = models.SmallIntegerField()

    class Meta:
        db_table = 'layers'


class TaskList(models.Model):
    list_id = models.AutoField(primary_key=True)
    list_name = models.CharField(max_length=255, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=1)
    x_axis = models.FloatField(default=0)
    y_axis = models.FloatField(default=0)
    hidden = models.BooleanField(default=False)
    size_vertical = models.FloatField(default=200)
    size_horizontal = models.FloatField(default=300)
    detail_view = models.BooleanField(default=True)

    def __str__(self):
        return self.list_name or f"List {self.list_id}"

    class Meta:
        db_table = 'task_lists'


class Bar(models.Model):
    bar_id = models.AutoField(primary_key=True)
    bar_name = models.CharField(max_length=255, null=True, blank=True)
    xp_name = models.CharField(max_length=255, null=True, blank=True)
    x_axis = models.FloatField(default=0)
    y_axis = models.FloatField(default=0)
    size_vertical = models.FloatField(default=125)
    size_horizontal = models.FloatField(default=300)
    total_points = models.IntegerField(default=0)
    full_cycle = models.IntegerField(default=200)
    hidden = models.BooleanField(default=False)

    def __str__(self):
        return self.bar_name if self.bar_name else f'Bar {self.bar_id}'

    class Meta:
        db_table = 'bars'


class Shop(models.Model):
    shop_id = models.AutoField(primary_key=True)
    shop_name = models.CharField(max_length=255)
    x_axis = models.FloatField(default=0)
    y_axis = models.FloatField(default=0)
    size_vertical = models.FloatField(default=300)
    size_horizontal = models.FloatField(default=300)
    hidden = models.BooleanField(default=False)

    def __str__(self):
        return self.shop_name

    class Meta:
        db_table = 'shops'


class Task(models.Model):
    task_id = models.AutoField(primary_key=True)
    list_task = models.ForeignKey(TaskList, on_delete=models.CASCADE, db_column='list_id', null=True, blank=True)
    task_name = models.CharField(max_length=255)
    created_date_time = models.DateTimeField(auto_now_add=True)
    nested_id = models.IntegerField(null=True, blank=True)
    expanded = models.BooleanField(default=False)

    def __str__(self):
        return self.task_name

    class Meta:
        db_table = 'tasks'


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


class Currency(models.Model):
    currency_id = models.AutoField(primary_key=True)
    currency_name = models.CharField(max_length=255)
    owned = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.currency_name

    class Meta:
        db_table = 'currencies'


class Transaction(models.Model):
    transaction_id = models.AutoField(primary_key=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True, db_column='task_id')
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, null=True, blank=True, db_column='bar_id')
    currency = models.ForeignKey(Currency, on_delete=models.CASCADE, db_column='currency_id')
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if (self.task is None and self.bar is None) or (self.task is not None and self.bar is not None):
            raise ValueError('Either task or bar must be set, but not both.')
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Transaction {self.transaction_id}'

    class Meta:
        db_table = 'transactions'


class Item(models.Model):
    item_id = models.AutoField(primary_key=True)
    item_name = models.CharField(max_length=255)
    storage = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.item_name

    class Meta:
        db_table = 'items'


class Voucher(models.Model):
    voucher_id = models.AutoField(primary_key=True)
    task = models.ForeignKey('Task', on_delete=models.CASCADE, null=True, blank=True, db_column='task_id')
    bar = models.ForeignKey('Bar', on_delete=models.CASCADE, null=True, blank=True, db_column='bar_id')
    item = models.ForeignKey('Item', on_delete=models.CASCADE, db_column='item_id')
    quantity = models.PositiveIntegerField()

    def save(self, *args, **kwargs):
        if (self.task is None and self.bar is None) or (self.task is not None and self.bar is not None):
            raise ValueError('Either task or bar must be set, but not both.')
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Voucher {self.voucher_id}'

    class Meta:
        db_table = 'vouchers'


class Price(models.Model):
    price_id = models.AutoField(primary_key=True)
    currency = models.ForeignKey(Currency, on_delete=models.CASCADE, db_column='currency_id')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, db_column='item_id')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, db_column='shop_id')
    cost = models.PositiveIntegerField()

    def __str__(self):
        return f'Price {self.price_id}: {self.cost}'

    class Meta:
        db_table = 'prices'


@receiver(pre_delete, sender=Task)
def handle_task_deletion(sender, instance, **kwargs):
    transactions = Transaction.objects.filter(task_id=instance.task_id)
    for trans in transactions:
        Currency.objects.filter(currency_id=trans.currency_id).update(owned=models.F('owned') + trans.amount)
        trans.delete()

    vouchers = Voucher.objects.filter(task_id=instance.task_id)
    for vouch in vouchers:
        Item.objects.filter(item_id=vouch.item_id).update(storage=models.F('storage') + vouch.quantity)
        vouch.delete()
