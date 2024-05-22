import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Task = ({ taskListId }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:8000/api/tasks/?list=${taskListId}`)
      .then(response => {
        setTasks(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the tasks!', error);
      });
  }, [taskListId]);

  return (
    <div>
      <h2>Tasks</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>{task.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Task;