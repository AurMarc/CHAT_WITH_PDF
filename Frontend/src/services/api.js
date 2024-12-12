const API_URL = 'http://localhost:8000';

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/upload/`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};

export const askQuestion = async (documentId, question) => {
  try {
    const response = await fetch(`${API_URL}/ask/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
};

export const getDocuments = async () => {
  try {
    const response = await fetch(`${API_URL}/documents/`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};


