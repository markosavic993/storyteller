import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listStorys } from './graphql/queries';
import { createStory as createStoryMutation, deleteStory as deleteStoryMutation } from './graphql/mutations';

const initialFormState = { title: '', content: '' }

function App() {
  const [stories, setStories] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    const apiData = await API.graphql({ query: listStorys });
    setStories(apiData.data.listStorys.items);
  }

  async function createStory() {
    if (!formData.title || !formData.content) return;
    await API.graphql({ query: createStoryMutation, variables: { input: formData } });
    setStories([ ...stories, formData ]);
    setFormData(initialFormState);
  }

  async function deleteStory({ id }) {
    const newNotesArray = stories.filter(note => note.id !== id);
    setStories(newNotesArray);
    await API.graphql({ query: deleteStoryMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <h1>Storyteller</h1>
      <input
        onChange={e => setFormData({ ...formData, 'title': e.target.value})}
        placeholder="Story title"
        value={formData.title}
      />
      <input
        onChange={e => setFormData({ ...formData, 'content': e.target.value})}
        placeholder="Story content"
        value={formData.content}
      />
      <button onClick={createStory}>Create Note</button>
      <div style={{marginBottom: 30}}>
        {
          stories.map(note => (
            <div key={note.id || note.title}>
              <h2>{note.title}</h2>
              <p>{note.content}</p>
              <button onClick={() => deleteStory(note)}>Delete story</button>
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
