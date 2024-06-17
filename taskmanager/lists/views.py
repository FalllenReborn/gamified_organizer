from rest_framework import viewsets, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import TaskList, Task
from .serializers import TaskListSerializer, TaskSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from django.http import JsonResponse
from django.utils import timezone


class TaskListViewSet(viewsets.ModelViewSet):
    queryset = TaskList.objects.all()
    serializer_class = TaskListSerializer

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


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        window_id = self.request.query_params.get('window_id')
        if window_id:
            queryset = Task.objects.filter(list_task_id=window_id)
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
