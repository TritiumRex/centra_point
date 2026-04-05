import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Things() {
  const [things, setThings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/things/')
      .then((res) => setThings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Things</h1>
      <p>Manage your custom entity types here.</p>
      {things.length === 0 ? (
        <p className="text-gray-500 mt-4">No things yet. Create your first Thing!</p>
      ) : (
        <ul className="mt-4">
          {things.map((thing) => (
            <li key={thing.id} className="border p-4 rounded mb-2">
              {thing.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
