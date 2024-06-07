from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import TaskList
from .serializers import TaskListSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from django.http import JsonResponse


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
