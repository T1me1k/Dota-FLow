import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { DotaFlowRuntimeProvider, RuntimeSnapshot } from './provider';

type RuntimeContextValue = {
  snapshot: RuntimeSnapshot;
  provider: DotaFlowRuntimeProvider;
};

type LiveBridgeWireSnapshot = RuntimeSnapshot & {
  bridge?: {
    state?: unknown;
    message?: unknown;
  };
  diagnostics?: {
    pipeline?: RuntimeSnapshot;
  };
};

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

const BRIDGE_STATUS_LABELS: Record<string, string> = {
  WAITING: 'Connecting',
  LIVE: 'Connected',
  DEGRADED: 'Degraded',
  UNAVAILABLE: 'Unavailable',
  STALE: 'Stale',
  STOPPED: 'Stopped'
};

function normalizeLiveBridgeSnapshot(input: RuntimeSnapshot): RuntimeSnapshot {
  const wire = input as LiveBridgeWireSnapshot;
  const pipeline = wire.diagnostics?.pipeline;
  if (!pipeline || !wire.bridge) return input;

  const bridgeState = String(wire.bridge.state ?? '').toUpperCase();
  const pipelineQuality = pipeline.dataQuality ?? {};
  const source = String(pipeline.state?.source ?? '').toLowerCase();
  const observedQuality = bridgeState === 'LIVE'
    ? 'LIVE'
    : bridgeState === 'DEGRADED' || bridgeState === 'STALE'
      ? 'INFERRED'
      : 'UNAVAILABLE';

  return {
    ...input,
    ...pipeline,
    runtimeMode: input.runtimeMode ?? 'LIVE_GEP',
    status: BRIDGE_STATUS_LABELS[bridgeState] ?? input.status ?? 'Connecting',
    macroDecision: pipeline.macroDecision ?? pipeline.decision,
    dataQuality: {
      ...pipelineQuality,
      overall: pipelineQuality.overall ?? observedQuality,
      macro: pipelineQuality.macro ?? observedQuality,
      role: pipelineQuality.role === 'UNKNOWN'
        ? 'UNAVAILABLE'
        : pipelineQuality.role ?? 'UNAVAILABLE'
    },
    runtimeMetadata: {
      ...(input.runtimeMetadata ?? {}),
      source: source || 'unknown',
      transport: source === 'gsi'
        ? 'DOTA_GSI'
        : source === 'overwolf'
          ? 'OVERWOLF_GEP'
          : 'LIVE_BRIDGE',
      bridgeState,
      bridgeMessage: String(wire.bridge.message ?? '')
    }
  };
}

export function RuntimeProvider({
  provider,
  children
}: {
  provider: DotaFlowRuntimeProvider;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>({ loading: true });

  useEffect(() => {
    let active = true;
    const applySnapshot = (value: RuntimeSnapshot) => {
      if (active) setSnapshot(normalizeLiveBridgeSnapshot(value));
    };

    provider
      .getSnapshot()
      .then(applySnapshot)
      .catch((error) => {
        if (active) setSnapshot({ error: String(error) });
      });

    const off = provider.subscribe(applySnapshot);
    return () => {
      active = false;
      off();
    };
  }, [provider]);

  return (
    <RuntimeContext.Provider value={{ snapshot, provider }}>
      {children}
    </RuntimeContext.Provider>
  );
}

export function useRuntime(): RuntimeContextValue {
  const value = useContext<RuntimeContextValue | null>(RuntimeContext);
  if (!value) throw new Error('useRuntime requires RuntimeProvider');
  return value;
}
