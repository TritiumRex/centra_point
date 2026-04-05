import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function Instances() {
  const { id } = useParams();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/things/${id}/instances/`)
        .then((res) => setInstances(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Instances</h1>
      <p>Manage instances of this Thing.</p>
      {instances.length === 0 ? (
        <p className="text-gray-500 mt-4">No instances yet.</p>
      ) : (
        <ul className="mt-4">
          {instances.map((instance) => (
            <li key={instance.id} className="border p-4 rounded mb-2">
              {JSON.stringify(instance.data)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
