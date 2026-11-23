const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  'https://crmbackend-5d2o.onrender.com/api'
).replace(/\/+$/, '');

function getAuthToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('jwt') ||
    ''
  );
}

/**
 * Normalize and validate an Indian mobile number.
 * Accepts:
 *   8925897422
 *   +91 89258 97422
 *   91-8925897422
 */
function normalizePhoneNumber(value) {
  if (value === null || value === undefined || value === '') {
    throw new Error('A lead mobile number is required.');
  }

  let digits = String(value).trim().replace(/\D/g, '');

  if (digits.startsWith('0091') && digits.length === 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error(
      `Enter a valid 10-digit Indian mobile number. Received: "${String(value).trim()}".`
    );
  }

  return digits;
}

async function request(path, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();
  let data = {};

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  const looksLikeHtml = /^\s*<(!doctype|html)/i.test(raw);
  if (looksLikeHtml) {
    throw new Error(
      'The CRM server returned a web page instead of data. Check the API URL / ngrok tunnel.'
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Local SIM API request failed (${response.status})`
    );
  }

  return data;
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Initiate an outgoing call through the local SIM bridge.
 */
async function call({
  leadId,
  leadName,
  leadMobile,
  phoneNumber,
  mobile,
  agentUsername,
} = {}) {
  const normalizedNumber = normalizePhoneNumber(
    leadMobile ?? phoneNumber ?? mobile
  );

  return post('/local-sim/calls', {
    action: 'DIAL',
    leadId: leadId ?? null,
    leadName: leadName ?? '',
    leadMobile: normalizedNumber,
    phoneNumber: normalizedNumber,
    mobile: normalizedNumber,
    ...(agentUsername ? { agentUsername } : {}),
  });
}

async function sendAction(requestId, action) {
  if (!requestId) {
    throw new Error('requestId is required.');
  }

  // The backend creates a NEW command for the action and links it to the original call.
  return post('/local-sim/calls', {
    action,
    parentRequestId: requestId,
    requestId,
  });
}

async function answer(requestId) {
  return sendAction(requestId, 'ANSWER');
}

async function reject(requestId) {
  return sendAction(requestId, 'REJECT');
}

async function hangup(requestId) {
  return sendAction(requestId, 'HANGUP');
}

// In-call controls. Each one creates a command that the Windows companion sends to the phone.
// Response = the parent call snapshot + followUpRequestId (the id of the control command).
async function hold(requestId) {
  return sendAction(requestId, 'HOLD');
}

async function resume(requestId) {
  return sendAction(requestId, 'RESUME');
}

async function mute(requestId) {
  return sendAction(requestId, 'MUTE');
}

async function unmute(requestId) {
  return sendAction(requestId, 'UNMUTE');
}

/**
 * Wait until the phone has confirmed (or rejected) a control command.
 * Resolves { ok: true } on COMPLETED, { ok: false, message } on FAILED / CANCELLED / timeout.
 */
async function waitForAction(controlRequestId, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 500));
    let cmd;
    try {
      cmd = await getCall(controlRequestId);
    } catch (error) {
      return { ok: false, message: error.message || 'Lost contact with the CRM server.' };
    }
    const st = String(cmd?.status || '').toUpperCase();
    if (st === 'COMPLETED') return { ok: true, message: cmd.message || '' };
    if (['FAILED', 'CANCELLED', 'REJECTED', 'BUSY', 'NO_ANSWER'].includes(st)) {
      return { ok: false, message: cmd.message || 'The phone did not accept the command.' };
    }
  }
  return { ok: false, message: 'The phone did not confirm in time. Check the Windows companion and the phone.' };
}

async function getCall(requestId) {
  if (!requestId) {
    throw new Error('requestId is required.');
  }

  return request(
    `/local-sim/calls/${encodeURIComponent(requestId)}`
  );
}

async function updateStatus(requestId, status, message = '') {
  if (!requestId) {
    throw new Error('requestId is required.');
  }

  return post(
    `/local-sim/calls/${encodeURIComponent(requestId)}/status`,
    {
      status,
      message,
    }
  );
}

/**
 * Is MY Windows companion online, and is my phone connected to it?
 * -> { state: 'READY' | 'PHONE_NOT_CONNECTED' | 'OFFLINE', online, bluetoothConnected, message }
 */
async function companionStatus() {
  return request('/local-sim/calls/companion-status');
}

const localSimCallService = {
  companionStatus,
  call,
  answer,
  reject,
  hangup,
  hold,
  resume,
  mute,
  unmute,
  waitForAction,
  getCall,
  updateStatus,
};

export { localSimCallService };
export default localSimCallService;
