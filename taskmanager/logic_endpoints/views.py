from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import TaskList, Task, Reward, Bar, Currency, Transaction, Layer, Item, Voucher, Shop, Price
from .serializers import (TaskListSerializer, TaskSerializer, RewardSerializer,
                          BarSerializer, CurrencySerializer, TransactionSerializer,
                          LayerSerializer, ItemSerializer, VoucherSerializer, ShopSerializer, PriceSerializer)
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from django.http import JsonResponse
from django.utils import timezone
from django.db import connection, transaction
import logging

logger = logging.getLogger(__name__)


class LayerViewSet(viewsets.ModelViewSet):
    queryset = Layer.objects.all()
    serializer_class = LayerSerializer

    @action(detail=False, methods=['post'], url_path='move_to_highest')
    def move_to_highest(self, request):
        # Retrieve data from the request
        foreign_id = request.data.get('foreign_id')
        foreign_table = request.data.get('foreign_table')

        # Validate if the required parameters are provided
        if foreign_id is None or foreign_table is None:
            return Response({'error': 'foreign_id and foreign_table must be provided'}, status=400)

        try:
            # Convert the values to integers
            foreign_id = int(foreign_id)
            foreign_table = int(foreign_table)

            # Perform the database operation
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.execute('SELECT * FROM move_to_higher(%s::integer, %s::smallint)',
                                   [foreign_id, foreign_table])

            return Response({'message': 'Layer moved to highest successfully'}, status=200)

        except ValueError as ve:
            # Handle case where conversion to integer fails
            logger.error(f"ValueError occurred in move_to_highest: {str(ve)}", exc_info=True)
            return Response({'error': 'Invalid value provided for foreign_id or foreign_table'}, status=400)

        except Exception as e:
            # General exception handling
            logger.error(f"Error occurred in move_to_highest: {str(e)}", exc_info=True)
            return Response({'error': 'Internal server error'}, status=500)


class TaskListViewSet(viewsets.ModelViewSet):
    queryset = TaskList.objects.all()
    serializer_class = TaskListSerializer

    def create(self, request, *args, **kwargs):
        print(request.data)  # Log the incoming data
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        return TaskList.objects.all().select_related()

    @action(detail=False, methods=['GET'])
    def visible_lists(self, request):
        visible_lists = TaskList.objects.filter(hidden=False)
        serializer = self.get_serializer(visible_lists, many=True)
        return Response(serializer.data)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['put'], url_path='update_name')
    def update_task_list_name(self, request, pk=None):
        try:
            task_list = self.get_object()
            data = json.loads(request.body.decode('utf-8'))

            if 'list_name' in data:
                task_list.list_name = data['list_name']
                task_list.save()
                return JsonResponse({'message': 'List updated successfully', 'list_name': task_list.list_name})

            return JsonResponse({'error': 'list_name not provided'}, status=400)
        except TaskList.DoesNotExist:
            return JsonResponse({'error': 'Task list not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    @action(detail=True, methods=['put'], url_path='update_lists')
    def update_position(self, request, pk=None):
        tasklist = self.get_object()
        serializer = TaskListSerializer(tasklist, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class BarViewSet(viewsets.ModelViewSet):
    queryset = Bar.objects.all()
    serializer_class = BarSerializer

    def get_queryset(self):
        return Bar.objects.all().select_related()

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['put'], url_path='update_name')
    def update_bar_name(self, request, pk=None):
        try:
            bar = self.get_object()
            data = json.loads(request.body.decode('utf-8'))

            if 'bar_name' in data:
                bar.bar_name = data['bar_name']
                bar.save()
                return JsonResponse({'message': 'Bar updated successfully', 'bar_name': bar.bar_name})

            return JsonResponse({'error': 'bar_name not provided'}, status=400)
        except Bar.DoesNotExist:
            return JsonResponse({'error': 'Bar not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    @action(detail=True, methods=['put'], url_path='update_bar')
    def update_bar(self, request, pk=None):
        bar = self.get_object()
        serializer = BarSerializer(bar, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_bar')
    def create_bar(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            bar_name = data.get('bar_name')
            xp_name = data.get('xp_name')
            full_cycle = data.get('full_cycle')

            if full_cycle is None:
                return JsonResponse({'error': 'full_cycle is required'}, status=400)

            bar = Bar.objects.create(
                bar_name=bar_name,
                xp_name=xp_name,
                full_cycle=full_cycle
            )
            serializer = BarSerializer(bar)
            return JsonResponse(serializer.data, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer

    def get_queryset(self):
        return Shop.objects.all().select_related()

    @action(detail=True, methods=['put'], url_path='update_shop')
    def update_shop(self, request, pk=None):
        shop = self.get_object()
        serializer = ShopSerializer(shop, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_shop')
    def create_shop(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            shop_name = data.get('shop_name')
            description = data.get('description')

            if not shop_name:
                return JsonResponse({'error': 'shop_name is required'}, status=400)

            shop = Shop.objects.create(
                shop_name=shop_name,
                description=description
            )
            serializer = ShopSerializer(shop)
            return JsonResponse(serializer.data, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        return super().get_queryset()

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_task')
    def create_task(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            list_id = data.get('list_id')
            task_name = data.get('task_name')
            nested_id = data.get('nested_id')

            if not task_name:
                return JsonResponse({'error': 'task_name is required'}, status=400)

            # Allow list_id to be None
            task = Task.objects.create(
                list_task_id=list_id if list_id != 'null' else None,
                task_name=task_name,
                created_date_time=timezone.now(),
                nested_id=nested_id
            )
            serializer = TaskSerializer(task)
            return JsonResponse(serializer.data, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    @action(detail=True, methods=['patch'], url_path='update_task')
    def update_task(self, request, pk=None):
        try:
            task = self.get_object()
            serializer = TaskSerializer(task, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=200)
            return Response(serializer.errors, status=400)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

    @action(detail=True, methods=['post'], url_path='complete_task')
    def complete_task(self, request, pk=None):
        try:
            task = self.get_object()
            with connection.cursor() as cursor:
                cursor.execute("SELECT handle_task_completion(%s);", [task.task_id])
            return JsonResponse({'status': 'Task completed and moved to history.'}, status=200)
        except Task.DoesNotExist:
            return JsonResponse({'error': 'Task not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class RewardViewSet(viewsets.ModelViewSet):
    queryset = Reward.objects.all()
    serializer_class = RewardSerializer

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_reward')
    def create_reward(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            task_id = data.get('task_id')
            bar_id = data.get('bar_id')
            points = data.get('points', 10)  # Default points to 10 if not provided

            if not task_id or not bar_id:
                return JsonResponse({'error': 'task_id and bar_id are required'}, status=400)

            task = Task.objects.get(task_id=task_id)
            bar = Bar.objects.get(bar_id=bar_id)

            reward = Reward.objects.create(
                task=task,
                bar=bar,
                points=points
            )
            serializer = RewardSerializer(reward)
            return JsonResponse(serializer.data, status=201)

        except Task.DoesNotExist:
            return JsonResponse({'error': 'Task not found'}, status=404)
        except Bar.DoesNotExist:
            return JsonResponse({'error': 'Bar not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['patch'], url_path='')
    def update_reward(self, request, pk=None):
        try:
            reward = self.get_object()
            serializer = RewardSerializer(reward, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(serializer.data, status=200)
            return JsonResponse(serializer.errors, status=400)
        except Reward.DoesNotExist:
            return JsonResponse({'error': 'Reward not found'}, status=404)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['delete'], url_path='')
    def delete_reward(self, request, pk=None):
        try:
            reward = self.get_object()
            reward.delete()
            return JsonResponse({'message': 'Reward deleted'}, status=204)
        except Reward.DoesNotExist:
            return JsonResponse({'error': 'Reward not found'}, status=404)

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['get'], url_path='by_task')
    def get_rewards_by_task(self, request):
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({'error': 'task_id is required'}, status=400)

        rewards = Reward.objects.filter(task_id=task_id)
        serializer = RewardSerializer(rewards, many=True)
        return Response(serializer.data, status=200)


class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_currency')
    def create_currency(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            currency_name = data.get('currency_name')
            owned = data.get('owned', 0)
            exchange_rate = data.get('exchange_rate', 1)
            exchange_loss = data.get('exchange_loss', 0.1)

            if not currency_name:
                return Response({'error': 'currency_name is required'}, status=400)

            currency = Currency.objects.create(
                currency_name=currency_name,
                owned=owned,
                exchange_rate=exchange_rate,
                exchange_loss=exchange_loss
            )
            serializer = CurrencySerializer(currency)
            return Response(serializer.data, status=201)

        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='update_balances')
    def update_balances(self, request):
        try:
            data = request.data
            for currency_id, new_balance in data.items():
                try:
                    currency = Currency.objects.get(pk=currency_id)
                    currency.owned = new_balance
                    currency.save()
                except Currency.DoesNotExist:
                    return JsonResponse({'error': f'Currency with id {currency_id} does not exist'}, status=400)

            return JsonResponse({'status': 'success'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='exchange_currency')
    def exchange_currency(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            from_currency_id = data.get('from_currency')
            to_currency_id = data.get('to_currency')
            amount = float(data.get('amount'))

            if amount <= 0:
                return Response({'error': 'Amount must be greater than 0'}, status=400)

            with connection.cursor() as cursor:
                cursor.execute("SELECT exchange_rate FROM currencies WHERE currency_id = %s", [from_currency_id])
                from_currency_exchange_rate = cursor.fetchone()

                cursor.execute("SELECT exchange_rate FROM currencies WHERE currency_id = %s", [to_currency_id])
                to_currency_exchange_rate = cursor.fetchone()

                if not from_currency_exchange_rate or not to_currency_exchange_rate:
                    return Response({'error': 'Invalid currency ID'}, status=400)

                cursor.callproc('exchange_currency', [from_currency_id, to_currency_id, amount])

            return Response({'success': 'Currency exchanged successfully'}, status=200)

        except Currency.DoesNotExist:
            return Response({'error': 'Currency not found'}, status=404)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_transaction')
    def create_transaction(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            task_id = data.get('task_id')
            bar_id = data.get('bar_id')
            currency_id = data.get('currency_id')
            amount = data.get('amount')

            if not currency_id or not amount:
                return JsonResponse({'error': 'currency_id and amount are required'}, status=400)
            if task_id and bar_id:
                return JsonResponse({'error': 'Only one of task_id or bar_id should be provided'}, status=400)
            if not task_id and not bar_id:
                return JsonResponse({'error': 'Either task_id or bar_id must be provided'}, status=400)

            currency = Currency.objects.get(currency_id=currency_id)

            transaction = Transaction.objects.create(
                task_id=task_id,
                bar_id=bar_id,
                currency=currency,
                amount=amount
            )
            serializer = TransactionSerializer(transaction)
            return JsonResponse(serializer.data, status=201)

        except Currency.DoesNotExist:
            return JsonResponse({'error': 'Currency not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['patch'], url_path='')
    def update_transaction(self, request, pk=None):
        try:
            transaction = self.get_object()
            serializer = TransactionSerializer(transaction, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(serializer.data, status=200)
            return JsonResponse(serializer.errors, status=400)
        except Transaction.DoesNotExist:
            return JsonResponse({'error': 'Transaction not found'}, status=404)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['delete'], url_path='')
    def delete_transaction(self, request, pk=None):
        try:
            transaction = self.get_object()
            transaction.delete()
            return JsonResponse({'message': 'Transaction deleted'}, status=204)
        except Transaction.DoesNotExist:
            return JsonResponse({'error': 'Transaction not found'}, status=404)


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_item')
    def create_item(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            item_name = data.get('item_name')
            storage = data.get('storage', 0)

            if not item_name:
                return JsonResponse({'error': 'item_name is required'}, status=400)

            item = Item.objects.create(
                item_name=item_name,
                storage=storage
            )
            serializer = ItemSerializer(item)
            return JsonResponse(serializer.data, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='update_storage')
    def update_storage(self, request):
        try:
            data = request.data
            for item_id, storage_update in data.items():
                try:
                    item = Item.objects.get(pk=item_id)
                    item.storage += storage_update  # Add the purchased amount to the current storage
                    item.save()
                except Item.DoesNotExist:
                    return JsonResponse({'error': f'Item with id {item_id} does not exist'}, status=400)

            return JsonResponse({'status': 'success'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'], url_path='use_item')
    def use_item(self, request, pk=None):
        try:
            item_id = pk
            use_note = request.data.get('use_note', '')
            use_quantity = request.data.get('use_quantity', 1)

            with connection.cursor() as cursor:
                cursor.execute("SELECT use_item(%s, %s, %s);", [item_id, use_note, use_quantity])

            return JsonResponse({'status': 'Item used successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all()
    serializer_class = VoucherSerializer

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_voucher')
    def create_voucher(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            task_id = data.get('task_id')
            bar_id = data.get('bar_id')
            item_id = data.get('item_id')
            quantity = data.get('quantity')

            if not item_id or not quantity:
                return JsonResponse({'error': 'item_id and quantity are required'}, status=400)
            if task_id and bar_id:
                return JsonResponse({'error': 'Only one of task_id or bar_id should be provided'}, status=400)
            if not task_id and not bar_id:
                return JsonResponse({'error': 'Either task_id or bar_id must be provided'}, status=400)

            item = Item.objects.get(item_id=item_id)

            voucher = Voucher.objects.create(
                task_id=task_id,
                bar_id=bar_id,
                item=item,
                quantity=quantity
            )
            serializer = VoucherSerializer(voucher)
            return JsonResponse(serializer.data, status=201)

        except Item.DoesNotExist:
            return JsonResponse({'error': 'Item not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['patch'], url_path='')
    def update_voucher(self, request, pk=None):
        try:
            voucher = self.get_object()
            serializer = VoucherSerializer(voucher, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(serializer.data, status=200)
            return JsonResponse(serializer.errors, status=400)
        except Voucher.DoesNotExist:
            return JsonResponse({'error': 'Voucher not found'}, status=404)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['delete'], url_path='')
    def delete_voucher(self, request, pk=None):
        try:
            voucher = self.get_object()
            voucher.delete()
            return JsonResponse({'message': 'Voucher deleted'}, status=204)
        except Voucher.DoesNotExist:
            return JsonResponse({'error': 'Voucher not found'}, status=404)


class PriceViewSet(viewsets.ModelViewSet):
    queryset = Price.objects.all()
    serializer_class = PriceSerializer

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_price')
    def create_price(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            print('Incoming Data:', data)  # Debug print

            item_id = data.get('item_id')
            shop_id = data.get('shop_id')
            currency_id = data.get('currency_id')
            cost = data.get('cost')  # Using cost instead of amount

            if not item_id or not shop_id or not currency_id or not cost:
                return JsonResponse({'error': 'item_id, shop_id, currency_id, and cost are required'}, status=400)

            item = Item.objects.get(item_id=item_id)
            shop = Shop.objects.get(shop_id=shop_id)
            currency = Currency.objects.get(currency_id=currency_id)

            price = Price.objects.create(
                item=item,
                shop=shop,
                currency=currency,
                cost=cost  # Using cost instead of amount
            )
            serializer = PriceSerializer(price)
            return JsonResponse(serializer.data, status=201)

        except Item.DoesNotExist:
            return JsonResponse({'error': 'Item not found'}, status=404)
        except Shop.DoesNotExist:
            return JsonResponse({'error': 'Shop not found'}, status=404)
        except Currency.DoesNotExist:
            return JsonResponse({'error': 'Currency not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    @method_decorator(csrf_exempt)
    @action(detail=True, methods=['patch'], url_path='update_price')
    def update_price(self, request, pk=None):
        try:
            data = json.loads(request.body.decode('utf-8'))
            print('Incoming Data:', data)  # Debug print

            price = Price.objects.get(pk=pk)

            item_id = data.get('item_id')
            shop_id = data.get('shop_id')
            currency_id = data.get('currency_id')
            cost = data.get('cost')  # Using cost instead of amount

            if item_id:
                price.item = Item.objects.get(item_id=item_id)
            if shop_id:
                price.shop = Shop.objects.get(shop_id=shop_id)
            if currency_id:
                price.currency = Currency.objects.get(currency_id=currency_id)
            if cost is not None:
                price.cost = cost

            price.save()
            serializer = PriceSerializer(price)
            return JsonResponse(serializer.data, status=200)

        except Price.DoesNotExist:
            return JsonResponse({'error': 'Price not found'}, status=404)
        except Item.DoesNotExist:
            return JsonResponse({'error': 'Item not found'}, status=404)
        except Shop.DoesNotExist:
            return JsonResponse({'error': 'Shop not found'}, status=404)
        except Currency.DoesNotExist:
            return JsonResponse({'error': 'Currency not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
