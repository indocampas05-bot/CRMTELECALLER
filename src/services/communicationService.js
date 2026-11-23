const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://scanning-unused-dash.ngrok-free.dev/api';

const BASE =
  `${API_BASE}/communications`;

const getToken = () =>
  localStorage.getItem('token');

const request = async (
  endpoint,
  options = {}
) => {

  const token =
    getToken();

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response =
    await fetch(
      `${BASE}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

  if (response.status === 401) {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href =
      '/login';

    throw new Error(
      'Session expired. Please login again.'
    );
  }

  if (response.status === 403) {

    throw new Error(
      'You do not have permission to use Communications.'
    );
  }

  if (!response.ok) {

    const error =
      await response
        .json()
        .catch(() => ({}));

    throw new Error(
      error.message ||
      error.error ||
      `API error: ${response.status}`
    );
  }

  return response.json();
};

export const communicationService = {

  getParticipants: () =>
    request('/participants'),

  getMessages: (
    chatId = 'GROUP-ALL'
  ) =>
    request(
      `/messages?chatId=${encodeURIComponent(
        chatId
      )}`
    ),

  sendMessage: (
    data
  ) =>
    request(
      '/messages',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  sendAnnouncement: (
    text
  ) =>
    request(
      '/announcements',
      {
        method: 'POST',
        body: JSON.stringify({
          text,
        }),
      }
    ),

  markRead: (
    id
  ) =>
    request(
      `/messages/${encodeURIComponent(
        id
      )}/read`,
      {
        method: 'PATCH',
      }
    ),

  uploadAttachment: async (
    file
  ) => {

    const token =
      getToken();

    const formData =
      new FormData();

    formData.append(
      'file',
      file
    );

    const response =
      await fetch(
        `${BASE}/attachments`,
        {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
          body: formData,
        }
      );

    if (!response.ok) {

      const error =
        await response
          .json()
          .catch(() => ({}));

      throw new Error(
        error.message ||
        'Attachment upload failed'
      );
    }

    return response.json();
  },

  getMonitorConversations: () =>
    request('/monitor/conversations'),

  getMonitorMessages: (firstUsername, secondUsername) =>
    request(
      `/monitor/messages?firstUsername=${encodeURIComponent(firstUsername)}&secondUsername=${encodeURIComponent(secondUsername)}`
    ),

  attachmentUrl: (
    attachmentId
  ) =>
    `${BASE}/attachments/${encodeURIComponent(
      attachmentId
    )}`,

  // Fetch protected attachment/audio with JWT and return a Blob URL.
  getAttachmentBlobUrl: async (attachmentId, expectedSizeBytes = 0) => {
    if (!attachmentId) {
      throw new Error('Attachment ID is missing');
    }

    const token = getToken();
    let lastError = null;

    // A voice/file download must be complete before it is handed to the
    // audio element. Retry once if the browser receives a short response.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(
          `${BASE}/attachments/${encodeURIComponent(attachmentId)}`,
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true',
              Accept: '*/*',
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            text || `Attachment request failed: ${response.status}`
          );
        }

        const rawBlob = await response.blob();
        const serverType = response.headers.get('Content-Type')?.split(';')[0]?.trim();
        const blob = serverType && rawBlob.type !== serverType
          ? new Blob([rawBlob], { type: serverType })
          : rawBlob;
        const actualSize = blob.size;
        const expected = Number(expectedSizeBytes) || 0;

        if (expected > 0 && actualSize !== expected) {
          throw new Error(
            `Incomplete attachment download (${actualSize} of ${expected} bytes).`
          );
        }

        if (!actualSize) {
          throw new Error('Attachment download returned an empty file.');
        }

        return URL.createObjectURL(blob);
      } catch (err) {
        lastError = err;
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }

    throw lastError || new Error('Unable to load attachment.');
  },

  openAttachment: async (attachmentId) => {
    const url = await communicationService.getAttachmentBlobUrl(attachmentId);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
};

export default communicationService;