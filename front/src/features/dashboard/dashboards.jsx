import { useState } from "react";

// ── Paleta y tokens ──────────────────────────────────────────────
const COLORS = {
  navy:    "#0F2044",
  navyMid: "#1A3360",
  blue:    "#2563EB",
  blueSoft:"#3B82F6",
  accent:  "#F59E0B",
  accentSoft:"#FEF3C7",
  teal:    "#0D9488",
  tealSoft:"#CCFBF1",
  rose:    "#E11D48",
  roseSoft:"#FFE4E6",
  purple:  "#7C3AED",
  purpleSoft:"#EDE9FE",
  green:   "#16A34A",
  greenSoft:"#DCFCE7",
  slate:   "#64748B",
  slateLight:"#F1F5F9",
  white:   "#FFFFFF",
  border:  "#E2E8F0",
  text:    "#1E293B",
  textMid: "#475569",
};

// ── Iconos SVG inline ────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    book: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>,
    document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>,
    bell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>,
    user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>,
    arrow: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>,
    star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
    flag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>,
    logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>,
    folder: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>,
    pencil: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>,
    cog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>,
    inbox: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>,
    key: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>,
    link: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>,
    shield: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>,
  };
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} style={{flexShrink:0}}>
      {icons[name]}
    </svg>
  );
};

// ── Componentes base ─────────────────────────────────────────────
const Badge = ({ children, color = COLORS.blue, bg = "#EFF6FF" }) => (
  <span style={{
    display:"inline-flex", alignItems:"center", gap:4,
    padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700,
    color, background:bg, letterSpacing:"0.04em", textTransform:"uppercase"
  }}>{children}</span>
);

const StatCard = ({ icon, label, value, sub, color, bg }) => (
  <div style={{
    background: COLORS.white, borderRadius:14, padding:"20px 24px",
    border:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", gap:16,
    boxShadow:"0 1px 4px rgba(0,0,0,0.05)"
  }}>
    <div style={{
      width:48, height:48, borderRadius:12, background:bg,
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
    }}>
      <Icon name={icon} size={22} color={color}/>
    </div>
    <div>
      <div style={{fontSize:24, fontWeight:800, color:COLORS.text, lineHeight:1}}>{value}</div>
      <div style={{fontSize:13, color:COLORS.textMid, marginTop:2}}>{label}</div>
      {sub && <div style={{fontSize:11, color:COLORS.slate, marginTop:1}}>{sub}</div>}
    </div>
  </div>
);

const ActionItem = ({ icon, label, desc, color = COLORS.blue, bg, onClick }) => (
  <button onClick={onClick} style={{
    display:"flex", alignItems:"center", gap:14, width:"100%",
    background:"none", border:"none", padding:"10px 12px", borderRadius:10,
    cursor:"pointer", textAlign:"left", transition:"background 0.15s",
  }}
  onMouseEnter={e=>e.currentTarget.style.background=COLORS.slateLight}
  onMouseLeave={e=>e.currentTarget.style.background="none"}
  >
    <div style={{
      width:36, height:36, borderRadius:9, background:bg||"#EFF6FF",
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
    }}>
      <Icon name={icon} size={17} color={color}/>
    </div>
    <div style={{flex:1}}>
      <div style={{fontSize:14, fontWeight:600, color:COLORS.text}}>{label}</div>
      {desc && <div style={{fontSize:12, color:COLORS.slate, marginTop:1}}>{desc}</div>}
    </div>
    <Icon name="arrow" size={15} color={COLORS.slate}/>
  </button>
);

const Section = ({ title, icon, color = COLORS.blue, bg = "#EFF6FF", children, badge }) => (
  <div style={{
    background:COLORS.white, borderRadius:16, border:`1px solid ${COLORS.border}`,
    overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)"
  }}>
    <div style={{
      padding:"16px 20px", borderBottom:`1px solid ${COLORS.border}`,
      background:`linear-gradient(135deg, ${bg} 0%, ${COLORS.white} 100%)`,
      display:"flex", alignItems:"center", justifyContent:"space-between"
    }}>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <div style={{
          width:32, height:32, borderRadius:8, background:color,
          display:"flex", alignItems:"center", justifyContent:"center"
        }}>
          <Icon name={icon} size={16} color={COLORS.white}/>
        </div>
        <span style={{fontSize:14, fontWeight:700, color:COLORS.navy, letterSpacing:"-0.01em"}}>{title}</span>
      </div>
      {badge && <Badge color={color} bg={bg}>{badge}</Badge>}
    </div>
    <div style={{padding:"8px 12px 12px"}}>{children}</div>
  </div>
);

const AlertBanner = ({ type = "info", children }) => {
  const map = {
    info:    { bg:"#EFF6FF", border:COLORS.blue,   color:COLORS.blue,   icon:"bell"  },
    warning: { bg:COLORS.accentSoft, border:COLORS.accent, color:"#B45309", icon:"bell"  },
    success: { bg:COLORS.greenSoft,  border:COLORS.green,  color:COLORS.green,  icon:"check" },
    error:   { bg:COLORS.roseSoft,   border:COLORS.rose,   color:COLORS.rose,   icon:"flag"  },
  };
  const s = map[type];
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:10, padding:"12px 16px",
      background:s.bg, border:`1px solid ${s.border}20`, borderLeft:`3px solid ${s.border}`,
      borderRadius:10, marginBottom:8
    }}>
      <Icon name={s.icon} size={16} color={s.color}/>
      <span style={{fontSize:13, color:s.color, lineHeight:1.5}}>{children}</span>
    </div>
  );
};

// ── Topbar compartido ─────────────────────────────────────────────
const TopBar = ({ role, name, onSwitch }) => {
  const roleMap = {
    alumno:       { label:"Alumno Asignado",  color:COLORS.blue,   bg:"#EFF6FF"  },
    profesor:     { label:"Profesor",          color:COLORS.teal,   bg:COLORS.tealSoft },
    coordinacion: { label:"Coordinación",      color:COLORS.purple, bg:COLORS.purpleSoft },
  };
  const r = roleMap[role];
  return (
    <div style={{
      background:COLORS.navy, padding:"0 32px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      height:60, flexShrink:0
    }}>
      <div style={{display:"flex", alignItems:"center", gap:16}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:"linear-gradient(135deg,#2563EB,#1D4ED8)",
            display:"flex", alignItems:"center", justifyContent:"center"
          }}>
            <Icon name="shield" size={16} color={COLORS.white}/>
          </div>
          <span style={{color:COLORS.white, fontWeight:800, fontSize:15, letterSpacing:"-0.02em"}}>
            ESCOM <span style={{color:COLORS.accent}}>SS</span>
          </span>
        </div>
        <div style={{width:1, height:24, background:"rgba(255,255,255,0.15)"}}/>
        <Badge color={r.color} bg={r.bg}>{r.label}</Badge>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:12}}>
        <span style={{color:"rgba(255,255,255,0.7)", fontSize:13}}>{name}</span>
        <div style={{
          width:34, height:34, borderRadius:999,
          background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",
          display:"flex", alignItems:"center", justifyContent:"center"
        }}>
          <Icon name="user" size={16} color={COLORS.white}/>
        </div>
        <div style={{display:"flex", gap:6}}>
          {["alumno","profesor","coordinacion"].map(r=>(
            <button key={r} onClick={()=>onSwitch(r)} style={{
              padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600,
              border:"1px solid rgba(255,255,255,0.2)",
              background: role===r ? "rgba(255,255,255,0.15)" : "transparent",
              color: role===r ? COLORS.white : "rgba(255,255,255,0.5)",
              cursor:"pointer", textTransform:"capitalize"
            }}>{r}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Progreso visual ──────────────────────────────────────────────
const ProgressBar = ({ value, max, color = COLORS.blue }) => (
  <div style={{
    height:8, background:COLORS.slateLight, borderRadius:99, overflow:"hidden", marginTop:6
  }}>
    <div style={{
      width:`${Math.min(100,(value/max)*100)}%`, height:"100%",
      background:`linear-gradient(90deg, ${color}, ${color}aa)`,
      borderRadius:99, transition:"width 0.4s ease"
    }}/>
  </div>
);

// ══════════════════════════════════════════════════════════════════
// DASHBOARD ALUMNO
// ══════════════════════════════════════════════════════════════════
const DashboardAlumno = () => {
  const stats = [
    { icon:"clock",    label:"Horas acumuladas",   value:"312",  sub:"Meta: 480 hrs",     color:COLORS.blue,   bg:"#EFF6FF" },
    { icon:"document", label:"Reportes enviados",  value:"4",    sub:"2 pendientes",       color:COLORS.teal,   bg:COLORS.tealSoft },
    { icon:"check",    label:"Actividades activas",value:"6",    sub:"1 con entrega hoy",  color:COLORS.green,  bg:COLORS.greenSoft },
    { icon:"flag",     label:"Etapa de liberación",value:"—",    sub:"No iniciada",        color:COLORS.slate,  bg:COLORS.slateLight },
  ];

  return (
    <div style={{flex:1, overflowY:"auto", padding:"28px 32px", background:"#F8FAFC"}}>

      {/* Header */}
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22, fontWeight:800, color:COLORS.navy, margin:0, letterSpacing:"-0.02em"}}>
          Bienvenida, <span style={{color:COLORS.blue}}>María González</span> 👋
        </h1>
        <p style={{color:COLORS.textMid, fontSize:14, margin:"4px 0 0"}}>
          Periodo activo: <strong>2025-2</strong> · Oferta: <em>Desarrollo de software para biblioteca ESCOM</em>
        </p>
      </div>

      {/* Alertas */}
      <div style={{marginBottom:20}}>
        <AlertBanner type="warning">Tienes un reporte mensual con fecha límite el <strong>15 de abril</strong>. Genera y firma antes de la fecha.</AlertBanner>
        <AlertBanner type="info">Nueva bitácora disponible para registrar. Recuerda que solo puedes registrar una por día.</AlertBanner>
      </div>

      {/* Stats */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24}}>
        {stats.map(s=><StatCard key={s.label} {...s}/>)}
      </div>

      {/* Progreso de horas */}
      <div style={{
        background:COLORS.white, borderRadius:14, padding:"18px 24px",
        border:`1px solid ${COLORS.border}`, marginBottom:24,
        boxShadow:"0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
          <span style={{fontSize:14, fontWeight:700, color:COLORS.navy}}>Progreso de horas</span>
          <span style={{fontSize:13, color:COLORS.blue, fontWeight:700}}>312 / 480 hrs</span>
        </div>
        <ProgressBar value={312} max={480} color={COLORS.blue}/>
        <div style={{display:"flex", justifyContent:"space-between", marginTop:6}}>
          <span style={{fontSize:11, color:COLORS.slate}}>65% completado</span>
          <span style={{fontSize:11, color:COLORS.slate}}>Restan 168 hrs</span>
        </div>
      </div>

      {/* Grid de secciones */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16}}>

        {/* Actividades y Horas */}
        <Section title="Actividades y Horas" icon="clock" color={COLORS.blue} bg="#EFF6FF" badge="1 urgente">
          <ActionItem icon="plus"     color={COLORS.blue}  bg="#EFF6FF"       label="Registrar bitácora del día"        desc="Solo se permite una bitácora por día"/>
          <ActionItem icon="book"     color={COLORS.teal}  bg={COLORS.tealSoft} label="Consultar actividades asignadas"  desc="6 actividades activas"/>
          <ActionItem icon="folder"   color={COLORS.slate} bg={COLORS.slateLight} label="Historial de actividades"       desc="Ver todas las actividades completadas"/>
          <ActionItem icon="chart"    color={COLORS.green} bg={COLORS.greenSoft}  label="Horas acumuladas"               desc="Detalle de horas por semana"/>
        </Section>

        {/* Reportes */}
        <Section title="Reportes" icon="document" color={COLORS.teal} bg={COLORS.tealSoft} badge="2 pendientes">
          <ActionItem icon="plus"     color={COLORS.teal}  bg={COLORS.tealSoft}  label="Generar reporte mensual"         desc="Reporte #5 disponible para generar"/>
          <ActionItem icon="check"    color={COLORS.blue}  bg="#EFF6FF"          label="Consultar estado de reportes"    desc="Ver el estado de tus reportes activos"/>
          <ActionItem icon="folder"   color={COLORS.slate} bg={COLORS.slateLight} label="Historial de reportes"          desc="Todos los reportes enviados"/>
        </Section>

        {/* Administrativa */}
        <Section title="Administrativa" icon="cog" color={COLORS.purple} bg={COLORS.purpleSoft}>
          <ActionItem icon="bell"     color={COLORS.accent} bg={COLORS.accentSoft}  label="Anuncios del sistema"          desc="3 anuncios nuevos sin leer"/>
          <ActionItem icon="user"     color={COLORS.purple} bg={COLORS.purpleSoft}  label="Información de contacto del profesor" desc="Dr. Alejandro Méndez · ext. 52340"/>
          <ActionItem icon="pencil"   color={COLORS.blue}   bg="#EFF6FF"             label="Actualizar datos personales"   desc="Teléfono, correo personal"/>
          <ActionItem icon="logout"   color={COLORS.rose}   bg={COLORS.roseSoft}     label="Solicitar baja del servicio"   desc="Proceso irreversible, requiere justificación"/>
        </Section>

        {/* Liberación */}
        <Section title="Liberación del Servicio Social" icon="star" color={COLORS.accent} bg={COLORS.accentSoft}>
          <div style={{padding:"12px 12px 4px"}}>
            <div style={{
              background:COLORS.slateLight, borderRadius:10, padding:"14px 16px",
              display:"flex", alignItems:"center", gap:12, marginBottom:12
            }}>
              <div style={{
                width:40, height:40, borderRadius:10, background:COLORS.slateLight,
                border:`2px dashed ${COLORS.border}`,
                display:"flex", alignItems:"center", justifyContent:"center"
              }}>
                <Icon name="flag" size={18} color={COLORS.slate}/>
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:700, color:COLORS.textMid}}>Proceso no iniciado</div>
                <div style={{fontSize:12, color:COLORS.slate}}>Debes cumplir 480 hrs y tener 6 reportes aprobados</div>
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:12, color:COLORS.slate, marginBottom:4}}>
                <span>Requisito de horas</span><span style={{color:COLORS.blue,fontWeight:700}}>312/480</span>
              </div>
              <ProgressBar value={312} max={480} color={COLORS.slate}/>
            </div>
            <div>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:12, color:COLORS.slate, marginBottom:4}}>
                <span>Reportes aprobados</span><span style={{color:COLORS.blue,fontWeight:700}}>4/6</span>
              </div>
              <ProgressBar value={4} max={6} color={COLORS.slate}/>
            </div>
          </div>
          <ActionItem icon="arrow" color={COLORS.slate} bg={COLORS.slateLight} label="Ver proceso de liberación" desc="Disponible al cumplir los requisitos"/>
        </Section>

      </div>

      {/* Anuncios recientes */}
      <div style={{
        background:COLORS.white, borderRadius:14, border:`1px solid ${COLORS.border}`,
        padding:"16px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div style={{fontSize:14, fontWeight:700, color:COLORS.navy, marginBottom:12}}>Anuncios recientes</div>
        {[
          { from:"Dr. Alejandro Méndez", text:"Recuerden que la sesión de seguimiento es el viernes a las 10:00 AM en el cubículo B-203.", time:"Hace 2 horas", new:true },
          { from:"Coordinación SS",      text:"El periodo de entrega de reportes mensuales cierra el 15 de abril. No olviden firmar sus documentos.", time:"Ayer", new:true },
          { from:"Dr. Alejandro Méndez", text:"Actividades del mes de abril han sido actualizadas. Revisen las fechas límite.", time:"Hace 3 días", new:false },
        ].map((a,i)=>(
          <div key={i} style={{
            display:"flex", gap:12, padding:"10px 0",
            borderBottom: i<2?`1px solid ${COLORS.border}`:"none"
          }}>
            <div style={{
              width:36, height:36, borderRadius:999, flexShrink:0,
              background:`linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyMid})`,
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              <Icon name="user" size={16} color={COLORS.white}/>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:2}}>
                <span style={{fontSize:13, fontWeight:700, color:COLORS.text}}>{a.from}</span>
                {a.new && <Badge color={COLORS.blue} bg="#EFF6FF">Nuevo</Badge>}
                <span style={{fontSize:11, color:COLORS.slate, marginLeft:"auto"}}>{a.time}</span>
              </div>
              <p style={{fontSize:13, color:COLORS.textMid, margin:0, lineHeight:1.5}}>{a.text}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD PROFESOR
// ══════════════════════════════════════════════════════════════════
const DashboardProfesor = () => {
  const alumnos = [
    { nombre:"María González",    carrera:"ISC", horas:312, estado:"Al corriente",   color:COLORS.green,  bg:COLORS.greenSoft },
    { nombre:"Carlos Rodríguez",  carrera:"IIA", horas:410, estado:"Al corriente",   color:COLORS.green,  bg:COLORS.greenSoft },
    { nombre:"Andrea Martínez",   carrera:"ISC", horas:198, estado:"Con retraso",    color:COLORS.accent, bg:COLORS.accentSoft },
    { nombre:"Luis Hernández",    carrera:"LCD", horas:480, estado:"Completado",     color:COLORS.blue,   bg:"#EFF6FF" },
    { nombre:"Sofía Ramírez",     carrera:"IIA", horas:90,  estado:"Con retraso",    color:COLORS.rose,   bg:COLORS.roseSoft },
  ];

  return (
    <div style={{flex:1, overflowY:"auto", padding:"28px 32px", background:"#F8FAFC"}}>

      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22, fontWeight:800, color:COLORS.navy, margin:0, letterSpacing:"-0.02em"}}>
          Bienvenido, <span style={{color:COLORS.teal}}>Dr. Alejandro Méndez</span>
        </h1>
        <p style={{color:COLORS.textMid, fontSize:14, margin:"4px 0 0"}}>
          Departamento de Computación · Cubículo B-203 · Periodo <strong>2025-2</strong>
        </p>
      </div>

      <div style={{marginBottom:20}}>
        <AlertBanner type="warning">3 solicitudes de alumnos pendientes de respuesta.</AlertBanner>
        <AlertBanner type="info">2 reportes mensuales esperan tu revisión y firma.</AlertBanner>
      </div>

      {/* Stats */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24}}>
        <StatCard icon="users"    label="Alumnos asignados"      value="5"  sub="Periodo 2025-2"      color={COLORS.teal}   bg={COLORS.tealSoft}/>
        <StatCard icon="inbox"    label="Solicitudes pendientes"  value="3"  sub="Sin responder"       color={COLORS.accent} bg={COLORS.accentSoft}/>
        <StatCard icon="document" label="Reportes por revisar"    value="2"  sub="Con fecha límite hoy" color={COLORS.rose}   bg={COLORS.roseSoft}/>
        <StatCard icon="folder"   label="Ofertas activas"         value="2"  sub="1 proyecto, 1 individual" color={COLORS.blue} bg="#EFF6FF}"/>
      </div>

      {/* Alumnos resumen */}
      <div style={{
        background:COLORS.white, borderRadius:14, border:`1px solid ${COLORS.border}`,
        marginBottom:20, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          padding:"14px 20px", borderBottom:`1px solid ${COLORS.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:`linear-gradient(135deg, ${COLORS.tealSoft} 0%, ${COLORS.white} 100%)`
        }}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:COLORS.teal,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name="users" size={16} color={COLORS.white}/>
            </div>
            <span style={{fontSize:14, fontWeight:700, color:COLORS.navy}}>Mis Alumnos — Resumen de Horas</span>
          </div>
          <Badge color={COLORS.teal} bg={COLORS.tealSoft}>5 alumnos</Badge>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:COLORS.slateLight}}>
                {["Alumno","Carrera","Horas","Progreso","Estado","Acciones"].map(h=>(
                  <th key={h} style={{padding:"10px 16px", fontSize:11, fontWeight:700, color:COLORS.slate, textAlign:"left", textTransform:"uppercase", letterSpacing:"0.05em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${COLORS.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=COLORS.slateLight}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}
                >
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:30,height:30,borderRadius:999,background:`linear-gradient(135deg,${COLORS.navy},${COLORS.navyMid})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Icon name="user" size={14} color={COLORS.white}/>
                      </div>
                      <span style={{fontSize:13,fontWeight:600,color:COLORS.text}}>{a.nombre}</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 16px",fontSize:13,color:COLORS.textMid}}>{a.carrera}</td>
                  <td style={{padding:"12px 16px",fontSize:13,fontWeight:700,color:COLORS.text}}>{a.horas}/480</td>
                  <td style={{padding:"12px 16px",minWidth:120}}>
                    <ProgressBar value={a.horas} max={480} color={a.color}/>
                  </td>
                  <td style={{padding:"12px 16px"}}>
                    <Badge color={a.color} bg={a.bg}>{a.estado}</Badge>
                  </td>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      {[{icon:"book",label:"Actividades"},{icon:"document",label:"Reportes"},{icon:"clock",label:"Bitácoras"}].map(btn=>(
                        <button key={btn.label} title={btn.label} style={{
                          width:28,height:28,borderRadius:7,border:`1px solid ${COLORS.border}`,
                          background:COLORS.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background=COLORS.slateLight}
                        onMouseLeave={e=>e.currentTarget.style.background=COLORS.white}
                        ><Icon name={btn.icon} size={13} color={COLORS.slate}/></button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid secciones */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16}}>

        <Section title="Actividades y Horas" icon="clock" color={COLORS.teal} bg={COLORS.tealSoft}>
          <ActionItem icon="chart"  color={COLORS.teal}  bg={COLORS.tealSoft}   label="Acumulado de horas por alumno"  desc="Ver el progreso detallado de cada alumno"/>
          <ActionItem icon="plus"   color={COLORS.blue}  bg="#EFF6FF"           label="Asignar actividades por alumno"  desc="Crear y asignar nuevas actividades"/>
          <ActionItem icon="book"   color={COLORS.green} bg={COLORS.greenSoft}  label="Revisar bitácoras por alumno"   desc="2 bitácoras pendientes de revisión"/>
        </Section>

        <Section title="Registro de Alumnos" icon="users" color={COLORS.blue} bg="#EFF6FF" badge="3 pendientes">
          <AlertBanner type="warning">3 solicitudes esperan tu respuesta. La más antigua tiene 5 días.</AlertBanner>
          <ActionItem icon="check"  color={COLORS.blue}  bg="#EFF6FF"  label="Aceptar o rechazar solicitudes"  desc="3 solicitudes pendientes"/>
        </Section>

        <Section title="Reportes" icon="document" color={COLORS.rose} bg={COLORS.roseSoft} badge="2 por revisar">
          <ActionItem icon="pencil" color={COLORS.rose}   bg={COLORS.roseSoft}  label="Revisar y firmar reporte"       desc="2 reportes esperan tu revisión y firma"/>
        </Section>

        <Section title="Gestión de Ofertas" icon="folder" color={COLORS.purple} bg={COLORS.purpleSoft}>
          <ActionItem icon="plus"   color={COLORS.purple} bg={COLORS.purpleSoft} label="Solicitar apertura de oferta"   desc="Nueva oferta de proyecto o individual"/>
          <ActionItem icon="folder" color={COLORS.slate}  bg={COLORS.slateLight} label="Historial de ofertas"           desc="Consultar ofertas anteriores y activas"/>
        </Section>

        <Section title="Administrativa" icon="cog" color={COLORS.slate} bg={COLORS.slateLight}>
          <ActionItem icon="pencil" color={COLORS.blue}   bg="#EFF6FF"           label="Actualizar datos personales"    desc="Teléfono, cubículo, departamento"/>
          <ActionItem icon="bell"   color={COLORS.accent} bg={COLORS.accentSoft} label="Publicar anuncio a mis alumnos" desc="Notificar a todos o a un alumno específico"/>
          <ActionItem icon="logout" color={COLORS.rose}   bg={COLORS.roseSoft}   label="Solicitar baja de alumno"       desc="Requiere justificación documentada"/>
        </Section>

        <Section title="Liberación del Servicio Social" icon="star" color={COLORS.accent} bg={COLORS.accentSoft} badge="1 pendiente">
          <AlertBanner type="info">Luis Hernández solicitó evaluación de desempeño. Pendiente de tu revisión.</AlertBanner>
          <ActionItem icon="star"   color={COLORS.accent} bg={COLORS.accentSoft} label="Evaluar desempeño de alumno"   desc="1 evaluación pendiente de completar"/>
        </Section>

      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD COORDINACIÓN
// ══════════════════════════════════════════════════════════════════
const DashboardCoordinacion = () => {
  const pendientes = [
    { label:"Solicitudes de registro", value:8,  icon:"inbox",    color:COLORS.blue,   bg:"#EFF6FF" },
    { label:"Expedientes LSS",         value:3,  icon:"folder",   color:COLORS.purple, bg:COLORS.purpleSoft },
    { label:"Reportes por revisar",    value:11, icon:"document", color:COLORS.teal,   bg:COLORS.tealSoft },
    { label:"Ofertas por validar",     value:2,  icon:"star",     color:COLORS.accent, bg:COLORS.accentSoft },
  ];

  const lssItems = [
    { alumno:"Luis Hernández",   etapa:"Evaluación de desempeño", estado:"Pendiente dictamen", color:COLORS.accent, bg:COLORS.accentSoft },
    { alumno:"Andrea Martínez",  etapa:"Carta de término",        estado:"Lista para entregar",color:COLORS.green,  bg:COLORS.greenSoft },
    { alumno:"Pedro Sánchez",    etapa:"Expediente",              estado:"En revisión",        color:COLORS.blue,   bg:"#EFF6FF" },
    { alumno:"Diana López",      etapa:"Constancia de término",   estado:"Pendiente emisión",  color:COLORS.purple, bg:COLORS.purpleSoft },
  ];

  return (
    <div style={{flex:1, overflowY:"auto", padding:"28px 32px", background:"#F8FAFC"}}>

      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22, fontWeight:800, color:COLORS.navy, margin:0, letterSpacing:"-0.02em"}}>
          Panel de <span style={{color:COLORS.purple}}>Coordinación</span>
        </h1>
        <p style={{color:COLORS.textMid, fontSize:14, margin:"4px 0 0"}}>
          Lic. Carmen Torres · Periodo activo: <strong>2025-2</strong> · 47 alumnos registrados
        </p>
      </div>

      <div style={{marginBottom:20}}>
        <AlertBanner type="error">8 solicitudes de alumnos llevan más de 3 días sin respuesta.</AlertBanner>
        <AlertBanner type="warning">El periodo de registro cierra en <strong>12 días</strong>. Hay documentación pendiente de validar.</AlertBanner>
      </div>

      {/* Stats */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24}}>
        {pendientes.map(p=><StatCard key={p.label} icon={p.icon} label={p.label} value={p.value} sub="Requieren atención" color={p.color} bg={p.bg}/>)}
      </div>

      {/* Métricas generales */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20
      }}>
        {[
          { label:"Alumnos con horas completas", value:"12", total:47, color:COLORS.green },
          { label:"Alumnos en proceso de liberación", value:"4", total:47, color:COLORS.purple },
          { label:"Reportes aprobados este mes", value:"23", total:30, color:COLORS.teal },
        ].map(m=>(
          <div key={m.label} style={{
            background:COLORS.white, borderRadius:12, padding:"16px 18px",
            border:`1px solid ${COLORS.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.04)"
          }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <span style={{fontSize:13, color:COLORS.textMid, maxWidth:140, lineHeight:1.4}}>{m.label}</span>
              <span style={{fontSize:22, fontWeight:800, color:m.color}}>{m.value}</span>
            </div>
            <ProgressBar value={parseInt(m.value)} max={m.total} color={m.color}/>
            <div style={{fontSize:11, color:COLORS.slate, marginTop:4}}>de {m.total} alumnos</div>
          </div>
        ))}
      </div>

      {/* LSS en curso */}
      <div style={{
        background:COLORS.white, borderRadius:14, border:`1px solid ${COLORS.border}`,
        marginBottom:20, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          padding:"14px 20px", borderBottom:`1px solid ${COLORS.border}`,
          background:`linear-gradient(135deg, ${COLORS.purpleSoft} 0%, ${COLORS.white} 100%)`,
          display:"flex", justifyContent:"space-between", alignItems:"center"
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:COLORS.purple,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name="flag" size={16} color={COLORS.white}/>
            </div>
            <span style={{fontSize:14, fontWeight:700, color:COLORS.navy}}>Procesos de Liberación Activos</span>
          </div>
          <Badge color={COLORS.purple} bg={COLORS.purpleSoft}>4 alumnos</Badge>
        </div>
        <div style={{padding:"8px 12px 12px"}}>
          {lssItems.map((item,i)=>(
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:14, padding:"10px 8px",
              borderBottom: i<lssItems.length-1?`1px solid ${COLORS.border}`:"none"
            }}>
              <div style={{width:34,height:34,borderRadius:999,background:`linear-gradient(135deg,${COLORS.navy},${COLORS.navyMid})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon name="user" size={15} color={COLORS.white}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:COLORS.text}}>{item.alumno}</div>
                <div style={{fontSize:12,color:COLORS.slate}}>{item.etapa}</div>
              </div>
              <Badge color={item.color} bg={item.bg}>{item.estado}</Badge>
              <button style={{
                padding:"5px 12px", borderRadius:7, fontSize:12, fontWeight:600,
                background:COLORS.navy, color:COLORS.white, border:"none", cursor:"pointer"
              }}>Gestionar</button>
            </div>
          ))}
        </div>
      </div>

      {/* Grid secciones */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16}}>

        <Section title="Actividades y Horas" icon="clock" color={COLORS.teal} bg={COLORS.tealSoft}>
          <ActionItem icon="chart"  color={COLORS.teal}  bg={COLORS.tealSoft}    label="Acumulado de horas por alumno"    desc="Ver progreso general del grupo"/>
          <ActionItem icon="book"   color={COLORS.blue}  bg="#EFF6FF"            label="Consultar actividades por alumno" desc="Revisar actividades asignadas"/>
        </Section>

        <Section title="Registro de Alumnos" icon="users" color={COLORS.blue} bg="#EFF6FF" badge="8 pendientes">
          <ActionItem icon="document" color={COLORS.blue}   bg="#EFF6FF"           label="Revisar documentación inicial"       desc="8 solicitudes sin responder"/>
          <ActionItem icon="check"    color={COLORS.green}  bg={COLORS.greenSoft}  label="Validar carta compromiso"            desc="Entrega presencial por alumno"/>
          <ActionItem icon="folder"   color={COLORS.purple} bg={COLORS.purpleSoft} label="Revisar expediente de registro"      desc="Validación final de documentos"/>
        </Section>

        <Section title="Reportes" icon="document" color={COLORS.teal} bg={COLORS.tealSoft} badge="11 pendientes">
          <ActionItem icon="chart"    color={COLORS.teal}   bg={COLORS.tealSoft}   label="Estado de reportes"                  desc="Vista general por alumno y periodo"/>
          <ActionItem icon="folder"   color={COLORS.slate}  bg={COLORS.slateLight} label="Historial de reportes enviados"      desc="Todos los reportes del periodo"/>
          <ActionItem icon="pencil"   color={COLORS.rose}   bg={COLORS.roseSoft}   label="Revisar y dictaminar reporte"        desc="11 reportes esperan dictamen"/>
        </Section>

        <Section title="Gestión de Ofertas" icon="star" color={COLORS.accent} bg={COLORS.accentSoft} badge="2 solicitudes">
          <ActionItem icon="check"    color={COLORS.accent}  bg={COLORS.accentSoft} label="Revisar solicitudes de apertura"    desc="2 solicitudes de profesores"/>
          <ActionItem icon="cog"      color={COLORS.purple}  bg={COLORS.purpleSoft} label="Modificar características de profesor" desc="Roles y cupos extra"/>
          <ActionItem icon="folder"   color={COLORS.blue}    bg="#EFF6FF"           label="Consultar proyectos registrados"    desc="Catálogo completo de ofertas"/>
        </Section>

        <Section title="Administrativa" icon="cog" color={COLORS.slate} bg={COLORS.slateLight}>
          <ActionItem icon="calendar" color={COLORS.blue}   bg="#EFF6FF"           label="Gestionar calendario escolar"       desc="Periodos, días inhábiles, vacaciones"/>
          <ActionItem icon="bell"     color={COLORS.accent} bg={COLORS.accentSoft} label="Publicar anuncio"                  desc="Para todos los alumnos o por profesor"/>
          <ActionItem icon="link"     color={COLORS.teal}   bg={COLORS.tealSoft}   label="Gestionar medios de contacto"      desc="Información institucional visible"/>
          <ActionItem icon="key"      color={COLORS.purple} bg={COLORS.purpleSoft} label="Gestionar recursos del SS"         desc="Documentos y guías del servicio"/>
        </Section>

        <Section title="Liberación del Servicio Social" icon="flag" color={COLORS.purple} bg={COLORS.purpleSoft} badge="4 activos">
          <ActionItem icon="star"     color={COLORS.accent}  bg={COLORS.accentSoft} label="Dictaminar evaluación de desempeño" desc="1 evaluación pendiente de dictamen"/>
          <ActionItem icon="document" color={COLORS.blue}    bg="#EFF6FF"           label="Gestionar carta de término"         desc="1 carta lista para entregar"/>
          <ActionItem icon="folder"   color={COLORS.teal}    bg={COLORS.tealSoft}   label="Dictaminar expediente"              desc="1 expediente en revisión"/>
          <ActionItem icon="check"    color={COLORS.green}   bg={COLORS.greenSoft}  label="Gestionar constancia de término"   desc="1 constancia pendiente de emisión"/>
        </Section>

      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// APP RAÍZ
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [role, setRole] = useState("alumno");

  const names = {
    alumno:       "María González",
    profesor:     "Dr. Alejandro Méndez",
    coordinacion: "Lic. Carmen Torres",
  };

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100vh",
      fontFamily:"'Segoe UI', system-ui, sans-serif",
      background:"#F8FAFC", color:COLORS.text
    }}>
      <TopBar role={role} name={names[role]} onSwitch={setRole}/>

      {/* Barra de rol */}
      <div style={{
        background:COLORS.white, borderBottom:`1px solid ${COLORS.border}`,
        padding:"0 32px", display:"flex", alignItems:"center", height:44, gap:6
      }}>
        <Icon name="shield" size={13} color={COLORS.slate}/>
        <span style={{fontSize:12, color:COLORS.slate}}>Inicio</span>
        <Icon name="arrow" size={12} color={COLORS.slate}/>
        <span style={{fontSize:12, color:COLORS.navy, fontWeight:600}}>
          {role === "alumno" ? "Mi Panel" : role === "profesor" ? "Panel Profesor" : "Panel Coordinación"}
        </span>
        <div style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:6}}>
          <div style={{width:6, height:6, borderRadius:99, background:COLORS.green}}/>
          <span style={{fontSize:11, color:COLORS.slate}}>Sistema activo · Periodo 2025-2</span>
        </div>
      </div>

      {/* Contenido según rol */}
      {role === "alumno"       && <DashboardAlumno/>}
      {role === "profesor"     && <DashboardProfesor/>}
      {role === "coordinacion" && <DashboardCoordinacion/>}
    </div>
  );
}
