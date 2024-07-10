from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import TaskList, Task, Reward, Bar, Currency, Transaction, Layer
from .serializers import (TaskListSerializer, TaskSerializer, RewardSerializer,
                          BarSerializer, CurrencySerializer, TransactionSerializer, LayerSerializer)
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
        bar_id = request.data.get('bar_id')
        list_id = request.data.get('list_id')

        if not bar_id and not list_id:
            return Response({'error': 'Either bar_id or list_id must be provided'}, status=400)

        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    cursor.callproc('move_to_highest', [bar_id, list_id])
            return Response({'message': 'Layer moved to highest successfully'}, status=200)
        except Exception as e:
            logger.error(f"Error occurred in move_to_highest: {str(e)}", exc_info=True)
            return Response({'error': str(e)}, status=500)


class TaskListViewSet(viewsets.ModelViewSet):
    queryset = TaskList.objects.all()
    serializer_class = TaskListSerializer

    def create(self, request, *args, **kwargs):
        print(request.data)  # Log the incoming data
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        return TaskList.objects.all().select_related('layer')

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
        return Bar.objects.all().select_related('layer')

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


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        window_id = self.request.query_params.get('window_id')
        if window_id:
            queryset = Task.objects.filter(list_task_id=window_id).order_by('created_date_time')
        else:
            queryset = super().get_queryset()
        return queryset

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='create_task')
    def create_task(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            list_id = data.get('list_id')
            task_name = data.get('task_name')
            nested_id = data.get('nested_id')

            if not list_id or not task_name:
                return JsonResponse({'error': 'list_id and task_name are required'}, status=400)

            task = Task.objects.create(
                list_task_id=list_id,
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

            if not currency_name:
                return JsonResponse({'error': 'currency_name is required'}, status=400)

            currency = Currency.objects.create(
                currency_name=currency_name,
                owned=owned
            )
            serializer = CurrencySerializer(currency)
            return JsonResponse(serializer.data, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


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
