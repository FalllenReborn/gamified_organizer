import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskList = () => {
  const [taskLists, setTaskLists] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/tasklists/')
      .then(response => {
        setTaskLists(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the task lists!', error);
      });
  }, []);

  return (
    <div>
      <h1>Task Lists</h1>
      <ul>
        {taskLists.map(taskList => (
          <li key={taskList.id}>{taskList.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;