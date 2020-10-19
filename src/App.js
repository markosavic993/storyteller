import React, {useEffect, useState} from 'react';
import './App.css';
import {API, Storage} from 'aws-amplify';
import {AmplifySignOut, withAuthenticator} from '@aws-amplify/ui-react';
import {listStorys} from './graphql/queries';
import {createStory as createStoryMutation, deleteStory as deleteStoryMutation} from './graphql/mutations';

const initialFormState = { title: '', content: '' }

function App() {
  const [stories, setStories] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchStories();
  }, []);

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    console.log(file);
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchStories();
  }

  async function fetchStories() {
    const apiData = await API.graphql({ query: listStorys });
    let storiesFromApi = apiData.data.listStorys.items;
    await Promise.all(storiesFromApi.map(async story => {
      if (story.image) {
        const image = await Storage.get(story.image);
        story.image = image;
      }
      return story;
    }));
    setStories(storiesFromApi);
  }

  async function createStory() {
    if (!formData.title || !formData.content) return;
    await API.graphql({ query: createStoryMutation, variables: { input: formData } });
    if (formData.image) {
      formData.image = await Storage.get(formData.image);
    }
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
      <input
        type="file"
        onChange={onChange}
      />
      <button onClick={createStory}>Create Story</button>
      <div style={{marginBottom: 30}}>
        {
          stories.map(story => (
            <div key={story.id || story.title}>
              <h2>{story.title}</h2>
              <p>{story.content}</p>
              <button onClick={() => deleteStory(story)}>Delete story</button>
              {
                story.image && <img src={story.image} style={{width: 400}}  alt='' />
              }
            </div>
          ))
        }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
