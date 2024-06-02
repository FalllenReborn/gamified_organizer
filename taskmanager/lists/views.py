from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import TaskList
from .serializers import TaskListSerializer
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json


class TaskListViewSet(viewsets.ModelViewSet):
    queryset = TaskList.objects.all()
    serializer_class = TaskListSerializer

    @action(detail=False, methods=['GET'])
    def visible_lists(self, request):
        visible_lists = TaskList.objects.filter(hidden=False)
        serializer = self.get_serializer(visible_lists, many=True)
        return Response(serializer.data)


@csrf_exempt
def update_task_list_name(request, list_id):
    if request.method == 'PUT' or request.method == 'PATCH':
        try:
            task_list = TaskList.objects.get(list_id=list_id)
            data = json.loads(request.body.decode('utf-8'))

            if 'list_name' in data:
                task_list.list_name = data['list_name']

            if request.method == 'PUT':
                # If PUT, update all required fields
                task_list.size_horizontal = data.get('size_horizontal', task_list.size_horizontal)
                task_list.size_vertical = data.get('size_vertical', task_list.size_vertical)
                task_list.x_axis = data.get('x_axis', task_list.x_axis)
                task_list.y_axis = data.get('y_axis', task_list.y_axis)
            # Save the updated task list
            task_list.save()
            return JsonResponse({'message': 'List updated successfully'})

        except TaskList.DoesNotExist:
            return JsonResponse({'error': 'Task list not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Invalid method'}, status=405)
