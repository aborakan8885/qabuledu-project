import { BeneficiaryInquiry, SurveyResponse } from '../types';
import { saveInquiriesToStorage, saveSurveysToStorage } from './storageEngine';

// =========================================================================
// REAL-TIME AUDIO NOTIFICATION ENGINE (Web Audio API Synthesizer)
// =========================================================================
export function playNotificationChime(type: 'inquiry' | 'survey' | 'success' = 'inquiry') {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'inquiry') {
      // Pleasant high double chime (E5 -> A5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'survey') {
      // Warm chord chime (C5 -> G5)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (_) {
    // Audio output might be restricted if no user interaction yet, safe to ignore
  }
}

// =========================================================================
// CROSS-TAB BROADCAST CHANNEL
// =========================================================================
const CHANNEL_NAME = 'moe_portal_realtime_channel';
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (_) {
  broadcastChannel = null;
}

export function broadcastLocalEvent(type: string, data: any) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
    } catch (_) {}
  }
}

// =========================================================================
// REAL-TIME API DISPATCH METHODS (INSTANT SERVER STORAGE & NOTIFICATION)
// =========================================================================

/**
 * Submit inquiry instantly to server without waiting for debounced timers
 */
export async function submitInquiryRealtime(
  inquiryData: Omit<BeneficiaryInquiry, 'id' | 'createdAt' | 'status'> & { id?: string }
): Promise<BeneficiaryInquiry> {
  const localId = inquiryData.id || `inq-${Date.now()}`;
  const nowStr = new Date().toISOString();
  const fallbackInquiry: BeneficiaryInquiry = {
    ...inquiryData,
    id: localId,
    createdAt: nowStr,
    status: 'new'
  };

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackInquiry)
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.inquiry) {
        broadcastLocalEvent('NEW_INQUIRY', json.inquiry);
        return json.inquiry;
      }
    }
  } catch (err) {
    console.warn('Real-time API inquiry submission failed, falling back to local resilience:', err);
  }

  // Fallback broadcast
  broadcastLocalEvent('NEW_INQUIRY', fallbackInquiry);
  return fallbackInquiry;
}

/**
 * Update inquiry in server immediately (claim, unclaim, reply, rating)
 */
export async function updateInquiryRealtime(
  inquiryId: string,
  updates: Partial<BeneficiaryInquiry>
): Promise<boolean> {
  broadcastLocalEvent('UPDATE_INQUIRY', { ...updates, id: inquiryId });

  try {
    const res = await fetch(`/api/inquiries/${inquiryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time API inquiry update failed:', err);
    return false;
  }
}

/**
 * Submit survey/request instantly to server
 */
export async function submitSurveyRealtime(survey: SurveyResponse): Promise<SurveyResponse> {
  broadcastLocalEvent('NEW_SURVEY', survey);

  try {
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey)
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.survey) {
        return json.survey;
      }
    }
  } catch (err) {
    console.warn('Real-time API survey submission failed:', err);
  }

  return survey;
}

/**
 * Update survey in server immediately (status, assign, resolve)
 */
export async function updateSurveyRealtime(
  surveyId: string,
  updates: Partial<SurveyResponse>
): Promise<boolean> {
  broadcastLocalEvent('UPDATE_SURVEY', { ...updates, id: surveyId });

  try {
    const res = await fetch(`/api/surveys/${surveyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time API survey update failed:', err);
    return false;
  }
}

// =========================================================================
// REAL-TIME SYNC ENGINE (SSE + Cross-Tab + Resilient High-Speed Poller)
// =========================================================================

export interface RealtimeCallbacks {
  onNewInquiry?: (inquiry: BeneficiaryInquiry) => void;
  onUpdateInquiry?: (inquiry: Partial<BeneficiaryInquiry> & { id: string }) => void;
  onNewSurvey?: (survey: SurveyResponse) => void;
  onUpdateSurvey?: (survey: Partial<SurveyResponse> & { id: string }) => void;
  onDataSync?: (data: any) => void;
  onNotification?: (alert: { title: string; message: string; type: 'inquiry' | 'survey' }) => void;
}

export function initRealtimeSync(callbacks: RealtimeCallbacks): () => void {
  let isCleanedUp = false;
  let eventSource: EventSource | null = null;
  let reconnectTimeout: any = null;
  let pollingInterval: any = null;
  let reconnectAttempts = 0;

  // Track known IDs to avoid re-triggering notifications for existing items
  const knownInquiryIds = new Set<string>();
  const knownSurveyIds = new Set<string>();

  // Initialize known IDs from localStorage if available
  try {
    const cachedInq = localStorage.getItem('beneficiary_inquiries_v1');
    if (cachedInq) {
      const arr = JSON.parse(cachedInq);
      if (Array.isArray(arr)) arr.forEach(i => { if (i && i.id) knownInquiryIds.add(i.id); });
    }
    const cachedSurv = localStorage.getItem('parent_surveys_v1');
    if (cachedSurv) {
      const arr = JSON.parse(cachedSurv);
      if (Array.isArray(arr)) arr.forEach(s => { if (s && s.id) knownSurveyIds.add(s.id); });
    }
  } catch (_) {}

  // 1. Process New Inquiry Event
  function handleNewInquiry(inquiry: BeneficiaryInquiry) {
    if (!inquiry || !inquiry.id) return;
    const isNew = !knownInquiryIds.has(inquiry.id);
    knownInquiryIds.add(inquiry.id);

    if (callbacks.onNewInquiry) {
      callbacks.onNewInquiry(inquiry);
    }

    if (isNew) {
      playNotificationChime('inquiry');
      if (callbacks.onNotification) {
        callbacks.onNotification({
          title: 'استفسار جديد وصل الآن!',
          message: `ورد استفسار جديد من المستفيد: [${inquiry.senderName}]`,
          type: 'inquiry'
        });
      }
    }
  }

  // 2. Process Update Inquiry Event
  function handleUpdateInquiry(inquiry: Partial<BeneficiaryInquiry> & { id: string }) {
    if (!inquiry || !inquiry.id) return;
    knownInquiryIds.add(inquiry.id);
    if (callbacks.onUpdateInquiry) {
      callbacks.onUpdateInquiry(inquiry);
    }
  }

  // 3. Process New Survey Event
  function handleNewSurvey(survey: SurveyResponse) {
    if (!survey || !survey.id) return;
    const isNew = !knownSurveyIds.has(survey.id);
    knownSurveyIds.add(survey.id);

    if (callbacks.onNewSurvey) {
      callbacks.onNewSurvey(survey);
    }

    if (isNew) {
      playNotificationChime('survey');
      if (callbacks.onNotification) {
        callbacks.onNotification({
          title: 'طلب جديد وصل الآن!',
          message: `ورد طلب جديد من ولي الأمر / المستفيد: [${survey.beneficiaryName}]`,
          type: 'survey'
        });
      }
    }
  }

  // 4. Process Update Survey Event
  function handleUpdateSurvey(survey: Partial<SurveyResponse> & { id: string }) {
    if (!survey || !survey.id) return;
    knownSurveyIds.add(survey.id);
    if (callbacks.onUpdateSurvey) {
      callbacks.onUpdateSurvey(survey);
    }
  }

  // 5. Connect SSE Stream
  function connectSSE() {
    if (isCleanedUp || typeof window === 'undefined') return;

    try {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        reconnectAttempts = 0;
      };

      eventSource.onmessage = (e) => {
        if (!e.data) return;
        try {
          const event = JSON.parse(e.data);
          if (event.type === 'NEW_INQUIRY' && event.data) {
            handleNewInquiry(event.data);
          } else if (event.type === 'UPDATE_INQUIRY' && event.data) {
            handleUpdateInquiry(event.data);
          } else if (event.type === 'NEW_SURVEY' && event.data) {
            handleNewSurvey(event.data);
          } else if (event.type === 'UPDATE_SURVEY' && event.data) {
            handleUpdateSurvey(event.data);
          } else if (event.type === 'DATA_SYNC' && callbacks.onDataSync) {
            callbacks.onDataSync(event.data);
          }
        } catch (_) {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isCleanedUp) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
          reconnectTimeout = setTimeout(connectSSE, delay);
        }
      };
    } catch (err) {
      console.warn('SSE connection init error:', err);
    }
  }

  connectSSE();

  // 6. Cross-Tab BroadcastChannel Listener
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (!e.data || typeof e.data !== 'object') return;
    const { type, data } = e.data;
    if (type === 'NEW_INQUIRY' && data) {
      handleNewInquiry(data);
    } else if (type === 'UPDATE_INQUIRY' && data) {
      handleUpdateInquiry(data);
    } else if (type === 'NEW_SURVEY' && data) {
      handleNewSurvey(data);
    } else if (type === 'UPDATE_SURVEY' && data) {
      handleUpdateSurvey(data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // 7. Resilient Smart Background Polling (Guarantees fresh sync every 3.5s)
  async function pollServerUpdates() {
    if (isCleanedUp) return;

    // Fast check inquiries
    try {
      const inqRes = await fetch('/api/inquiries');
      if (inqRes.ok) {
        const json = await inqRes.json();
        if (json && Array.isArray(json.data)) {
          const incoming: BeneficiaryInquiry[] = json.data;
          incoming.forEach(inq => {
            if (inq && inq.id) {
              if (!knownInquiryIds.has(inq.id)) {
                handleNewInquiry(inq);
              }
            }
          });
        }
      }
    } catch (_) {}

    // Fast check surveys
    try {
      const survRes = await fetch('/api/surveys');
      if (survRes.ok) {
        const json = await survRes.json();
        if (json && Array.isArray(json.data)) {
          const incoming: SurveyResponse[] = json.data;
          incoming.forEach(s => {
            if (s && s.id) {
              if (!knownSurveyIds.has(s.id)) {
                handleNewSurvey(s);
              }
            }
          });
        }
      }
    } catch (_) {}
  }

  // Run initial poll after 1s, then every 3.5 seconds
  const initialPollTimer = setTimeout(pollServerUpdates, 1000);
  pollingInterval = setInterval(pollServerUpdates, 3500);

  // Return Cleanup Function
  return () => {
    isCleanedUp = true;
    clearTimeout(initialPollTimer);
    clearTimeout(reconnectTimeout);
    clearInterval(pollingInterval);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}
