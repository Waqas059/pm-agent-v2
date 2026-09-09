"use client";

import { FormEvent, useMemo, useState } from "react";
import { calculateMetricDelta, calculateRelativeChangePercent, isTargetMet, type MetricDirection } from "@/lib/metrics";
import UiIcon from "./ui-icons";
import { CompactEmptyState, LibraryToolbar, PageHeader, StatusBadge } from "./workspace-primitives";

type Metric = { id: string; name: string; baseline: number; target: number; direction: MetricDirection; unit: string };
type MetricForm = Omit<Metric, "id">;
type ExperimentPlan = { hypothesis: string; control: string; treatment: string; metricId: string };

const initialMetric: MetricForm = { name: "", baseline: 0, target: 0, direction: "increase", unit: "%" };
const initialExperiment = { hypothesis: "", control: "Current experience", treatment: "Proposed change", metricId: "" };

function formatValue(value: number, unit: string) { return `${value}${unit === "%" ? "%" : ` ${unit}`}`; }

export default function MetricsExperimentPanel() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [metricForm, setMetricForm] = useState(initialMetric);
  const [experimentForm, setExperimentForm] = useState(initialExperiment);
  const [experimentPlan, setExperimentPlan] = useState<ExperimentPlan | null>(null);
  const [newExperimentOpen, setNewExperimentOpen] = useState(false);
  const selectedMetric = useMemo(() => metrics.find((metric) => metric.id === experimentForm.metricId) ?? metrics[0], [experimentForm.metricId, metrics]);

  function addMetric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!metricForm.name.trim()) return;
    const metric = { ...metricForm, name: metricForm.name.trim(), id: crypto.randomUUID() };
    setMetrics((current) => [...current, metric]);
    setExperimentForm((current) => ({ ...current, metricId: current.metricId || metric.id }));
    setMetricForm(initialMetric);
  }

  function createExperiment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!experimentForm.hypothesis.trim() || !selectedMetric) return;
    setExperimentPlan({ ...experimentForm, hypothesis: experimentForm.hypothesis.trim(), metricId: selectedMetric.id });
    setNewExperimentOpen(false);
  }

  return <div className="pm-page pm-library-page">
    <PageHeader eyebrow="MEASURED BETS" title="Experiments" description="See the bets already in motion before defining another one." action={<button type="button" className="pm-button pm-button-primary" onClick={() => setNewExperimentOpen((value) => !value)}><UiIcon name="plus" size={14} />{newExperimentOpen ? "Close" : "New experiment"}</button>} />
    <LibraryToolbar><div className="pm-filter-group" role="group" aria-label="Experiment views"><span className="is-active">All</span><span>Draft</span><span className="pm-filter-muted">Active · coming from saved experiments</span></div><span className="pm-toolbar-count">{metrics.length} {metrics.length === 1 ? "metric" : "metrics"}</span></LibraryToolbar>

    {metrics.length === 0 ? <CompactEmptyState title="No experiments yet" body="Your experiment workspace will appear here after you define a measurable bet." icon="chart" action={<button type="button" className="pm-button pm-button-secondary" onClick={() => setNewExperimentOpen(true)}>Define the first experiment <UiIcon name="arrow-up-right" size={14} /></button>} /> : <div className="pm-data-list" aria-label="Experiments"><div className="pm-data-list-head"><span>Experiment</span><span>Hypothesis</span><span>Metric</span><span>Status</span></div>{metrics.map((metric) => { const linkedPlan = experimentPlan?.metricId === metric.id ? experimentPlan : null; return <article className="pm-data-row pm-experiment-row" key={metric.id}><div><strong>{linkedPlan?.hypothesis || metric.name}</strong><small>{metric.name} · target {formatValue(metric.target, metric.unit)}</small></div><span>{linkedPlan?.hypothesis || "Metric definition ready"}</span><span>{metric.name}</span><StatusBadge label={linkedPlan ? "Draft" : "Metric only"} tone={linkedPlan ? "amber" : "neutral"} /></article>; })}</div>}

    <details className="pm-progressive-form" open={newExperimentOpen}>
      <summary><span>New experiment</span><small>Define the metric and hypothesis when you are ready.</small></summary>
      <div className="pm-progressive-form-body">
        <form onSubmit={addMetric} className="pm-inline-form"><div className="pm-form-heading"><div><p className="pm-eyebrow">STEP 1</p><h3>Define the success metric</h3></div><span className="pm-form-note">Local draft</span></div><div className="pm-form-grid pm-form-grid-metrics"><label htmlFor="metric-name">Metric name<input id="metric-name" required maxLength={120} value={metricForm.name} onChange={(event) => setMetricForm((current) => ({ ...current, name: event.target.value }))} placeholder="Setup completion rate" /></label><label htmlFor="metric-baseline">Baseline<input id="metric-baseline" type="number" step="any" value={metricForm.baseline} onChange={(event) => setMetricForm((current) => ({ ...current, baseline: Number(event.target.value) }))} /></label><label htmlFor="metric-target">Target<input id="metric-target" type="number" step="any" value={metricForm.target} onChange={(event) => setMetricForm((current) => ({ ...current, target: Number(event.target.value) }))} /></label><label htmlFor="metric-direction">Direction<select id="metric-direction" value={metricForm.direction} onChange={(event) => setMetricForm((current) => ({ ...current, direction: event.target.value as MetricDirection }))}><option value="increase">Increase</option><option value="decrease">Decrease</option></select></label><label htmlFor="metric-unit">Unit<input id="metric-unit" maxLength={12} value={metricForm.unit} onChange={(event) => setMetricForm((current) => ({ ...current, unit: event.target.value }))} placeholder="%" /></label></div><div className="pm-form-actions"><span>Calculations stay transparent and local.</span><button type="submit" className="pm-button pm-button-secondary">Add metric</button></div></form>
        <form onSubmit={createExperiment} className="pm-inline-form"><div className="pm-form-heading"><div><p className="pm-eyebrow">STEP 2</p><h3>Describe the bet</h3></div></div><div className="pm-form-grid pm-form-grid-experiment"><label htmlFor="experiment-hypothesis">Hypothesis<textarea id="experiment-hypothesis" required maxLength={300} value={experimentForm.hypothesis} onChange={(event) => setExperimentForm((current) => ({ ...current, hypothesis: event.target.value }))} placeholder="If we simplify setup, more users will complete it." /></label><label htmlFor="experiment-control">Control<input id="experiment-control" required maxLength={80} value={experimentForm.control} onChange={(event) => setExperimentForm((current) => ({ ...current, control: event.target.value }))} /></label><label htmlFor="experiment-treatment">Treatment<input id="experiment-treatment" required maxLength={80} value={experimentForm.treatment} onChange={(event) => setExperimentForm((current) => ({ ...current, treatment: event.target.value }))} /></label><label htmlFor="experiment-metric">Primary metric<select id="experiment-metric" required value={selectedMetric?.id ?? ""} onChange={(event) => setExperimentForm((current) => ({ ...current, metricId: event.target.value }))}><option value="" disabled>Select a metric</option>{metrics.map((metric) => <option key={metric.id} value={metric.id}>{metric.name}</option>)}</select></label></div><div className="pm-form-actions"><span>{selectedMetric ? "Review before sharing with your team." : "Add a metric first."}</span><button type="submit" disabled={!selectedMetric} className="pm-button pm-button-primary">Create experiment plan</button></div></form>
      </div>
    </details>

    {experimentPlan && selectedMetric && <section className="pm-review-panel" aria-label="Experiment plan"><div><p className="pm-eyebrow">REVIEWABLE EXPERIMENT PLAN</p><h3>{experimentPlan.hypothesis}</h3></div><div className="pm-review-grid"><div><span>Control</span><strong>{experimentPlan.control}</strong></div><div><span>Treatment</span><strong>{experimentPlan.treatment}</strong></div><div><span>Primary metric</span><strong>{selectedMetric.name}</strong></div></div><p>This is a planning outline only. It does not claim statistical significance or fabricate experiment results.</p></section>}

    {metrics.length > 0 && <div className="pm-metric-detail-list">{metrics.map((metric) => { const delta = calculateMetricDelta(metric); const relative = calculateRelativeChangePercent(metric); const met = isTargetMet(metric.baseline, metric.target, metric.direction); return <div className="pm-metric-detail" key={`detail-${metric.id}`}><span>{metric.name}</span><span>Baseline {formatValue(metric.baseline, metric.unit)}</span><span>Target {formatValue(metric.target, metric.unit)}</span><StatusBadge label={met ? "Target met" : `${delta > 0 ? "+" : ""}${formatValue(delta, metric.unit)} to target`} tone={met ? "green" : "amber"} /><small>Relative change: {relative === null ? "Not available from a zero baseline" : `${relative > 0 ? "+" : ""}${relative.toFixed(1)}%`}</small></div>; })}</div>}
  </div>;
}
