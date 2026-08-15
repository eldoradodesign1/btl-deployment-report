import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, BarChart3, Bell, CalendarClock, ChevronDown, ChevronRight, CircleHelp, Database, Download, Gauge, Keyboard, Layers3, LayoutDashboard, LogOut, MapPin, Menu, Settings2, ShieldCheck, SlidersHorizontal, Store, Users, Zap } from "lucide-react";
import { type Activation } from "@/data/vodacomData";
import DateRangeFilter, { getWeekRanges } from "@/components/DateRangeFilter";
import MetricCard from "@/components/MetricCard";
import LocalLogin from "@/components/LocalLogin";
import { ActivityPage, AnalysisPage, ImportPage, QualityPage, SettingsPage, type AppSettings } from "@/components/ModuleViews";
import ActivationAdminPage from "@/components/ActivationAdmin";
import { dateList, loadLocalData, saveLocalData, type QualityIssue } from "@/lib/analytics";
import { normalizeTargetMatrix, targetDailySeries, targetValueByDate } from "@/lib/targets";
import { loadSupabaseSnapshot } from "@/lib/supabaseData";
import { authenticateSupabaseAdmin, createSupabaseClient, readSupabaseConfig, saveSupabaseConfig, type SupabaseAdminProfile, type SupabaseConfig } from "@/lib/supabase";
import ProgressionChart from "@/components/ProgressionChart";
import ReportExport from "@/components/ReportExport";
import Sparkline from "@/components/Sparkline";
import CommentDetailModal, { type CommentDetail, commentExcerpt } from "@/components/CommentDetailModal";
import HelpGuideModal from "@/components/HelpGuideModal";
import AnimatedNumber from "@/components/AnimatedNumber";
import MobileProfileControl from "@/components/MobileProfileControl";
import "@/controls.css";
import { readSession, roleConfig, type Role, type Session, writeSession } from "@/lib/roles";

const logoUrl = "/assets/vodacom-opaline-logo.png";
const heroUrl = "/assets/vodacom-opaline-hero.png";
const formatNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(Math.round(value));
const formatDecimal = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`)).replace(".", "");
const formatToday = () => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()).replaceAll("/", ".");
const defaultAppSettings = (): AppSettings => ({ targetPrivilege: 20, targetMatrix: normalizeTargetMatrix(), autoExport: true, highContrast: false, teamName: "Équipe pilotage" });
const readAppSettings = (): AppSettings => { try { const stored = JSON.parse(localStorage.getItem("vodacom-settings") ?? "{}") as Partial<AppSettings>; const targetMatrix = normalizeTargetMatrix(stored.targetMatrix); return { targetPrivilege: Number(stored.targetPrivilege) || targetMatrix.shop.privilege, targetMatrix, autoExport: stored.autoExport ?? true, highContrast: stored.highContrast ?? false, teamName: stored.teamName || "Équipe pilotage" }; } catch { return defaultAppSettings(); } };

function countBy(data: Activation[], key: "a" | "s") { const counts = new Map<string, number>(); data.forEach((item) => counts.set(item[key], (counts.get(item[key]) ?? 0) + 1)); return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]); }
function dailyData(data: Activation[]) { const days = new Map<string, number>(); data.forEach((item) => days.set(item.d, (days.get(item.d) ?? 0) + 1)); return Array.from(days.entries()).sort(([a], [b]) => a.localeCompare(b)); }
function TargetOverlay({ values, max, visible }: { values: number[]; max: number; visible: boolean }) { if (!values.length) return null; const width = 1000; const height = 100; const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * width},${height - 3 - (value / Math.max(max, 1)) * (height - 8)}`).join(" "); return <svg className={`bar-target-overlay ${visible ? "is-visible" : ""}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"><polyline points={points} /></svg>; }
function metricsOf(data: Activation[]) { const privilege = data.filter((item) => item.t === "Opt-in Privilège").length; const bundle = data.filter((item) => item.t === "Activation Bundle").length; const roaming = data.filter((item) => item.t === "Opt-in Roaming").length; const days = dateList(data); return { total: data.length, privilege, bundle, roaming, days, agents: new Set(data.map((item) => item.a)).size, shops: new Set(data.map((item) => item.s)).size, average: days.length ? data.length / days.length : 0, topAgents: countBy(data, "a").slice(0, 5), topShops: countBy(data, "s").slice(0, 5), categoryCount: new Set(data.map((item) => item.c)).size }; }

const navSections = [
  { title: "Pilotage", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "activity", label: "Activité", icon: Activity }, { id: "agents", label: "Agents", icon: Users }, { id: "shops", label: "Shops", icon: Store }] },
  { title: "Lecture", items: [{ id: "activations", label: "Activations", icon: Zap }, { id: "analysis", label: "Performances & attendance", icon: Layers3 }] },
  { title: "Contrôle", items: [{ id: "quality", label: "Qualité des données", icon: ShieldCheck }, { id: "import", label: "Import & sources", icon: Database }] },
];
const shortcutKeys: Record<string, string> = { dashboard: "D", activity: "A", agents: "G", shops: "S", activations: "I", analysis: "P", quality: "Q", import: "M", settings: "T" };

export default function Home() {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [data, setData] = useState<Activation[]>(() => loadLocalData([]));
  const [dailyComments, setDailyComments] = useState<Record<string, string>>({});
  const [weeklyComments, setWeeklyComments] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<QualityIssue[]>(() => { try { return JSON.parse(localStorage.getItem("vodacom-issues") ?? "[]") as QualityIssue[]; } catch { return []; } });
  const [settings, setSettings] = useState<AppSettings>(readAppSettings);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => readSupabaseConfig());
  const dates = useMemo(() => dateList(data), [data]); const weekRanges = useMemo(() => getWeekRanges(data), [data]);
  const [startDate, setStartDate] = useState(() => dates[0] ?? "2026-07-23");
  const [endDate, setEndDate] = useState(() => dates.at(-1) ?? "2026-08-08");
  const [page, setPage] = useState("dashboard"); const [pageChanging, setPageChanging] = useState(false); const [sidebarOpen, setSidebarOpen] = useState(false); const [notificationsOpen, setNotificationsOpen] = useState(false); const [notificationsRead, setNotificationsRead] = useState(false); const [reportOpen, setReportOpen] = useState(false); const [accountOpen, setAccountOpen] = useState(false); const [accountPasswordOpen, setAccountPasswordOpen] = useState(false); const [accountPassword, setAccountPassword] = useState(""); const [accountPasswordError, setAccountPasswordError] = useState(""); const [helpOpen, setHelpOpen] = useState(false); const [helpGuideOpen, setHelpGuideOpen] = useState(false); const [periodDocked, setPeriodDocked] = useState(false); const [isMobileViewport, setIsMobileViewport] = useState(() => typeof window !== "undefined" && window.innerWidth <= 760); const [mobileControlOpen, setMobileControlOpen] = useState(false); const [showProgressTargets, setShowProgressTargets] = useState(false); const [showHistogramTargets, setShowHistogramTargets] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const mobileProfileRef = useRef<HTMLDivElement | null>(null);
  const helpRef = useRef<HTMLDivElement | null>(null);
  const mainStageRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const syncViewport = () => setIsMobileViewport(window.innerWidth <= 760);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);
  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [notificationsOpen]);
  useEffect(() => {
    if (!accountOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      const insideSidebarAccount = Boolean(accountRef.current?.contains(target));
      const insideMobileProfile = Boolean(mobileProfileRef.current?.contains(target));
      if (!insideSidebarAccount && !insideMobileProfile) setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [accountOpen]);
  useEffect(() => {
    if (!helpOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (helpRef.current && !helpRef.current.contains(target)) setHelpOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [helpOpen]);
  useEffect(() => {
    if (!mobileControlOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element?.closest(".mobile-control-menu, .mobile-control-button")) setMobileControlOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [mobileControlOpen]);
  useEffect(() => {
    const stage = mainStageRef.current;
    if (!stage || page !== "dashboard") { setPeriodDocked(page !== "dashboard"); return; }
    const syncPeriodDock = () => setPeriodDocked(stage.scrollTop > 220);
    syncPeriodDock(); stage.addEventListener("scroll", syncPeriodDock, { passive: true });
    return () => stage.removeEventListener("scroll", syncPeriodDock);
  }, [page]);
  useEffect(() => {
    let cancelled = false;
    if (!session) return () => { cancelled = true; };
    loadSupabaseSnapshot().then((snapshot) => {
      if (cancelled) return;
      setData(snapshot.records);
      setDailyComments(snapshot.dailyComments);
      setWeeklyComments(snapshot.weeklyComments);
      saveLocalData(snapshot.records);
      const nextDates = dateList(snapshot.records);
      setStartDate(nextDates[0] ?? "2026-07-23");
      setEndDate(nextDates.at(-1) ?? "2026-08-08");
    }).catch(() => {
      // Local CSV/XLSX data remains the fallback when Supabase is unavailable.
    });
    return () => { cancelled = true; };
  }, [session?.role]);
  const filtered = useMemo(() => data.filter((item) => item.d >= startDate && item.d <= endDate), [data, startDate, endDate]);
  const targetDaily = useMemo(() => targetDailySeries(filtered, settings.targetMatrix), [filtered, settings.targetMatrix]);
  const fullTargetDaily = useMemo(() => targetDailySeries(data, settings.targetMatrix), [data, settings.targetMatrix]);
  const filteredTargetTotal = useMemo(() => targetDaily.reduce((sum, [, value]) => sum + value, 0), [targetDaily]);
  const metrics = metricsOf(filtered); const rangeLabel = `${formatDate(startDate)} → ${formatDate(endDate)} 2026`;
  const permissions = session ? roleConfig[session.role] : roleConfig.vodacom;
  const visibleNavSections = navSections;
  const goTo = (id: string) => { setPageChanging(false); window.requestAnimationFrame(() => { setPage(id); setSidebarOpen(false); setHelpOpen(false); setHelpGuideOpen(false); setMobileControlOpen(false); setPageChanging(true); window.setTimeout(() => setPageChanging(false), 420); }); };
  const onLogin = (role: Role) => { const next = writeSession(role); setSession(next); };
  const onSwitchRole = (role: Role) => { if (role === "btl" && session?.role === "vodacom") { setAccountPasswordOpen(true); setAccountPassword(""); setAccountPasswordError(""); return; } const next = writeSession(role); setSession(next); setPage("dashboard"); setAccountOpen(false); setAccountPasswordOpen(false); };
  const confirmBtlSwitch = (event: React.FormEvent) => { event.preventDefault(); if (accountPassword !== "BTL2026") { setAccountPasswordError("Mot de passe incorrect."); return; } const next = writeSession("btl"); setSession(next); setPage("dashboard"); setAccountOpen(false); setAccountPasswordOpen(false); setAccountPassword(""); setAccountPasswordError(""); };
  const onLogout = () => { localStorage.removeItem("vodacom-session"); setSession(null); setPage("dashboard"); setAccountOpen(false); setAccountPasswordOpen(false); setAccountPassword(""); setAccountPasswordError(""); setHelpOpen(false); setHelpGuideOpen(false); };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const active = document.activeElement;
      const isTextEntry = (node: EventTarget | null) => node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement || (node instanceof HTMLInputElement && node.type !== "range") || (node instanceof HTMLElement && node.isContentEditable);
      if (isTextEntry(target) || isTextEntry(active)) return;
      if (event.key === "Escape") { setAccountOpen(false); setAccountPasswordOpen(false); setAccountPasswordError(""); setNotificationsOpen(false); setHelpOpen(false); setHelpGuideOpen(false); setMobileControlOpen(false); setSidebarOpen(false); return; }
      const key = event.key.toLowerCase();
      if (event.altKey) {
        if (key === "s") { event.preventDefault(); setAccountOpen((value) => !value); return; }
        if (key === "l") { event.preventDefault(); onLogout(); return; }
        if (key === "0") { const first = dates[0]; const last = dates.at(-1); if (first && last) { event.preventDefault(); setStartDate(first); setEndDate(last); } return; }
        if (/^[1-9]$/.test(key)) { const index = Number(key); const week = weekRanges[index - 1]; if (week) { event.preventDefault(); setStartDate(week.start); setEndDate(week.end); } return; }
        return;
      }
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      const shortcuts: Record<string, string> = { d: "dashboard", a: "activity", g: "agents", s: "shops", i: "activations", p: "analysis", q: "quality", m: "import", t: "settings" };
      const nextPage = shortcuts[key];
      if (nextPage && (nextPage !== "settings" || permissions.canConfigure)) { event.preventDefault(); goTo(nextPage); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dates, permissions.canConfigure, weekRanges]);
  const onImport = (records: Activation[], nextIssues: QualityIssue[]) => { setData(records); setDailyComments({}); setWeeklyComments({}); setIssues(nextIssues); saveLocalData(records); localStorage.setItem("vodacom-issues", JSON.stringify(nextIssues)); const nextDates = dateList(records); setStartDate(nextDates[0] ?? startDate); setEndDate(nextDates.at(-1) ?? endDate); setPage("dashboard"); };
  const onAdminAuthenticate = (phone: string, password: string): Promise<SupabaseAdminProfile> => authenticateSupabaseAdmin(phone, password);
  const onSupabaseSync = async (config: SupabaseConfig) => { const snapshot = await loadSupabaseSnapshot(createSupabaseClient(config)); setData(snapshot.records); setDailyComments(snapshot.dailyComments); setWeeklyComments(snapshot.weeklyComments); saveLocalData(snapshot.records); saveSupabaseConfig(config); setSupabaseConfig(config); const nextDates = dateList(snapshot.records); setStartDate(nextDates[0] ?? "2026-07-23"); setEndDate(nextDates.at(-1) ?? "2026-08-08"); };
  const showTopbarPeriod = data.length > 0 && (isMobileViewport || page !== "dashboard" || periodDocked);
  const onSettings = (next: AppSettings) => { setSettings(next); localStorage.setItem("vodacom-settings", JSON.stringify(next)); };
  const onEditRecord = (index: number, field: "a" | "s" | "cl" | "n", value: string) => { setData((current) => { const next = current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item); saveLocalData(next); return next; }); };
  if (!session) return <LocalLogin onLogin={onLogin} />;

  return <div className={`app-shell role-${session.role} ${settings.highContrast ? "high-contrast" : ""}`}><div className="app-lavalamp" aria-hidden="true"><span className="lavalamp-orb lavalamp-orb-one" /><span className="lavalamp-orb lavalamp-orb-two" /><span className="lavalamp-orb lavalamp-orb-three" /></div>
    <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}><div className="brand-lockup"><div className="brand-mark"><img src={logoUrl} alt="" /></div><div><div className="brand-name">BTL</div><div className="brand-sub">DEPLOYMENT REPORT</div></div><span className="brand-dot" /></div><div className="sidebar-context"><span className="live-pulse" /> <span>{session.label.toUpperCase()}</span><strong>{permissions.mode}</strong></div><nav className="main-nav" aria-label="Navigation principale">{visibleNavSections.map((section) => <div className="nav-group" key={section.title}><div className="nav-title">{section.title}</div>{section.items.map(({ id, label, icon: Icon }) => <button className={`nav-item ${page === id ? "is-active" : ""}`} key={id} onClick={() => goTo(id)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{shortcutKeys[id] && <span className="nav-key">{shortcutKeys[id]}</span>}</button>)}</div>)}<div className="nav-group mobile-control-wrap"><button type="button" className={`mobile-control-button nav-item ${mobileControlOpen ? "is-active" : ""}`} aria-label="Contrôle" aria-expanded={mobileControlOpen} onClick={() => setMobileControlOpen((value) => !value)}><SlidersHorizontal size={17} strokeWidth={1.8} /><span>Contrôle</span></button></div>{permissions.canConfigure && <div className="nav-group desktop-settings-group"><div className="nav-title">Configuration</div><button className={`nav-item ${page === "settings" ? "is-active" : ""}`} onClick={() => goTo("settings")}><Settings2 size={17} strokeWidth={1.8} /><span>Paramètres</span><span className="nav-key">{shortcutKeys.settings}</span></button></div>}</nav>{mobileControlOpen && <div className="mobile-control-menu glass-card" role="menu" aria-label="Choisir une vue de contrôle"><div className="mobile-control-menu-label">CONTRÔLE</div><button type="button" onClick={() => goTo("agents")}><Users size={14} /> Agents</button><button type="button" onClick={() => goTo("shops")}><Store size={14} /> Shops</button></div>}<div className="sidebar-bottom"><div className="account-menu-wrap" ref={accountRef}><button className={`profile-card ${accountOpen ? "is-open" : ""}`} type="button" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}><div className={`avatar avatar-session-${session.role}`}>{session.label.slice(0, 2).toUpperCase()}</div><div><strong>{session.label}</strong><span>{permissions.mode}</span></div><ChevronDown className="account-chevron" size={15} /></button>{accountOpen && <div className="account-menu glass-card"><div className="account-menu-label">CHANGER DE COMPTE</div><button type="button" className="account-menu-option" onClick={() => onSwitchRole("btl")}><span>BTL</span><small>Pilotage complet</small>{session.role === "btl" && <em>ACTIF</em>}</button><button type="button" className="account-menu-option" onClick={() => onSwitchRole("vodacom")}><span>Vodacom</span><small>Lecture uniquement</small>{session.role === "vodacom" && <em>ACTIF</em>}</button><button type="button" className="account-menu-logout" onClick={onLogout}><LogOut size={14} /> Déconnexion</button>{accountPasswordOpen && <form className="account-password-panel" onSubmit={confirmBtlSwitch}><div><strong>Accès BTL</strong><small>Confirmez le mot de passe</small></div><input value={accountPassword} onChange={(event) => { setAccountPassword(event.target.value); setAccountPasswordError(""); }} type="password" autoComplete="current-password" autoFocus placeholder="Code d’accès" aria-label="Mot de passe BTL" />{accountPasswordError && <div className="account-password-error">{accountPasswordError}</div>}<div className="account-password-actions"><button type="button" className="account-password-cancel" onClick={() => { setAccountPasswordOpen(false); setAccountPasswordError(""); }}>Annuler</button><button type="submit" className="account-password-submit">Valider</button></div></form>}</div>}</div></div></aside>
    <main ref={mainStageRef} className={`main-stage ${pageChanging ? "is-page-transitioning" : ""}`}><header className={`topbar ${showTopbarPeriod ? "has-period-dock" : ""}`}><button className="mobile-menu" onClick={() => setSidebarOpen((value) => !value)}><Menu size={18} /></button><div className="breadcrumb" aria-label="Module actif"><strong>{[...navSections.flatMap((section) => section.items), { id: "settings", label: "Paramètres" }].find((item) => item.id === page)?.label ?? "Dashboard"}</strong></div>{showTopbarPeriod && <DateRangeFilter compact data={data} startDate={startDate} endDate={endDate} onChange={(start, end) => { setStartDate(start); setEndDate(end); }} />}<div className="topbar-tools"><div className="sync-state"><span className="sync-dot" /> Données locales <small>session active</small></div><button className="export-top-button" onClick={() => setReportOpen(true)}><Download size={15} /> Export</button><div className="help-wrap" ref={helpRef}><button className={`icon-button ${helpOpen ? "is-open" : ""}`} aria-label="Aide" aria-expanded={helpOpen} onClick={() => setHelpOpen((value) => !value)}><CircleHelp size={18} /></button>{helpOpen && <div className="help-panel glass-card" role="dialog" aria-label="Aide rapide"><div className="eyebrow">AIDE RAPIDE</div><h3>Repères de pilotage</h3><p>Utilisez les touches de la sidebar pour naviguer sans quitter le clavier. Les raccourcis sont suspendus pendant la saisie dans un champ.</p><div className="help-shortcuts"><span><kbd>D</kbd> Dashboard</span><span><kbd>A</kbd> Activité</span><span><kbd>G</kbd> Agents</span><span><kbd>S</kbd> Shops</span><span><kbd>Alt+0</kbd> Toute la période</span><span><kbd>Alt+1–9</kbd> Semaines</span></div><small>Échap ferme les menus ouverts.</small><button type="button" className="help-more-button" onClick={() => { setHelpOpen(false); setHelpGuideOpen(true); }}>Plus d’aide <ChevronRight size={13} /></button></div>}</div><div className="notification-wrap" ref={notificationRef}><button className="icon-button" aria-label="Notifications" onClick={() => { setNotificationsOpen((value) => !value); setNotificationsRead(true); }}><Bell size={18} />{!notificationsRead && <span className="notification-dot" />}</button>{notificationsOpen && <div className="notification-panel glass-card"><div className="notification-heading"><div><div className="eyebrow">CENTRE DE SIGNAUX</div><h3>Notifications</h3></div><span className="notification-live">LOCAL</span></div><div className="notification-item"><span className="notification-icon notification-cyan"><Database size={14} /></span><div><strong>Source disponible</strong><small>Rapport de référence · {formatNumber(data.length)} lignes chargées.</small></div></div><div className="notification-item"><span className="notification-icon notification-coral"><ShieldCheck size={14} /></span><div><strong>Contrôle qualité</strong><small>{issues.length ? `${issues.length} anomalie(s) importée(s) à examiner.` : "La source actuelle est prête à être contrôlée."}</small></div></div><div className="notification-footer">Les signaux sont conservés dans ce navigateur.</div></div>}</div><button className="icon-button logout-top" aria-label="Déconnexion" onClick={onLogout}><LogOut size={17} /></button></div></header>
      {page === "dashboard" ? <><section className="hero-strip"><div className="hero-image" style={{ backgroundImage: `url(${heroUrl})` }} /><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> VUE CAMPAGNE · {formatToday()}</div><h1>Le signal de votre<br /><em>activité terrain.</em></h1><p>{session.role === "vodacom" ? "Une lecture claire des jours prestés de la campagne Vodacom Privilège." : "Un regard net sur les activations Vodacom Privilège, les agents mobilisés et les points de vente qui font le mouvement."}</p></div><div className="hero-aside"><span>VOLUME FILTRÉ</span><div className="hero-volume-line"><strong><AnimatedNumber value={session.role === "vodacom" ? metrics.days.length : metrics.total} /></strong>{session.role === "btl" && <span className="hero-target"><small>OBJECTIF</small><b><AnimatedNumber value={filteredTargetTotal} /></b></span>}</div><small>sur {formatNumber(data.length)} activations</small></div></section><DateRangeFilter data={data} startDate={startDate} endDate={endDate} weeklyComment={weeklyComments[`${startDate}|${endDate}`]} onChange={(start, end) => { setStartDate(start); setEndDate(end); }} /><DashboardContent metrics={metrics} filtered={filtered} daily={dailyData(filtered)} targetDaily={targetDaily} fullDaily={dailyData(data)} fullTargetDaily={fullTargetDaily} dailyComments={dailyComments} rangeLabel={rangeLabel} startDate={startDate} endDate={endDate} role="btl" onRangeChange={(start, end) => { setStartDate(start); setEndDate(end); }} onToggleProgressTargets={session.role === "btl" ? () => setShowProgressTargets((value) => !value) : undefined} onToggleHistogramTargets={session.role === "btl" ? () => setShowHistogramTargets((value) => !value) : undefined} showProgressTargets={showProgressTargets} showHistogramTargets={showHistogramTargets} /></> : page === "activity" ? <ActivityPage filtered={filtered} rangeLabel={rangeLabel} role={session.role} /> : page === "activations" ? <ActivationAdminPage filtered={filtered} rangeLabel={rangeLabel} role={session.role} onEdit={onEditRecord} /> : page === "analysis" ? <AnalysisPage filtered={filtered} rangeLabel={rangeLabel} role={session.role} /> : page === "quality" ? <QualityPage filtered={filtered} issues={issues} rangeLabel={rangeLabel} role={session.role} /> : page === "import" ? <ImportPage allData={data} onImport={onImport} role={session.role} supabaseConfig={supabaseConfig} onAdminAuthenticate={onAdminAuthenticate} onSupabaseSync={onSupabaseSync} /> : page === "settings" ? <SettingsPage settings={settings} onSettings={onSettings} role={session.role} /> : <ModulePreview page={page} filtered={filtered} metrics={metrics} rangeLabel={rangeLabel} role={session.role} allData={data} onEdit={onEditRecord} settings={settings} />}
      {reportOpen && <ReportExport data={data} filtered={filtered} fullDaily={dailyData(data)} startDate={startDate} endDate={endDate} rangeLabel={rangeLabel} role={session.role} formatNumber={formatNumber} formatDate={formatDate} onClose={() => setReportOpen(false)} />}{helpGuideOpen && <HelpGuideModal onClose={() => setHelpGuideOpen(false)} />}
    </main><MobileProfileControl session={session} accountOpen={accountOpen} accountPasswordOpen={accountPasswordOpen} accountPassword={accountPassword} accountPasswordError={accountPasswordError} accountRef={mobileProfileRef} onToggle={() => setAccountOpen((value) => !value)} onSwitchRole={onSwitchRole} onLogout={onLogout} onPasswordChange={(value) => { setAccountPassword(value); setAccountPasswordError(""); }} onPasswordSubmit={confirmBtlSwitch} onCancelPassword={() => { setAccountPasswordOpen(false); setAccountPasswordError(""); }} />
  </div>;
}

function DashboardContent({ metrics, filtered, daily, targetDaily, fullDaily, fullTargetDaily, dailyComments, rangeLabel, startDate, endDate, role, onRangeChange, onToggleProgressTargets, onToggleHistogramTargets, showProgressTargets = false, showHistogramTargets = false }: { metrics: ReturnType<typeof metricsOf>; filtered: Activation[]; daily: [string, number][]; targetDaily: [string, number][]; fullDaily: [string, number][]; fullTargetDaily: [string, number][]; dailyComments: Record<string, string>; rangeLabel: string; startDate: string; endDate: string; role: Role; onRangeChange: (startDate: string, endDate: string) => void; onToggleProgressTargets?: () => void; onToggleHistogramTargets?: () => void; showProgressTargets?: boolean; showHistogramTargets?: boolean }) {
  const [commentDetail, setCommentDetail] = useState<CommentDetail | null>(null);
  const targetByDate = new Map(targetDaily); const targetValues = daily.map(([date]) => targetByDate.get(date) ?? 0); const maxDay = Math.max(...daily.map(([, value]) => value), ...(showHistogramTargets ? targetValues : []), 1); const bestDay = daily.reduce<[string, number] | null>((best, current) => !best || current[1] > best[1] ? current : best, null);
  const openComment = (date: string, value: number, source: "curve" | "histogram") => { const comment = dailyComments[date]; if (comment) setCommentDetail({ date, label: formatDate(date), comment, value, source }); };
  return <><div className="dashboard-content"><div className="section-intro"><div><div className="eyebrow">INDICATEURS CLÉS <span className="eyebrow-line" /></div><h2>{role === "vodacom" ? "Les jours qui comptent." : "Ce qui bouge maintenant."}</h2></div><div className="section-note"><CalendarClock size={15} /> {rangeLabel}</div></div>{role === "btl" && <section className="metrics-grid"><MetricCard label="Total activations" value={formatNumber(metrics.total)} detail={`${formatDecimal(metrics.average)} en moyenne par jour`} icon={Gauge} accent="cyan" /><MetricCard label="Opt-in Privilège" value={formatNumber(metrics.privilege)} detail={`${Math.round((metrics.privilege / Math.max(metrics.total, 1)) * 100)} % du volume filtré`} icon={Zap} accent="mint" /><MetricCard label="Agents mobilisés" value={formatNumber(metrics.agents)} detail={`${formatNumber(metrics.total / Math.max(metrics.agents, 1))} activations par agent`} icon={Users} accent="lilac" /><MetricCard label="Shops couverts" value={formatNumber(metrics.shops)} detail={`${metrics.categoryCount} catégories actives`} icon={MapPin} accent="coral" /></section>}{role === "btl" && <ProgressionChart data={fullDaily} targetData={fullTargetDaily} showTargets={showProgressTargets} startDate={startDate} endDate={endDate} formatDate={formatDate} dailyComments={dailyComments} onCommentOpen={(date, value) => openComment(date, value, "curve")} onRangeChange={onRangeChange} onToggleTargets={onToggleProgressTargets} />}<section className="signal-layout"><article className="chart-card glass-card"><div className="card-heading"><div><div className="eyebrow">{role === "vodacom" ? "PRÉSENCE QUOTIDIENNE" : "CADENCE QUOTIDIENNE"}</div><h3>{role === "vodacom" ? "Les jours prestés de la campagne." : "Les activations, jour après jour."}</h3></div><div className="chart-legend"><span className="legend-swatch" /> {role === "vodacom" ? "Jours prestés" : "Activations"}<span className={`target-legend-animated ${showHistogramTargets ? "is-visible" : ""}`}><span className="target-legend-dot" /> Objectif</span><span className="legend-note">{daily.length} jours</span>{onToggleHistogramTargets && <button type="button" className={`target-dashboard-switch target-inline-switch ${showHistogramTargets ? "is-active" : ""}`} data-tooltip={showHistogramTargets ? "Masquer la cible quotidienne de l’histogramme" : "Afficher la cible quotidienne de l’histogramme"} aria-label={showHistogramTargets ? "Masquer la cible quotidienne de l’histogramme" : "Afficher la cible quotidienne de l’histogramme"} aria-pressed={showHistogramTargets} onClick={onToggleHistogramTargets}><i /><b>Objectifs</b></button>}</div></div><div className="bar-chart"><div className="y-axis"><span>{maxDay}</span><span>{Math.round(maxDay * .66)}</span><span>{Math.round(maxDay * .33)}</span><span>0</span></div><div className="chart-body"><TargetOverlay values={targetValues} max={maxDay} visible={showHistogramTargets} />{daily.map(([date, value], index) => { const hasComment = Boolean(dailyComments[date]); return <div className={`bar-column ${index === 0 ? "tooltip-left" : index === daily.length - 1 ? "tooltip-right" : ""} ${hasComment ? "has-comment" : ""}`} key={date} onClick={() => hasComment && openComment(date, value, "histogram")} role={hasComment ? "button" : undefined} tabIndex={hasComment ? 0 : -1} aria-label={hasComment ? `Lire le commentaire du ${formatDate(date)}` : undefined} onKeyDown={(event) => { if (hasComment && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openComment(date, value, "histogram"); } }}><div className="bar-value">{value}</div><div className="bar" style={{ height: `${Math.max(8, (value / maxDay) * 100)}%` }} /><span>{formatDate(date)}</span>{hasComment && <div className="bar-comment-tooltip"><strong>{formatDate(date)}</strong><span>{commentExcerpt(dailyComments[date])}</span></div>}</div>; })}</div></div></article>{role === "btl" && <article className="pulse-card glass-card"><div className="pulse-badge"><span className="pulse-ring" /> SIGNAL DU JOUR</div><h3>La période reste<br /><em>concentrée.</em></h3><p>Les activations se densifient sur les jours de présence les plus longs.</p><div className="pulse-stat"><span>Meilleur jour</span><strong>{bestDay ? formatDate(bestDay[0]) : "—"}</strong><small>{bestDay ? `${bestDay[1]} activations enregistrées` : "Aucune donnée"}</small></div></article>}</section>{role === "btl" && <section className="lower-grid"><article className="ranking-card glass-card"><div className="card-heading"><div><div className="eyebrow">RÉPARTITION TERRAIN</div><h3>Agents les plus actifs.</h3></div><button className="text-button">Voir le classement <ChevronDown size={14} /></button></div><div className="ranking-list">{metrics.topAgents.map(([agent, count], index) => <div className="ranking-row" key={agent}><span className="ranking-index">0{index + 1}</span><div className="ranking-main"><div className="ranking-name"><strong>{agent}</strong><span>{count} activations</span></div><div className="progress-track"><span style={{ width: `${(count / Math.max(metrics.topAgents[0]?.[1] ?? 1, 1)) * 100}%` }} /></div></div><span className="ranking-share">{Math.round((count / Math.max(metrics.total, 1)) * 100)}%</span></div>)}</div></article><article className="shops-card glass-card"><div className="card-heading"><div><div className="eyebrow">POINTS DE VENTE</div><h3>Les shops qui portent le volume.</h3></div><Store size={18} className="heading-icon" /></div><div className="shop-list">{metrics.topShops.slice(0, 4).map(([shop, count], index) => <div className="shop-row" key={shop}><div className={`shop-rank rank-${index + 1}`}>{index + 1}</div><div className="shop-main"><strong>{shop}</strong><span>Shop couvert · {count} activations</span></div><div className="shop-score">{Math.round((count / Math.max(metrics.total, 1)) * 100)}<small>%</small></div></div>)}</div><div className="shop-footer"><span><span className="footer-dot" /> {metrics.shops} shops actifs dans la sélection</span><button className="text-button">Explorer <ChevronRight size={14} /></button></div></article></section>}{role === "btl" && <section className="insight-strip glass-card"><div className="insight-icon"><BarChart3 size={19} /></div><div><div className="eyebrow">LECTURE RAPIDE</div><h3>{formatNumber(filtered.length)} lignes suivent le filtre du moment.</h3><p>Changez de semaine ou déplacez les poignées pour tester instantanément le comportement des indicateurs.</p></div><div className="insight-action"><span>FILTRE ACTIF</span><strong>{rangeLabel}</strong></div></section>}</div><CommentDetailModal detail={commentDetail} onClose={() => setCommentDetail(null)} /></>;
}

function ModulePreview({ page, filtered, metrics, rangeLabel, role, allData, onEdit, settings }: { page: string; filtered: Activation[]; metrics: ReturnType<typeof metricsOf>; rangeLabel: string; role: Role; allData: Activation[]; onEdit: (index: number, field: "a" | "s" | "cl" | "n", value: string) => void; settings: AppSettings }) {
  const label = page === "agents" ? "Performance agents" : "Performance shops"; const field = page === "agents" ? "a" : "s"; const rows = page === "agents" ? metrics.topAgents : metrics.topShops;
  const trendFor = (name: string) => { const source = filtered.filter((item) => item[field] === name); const series = dailyData(source); const targets = targetValueByDate(source, settings.targetMatrix); return { values: series.map(([, value]) => value), dates: series.map(([date]) => date), targets: series.map(([date]) => targets.get(date) ?? 0) }; };
  return <div className="module-page"><section className="module-heading glass-card"><div className="eyebrow">PILOTAGE TERRAIN <span className="eyebrow-line" /></div><h1>{label}</h1><p>La sélection courante contient {formatNumber(filtered.length)} activations sur {rangeLabel}.</p></section><section className="module-panel glass-card"><div className="panel-heading"><div><div className="eyebrow">CLASSEMENT + TRAJECTOIRE</div><h2>Volume et progression de la sélection</h2></div><span className="panel-caption">{role === "btl" ? "Volume + objectif" : "Lecture"}</span></div>{rows.map(([name, value], index) => { const trend = trendFor(name); return <div className="sub-list-row enriched-row" key={name}><span>0{index + 1}</span><div className="sub-list-main"><strong>{name}</strong><small>{page === "agents" ? "Agent" : "Point de vente"}</small></div><Sparkline values={trend.values} targets={role === "btl" ? trend.targets : []} dates={trend.dates} tone={page === "agents" ? "cyan" : "lilac"} /><b>{value}</b></div>; })}</section></div>;
}
