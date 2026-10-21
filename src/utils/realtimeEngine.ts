import { BeneficiaryInquiry, SurveyResponse } from '../types';
import { saveInquiriesToStorage, saveSurveysToStorage } from './storageEngine';
import {
  saveInquiryToCloud,
  updateInquiryInCloud,
  saveSurveyToCloud,
  updateSurveyInCloud,
  subscribeToInquiriesCloud,
  subscribeToSurveysCloud
} from './cloudSync';

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
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'survey') {
      // Deep reassuring chime (C5 -> G5)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else {
      // Quick gentle blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (_) {
    // Audio synthesis is non-critical
  }
}

// =========================================================================
// BROADCAST CHANNEL SETUP (Zero-latency instant cross-tab communication)
// =========================================================================
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('moe_admissions_realtime_bus');
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
// REAL-TIME API DISPATCH METHODS (INSTANT CLOUD + SERVER DUAL PERSISTENCE)
// =========================================================================

/**
 * Submit inquiry instantly to cloud Firestore and local server
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

  // 1. Instant Cloud Firestore save (guarantees cross-device arrival across all deployed instances)
  saveInquiryToCloud(fallbackInquiry).catch((err) => {
    console.warn('Direct Firestore saveInquiry error:', err);
  });

  // 2. Local Tab Broadcast
  broadcastLocalEvent('NEW_INQUIRY', fallbackInquiry);

  // 3. Server HTTP API Dispatch
  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackInquiry)
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.inquiry) {
        return json.inquiry;
      }
    }
  } catch (err) {
    console.warn('Real-time API inquiry submission fallback to cloud/local:', err);
  }

  return fallbackInquiry;
}

/**
 * Update inquiry in cloud Firestore and server immediately (claim, unclaim, reply, rating)
 */
export async function updateInquiryRealtime(
  inquiryId: string,
  updates: Partial<BeneficiaryInquiry>
): Promise<boolean> {
  // 1. Cloud Firestore Update
  updateInquiryInCloud(inquiryId, updates).catch((err) => {
    console.warn('Direct Firestore updateInquiry error:', err);
  });

  // 2. Local Tab Broadcast
  broadcastLocalEvent('UPDATE_INQUIRY', { ...updates, id: inquiryId });

  // 3. Server HTTP API Dispatch
  try {
    const res = await fetch(`/api/inquiries/${inquiryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time API inquiry update fallback to cloud:', err);
    return false;
  }
}

/**
 * Submit survey/request instantly to cloud Firestore and server
 */
export async function submitSurveyRealtime(survey: SurveyResponse): Promise<SurveyResponse> {
  // 1. Cloud Firestore Save
  saveSurveyToCloud(survey).catch((err) => {
    console.warn('Direct Firestore saveSurvey error:', err);
  });

  // 2. Local Tab Broadcast
  broadcastLocalEvent('NEW_SURVEY', survey);

  // 3. Server HTTP API Dispatch
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
    console.warn('Real-time API survey submission fallback to cloud:', err);
  }

  return survey;
}

/**
 * Update survey in cloud Firestore and server immediately (status, assign, resolve)
 */
export async function updateSurveyRealtime(
  surveyId: string,
  updates: Partial<SurveyResponse>
): Promise<boolean> {
  // 1. Cloud Firestore Update
  updateSurveyInCloud(surveyId, updates).catch((err) => {
    console.warn('Direct Firestore updateSurvey error:', err);
  });

  // 2. Local Tab Broadcast
  broadcastLocalEvent('UPDATE_SURVEY', { ...updates, id: surveyId });

  // 3. Server HTTP API Dispatch
  try {
    const res = await fetch(`/api/surveys/${surveyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time API survey update fallback to cloud:', err);
    return false;
  }
}

// =========================================================================
// REAL-TIME SYNC ENGINE (Firestore Realtime + SSE + BroadcastChannel + Polling)
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

  // Initialize known IDs from local caches
  try {
    const cachedInq = localStorage.getItem('beneficiary_inquiries_v1');
    if (cachedInq) {
      const arr = JSON.parse(cachedInq);
      if (Array.isArray(arr)) arr.forEach((i) => { if (i && i.id) knownInquiryIds.add(i.id); });
    }
    const cachedSurv = localStorage.getItem('beneficiary_surveys');
    if (cachedSurv) {
      const arr = JSON.parse(cachedSurv);
      if (Array.isArray(arr)) arr.forEach((s) => { if (s && s.id) knownSurveyIds.add(s.id); });
    }
  } catch (_) {}

  // 1. Process New Inquiry Event
  function handleNewInquiry(inquiry: BeneficiaryInquiry, suppressChime = false) {
    if (!inquiry || !inquiry.id) return;
    const isNew = !knownInquiryIds.has(inquiry.id);
    knownInquiryIds.add(inquiry.id);

    if (callbacks.onNewInquiry) {
      callbacks.onNewInquiry(inquiry);
    }

    if (isNew && !suppressChime) {
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
  function handleNewSurvey(survey: SurveyResponse, suppressChime = false) {
    if (!survey || !survey.id) return;
    const isNew = !knownSurveyIds.has(survey.id);
    knownSurveyIds.add(survey.id);

    if (callbacks.onNewSurvey) {
      callbacks.onNewSurvey(survey);
    }

    if (isNew && !suppressChime) {
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

  // 5. Connect Cloud Firestore Realtime Push Subscriptions
  let unsubscribeInquiries: (() => void) | null = null;
  let unsubscribeSurveys: (() => void) | null = null;

  try {
    unsubscribeInquiries = subscribeToInquiriesCloud((inquiries, newArrival) => {
      if (isCleanedUp) return;
      if (newArrival && !knownInquiryIds.has(newArrival.id)) {
        handleNewInquiry(newArrival);
      }
      inquiries.forEach((inq) => {
        if (!knownInquiryIds.has(inq.id)) {
          handleNewInquiry(inq, true);
        } else {
          handleUpdateInquiry(inq);
        }
      });
    });

    unsubscribeSurveys = subscribeToSurveysCloud((surveys, newArrival) => {
      if (isCleanedUp) return;
      if (newArrival && !knownSurveyIds.has(newArrival.id)) {
        handleNewSurvey(newArrival);
      }
      surveys.forEach((s) => {
        if (!knownSurveyIds.has(s.id)) {
          handleNewSurvey(s, true);
        } else {
          handleUpdateSurvey(s);
        }
      });
    });
  } catch (cloudErr) {
    console.warn('Cloud sync listeners init error:', cloudErr);
  }

  // 6. Connect Server SSE Stream (Second redundancy layer)
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

  // 7. Cross-Tab BroadcastChannel Listener (Third redundancy layer)
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

  // 8. Resilient Smart Background Polling (Fourth redundancy layer every 3.5s)
  async function pollServerUpdates() {
    if (isCleanedUp) return;

    // Fast check inquiries
    try {
      const inqRes = await fetch('/api/inquiries');
      if (inqRes.ok) {
        const json = await inqRes.json();
        if (json && Array.isArray(json.data)) {
          const incoming: BeneficiaryInquiry[] = json.data;
          incoming.forEach((inq) => {
            if (inq && inq.id) {
              if (!knownInquiryIds.has(inq.id)) {
                handleNewInquiry(inq);
              } else {
                handleUpdateInquiry(inq);
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
          incoming.forEach((s) => {
            if (s && s.id) {
              if (!knownSurveyIds.has(s.id)) {
                handleNewSurvey(s);
              } else {
                handleUpdateSurvey(s);
              }
            }
          });
        }
      }
    } catch (_) {}
  }

  const initialPollTimer = setTimeout(pollServerUpdates, 1000);
  pollingInterval = setInterval(pollServerUpdates, 3500);

  // Return Master Cleanup Function
  return () => {
    isCleanedUp = true;
    clearTimeout(initialPollTimer);
    clearTimeout(reconnectTimeout);
    clearInterval(pollingInterval);
    if (unsubscribeInquiries) unsubscribeInquiries();
    if (unsubscribeSurveys) unsubscribeSurveys();
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}
