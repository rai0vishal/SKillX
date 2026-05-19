import { API_BASE_URL as BASE } from '../config/api.js';
const API_BASE_URL = `${BASE}/api/roadmap`;

export const generateRoadmapAPI = async (email, goal) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, goal }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate roadmap');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const saveRoadmapAPI = async (email, goal, generatedRoadmap) => {
  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, goal, generatedRoadmap }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save roadmap');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchUserRoadmapsAPI = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user?email=${encodeURIComponent(email)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch roadmaps');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const updateProgressAPI = async (id, weekIndex) => {
  try {
    const response = await fetch(`${API_BASE_URL}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, weekIndex }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update progress');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const deleteRoadmapAPI = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete roadmap');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
