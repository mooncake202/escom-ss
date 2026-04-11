import { useState } from "react";

// ── Tokens de diseño — misma paleta del sistema ───────────────────
const C = {
  navy:        "#0F2044",
  navyMid:     "#1A3360",
  blue:        "#2563EB",
  blueSoft:    "#EFF6FF",
  accent:      "#F59E0B",
  accentSoft:  "#FEF3C7",
  green:       "#16A34A",
  greenSoft:   "#DCFCE7",
  rose:        "#E11D48",
  roseSoft:    "#FFE4E6",
  slate:       "#64748B",
  slateLight:  "#F1F5F9",
  border:      "#E2E8F0",
  text:        "#1E293B",
  textMid:     "#475569",
  white:       "#FFFFFF",
};

// ── Iconos SVG ────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const paths = {
    mail:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>,
    lock:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>,
    eye:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>,
    eyeOff:  <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></>,
    check:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    arrow:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>,
    shield:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>,
    warn:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>,
    send:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>,
    key:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>,
    refresh: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>,
  };
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} style={{flexShrink:0}}>
      {paths[name]}
    </svg>
  );
};

// ── Layout compartido ─────────────────────────────────────────────
const Shell = ({ children, wide = false }) => (
  <div style={{
    minHeight:"100vh", background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 50%, #162d5a 100%)`,
    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    padding:24, position:"relative", overflow:"hidden"
  }}>
    {/* Fondo decorativo */}
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-120,right:-120,width:400,height:400,borderRadius:"50%",background:"rgba(37,99,235,0.08)"}}/>
      <div style={{position:"absolute",bottom:-80,left:-80,width:300,height:300,borderRadius:"50%",background:"rgba(37,99,235,0.06)"}}/>
      <div style={{position:"absolute",top:"40%",left:"10%",width:180,height:180,borderRadius:"50%",background:"rgba(245,158,11,0.04)"}}/>
    </div>

    {/* Logo */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32,zIndex:1}}>
      <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name="shield" size={18} color={C.white}/>
      </div>
      <span style={{color:C.white,fontWeight:800,fontSize:18,letterSpacing:"-0.02em",fontFamily:"Georgia,serif"}}>
        ESCOM <span style={{color:C.accent}}>SS</span>
      </span>
    </div>

    {/* Card */}
    <div style={{
      background:C.white, borderRadius:20, padding:wide?"40px 48px":"40px 44px",
      width:"100%", maxWidth: wide ? 520 : 440,
      boxShadow:"0 24px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.1)",
      zIndex:1
    }}>
      {children}
    </div>

    <p style={{color:"rgba(255,255,255,0.35)",fontSize:11,marginTop:24,zIndex:1}}>
      Sistema de Servicio Social · ESCOM · IPN
    </p>
  </div>
);

// ── Input reutilizable ────────────────────────────────────────────
const Input = ({ label, type="text", value, onChange, placeholder, icon, error, hint, rightEl, disabled }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{marginBottom:error?8:16}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:C.text,marginBottom:6}}>{label}</label>
      <div style={{position:"relative"}}>
        {icon && (
          <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
            <Icon name={icon} size={16} color={focused ? C.blue : C.slate}/>
          </div>
        )}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          disabled={disabled}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{
            width:"100%", padding: icon ? "11px 40px 11px 38px" : "11px 40px 11px 14px",
            border:`1.5px solid ${error ? C.rose : focused ? C.blue : C.border}`,
            borderRadius:10, fontSize:14, color:C.text, outline:"none",
            background: disabled ? C.slateLight : C.white,
            boxSizing:"border-box", transition:"border-color 0.15s",
            boxShadow: focused && !error ? `0 0 0 3px ${C.blueSoft}` : "none"
          }}
        />
        {rightEl && (
          <div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)"}}>
            {rightEl}
          </div>
        )}
      </div>
      {error && <p style={{fontSize:12,color:C.rose,margin:"4px 0 8px",display:"flex",alignItems:"center",gap:4}}><Icon name="warn" size={13} color={C.rose}/>{error}</p>}
      {hint && !error && <p style={{fontSize:12,color:C.slate,margin:"4px 0 0"}}>{hint}</p>}
    </div>
  );
};

// ── Botón principal ───────────────────────────────────────────────
const Btn = ({ children, onClick, disabled, loading, variant="primary", icon }) => {
  const styles = {
    primary: { background:`linear-gradient(135deg, ${C.blue}, #1D4ED8)`, color:C.white, border:"none" },
    ghost:   { background:"none", color:C.slate, border:`1.5px solid ${C.border}` },
    danger:  { background:`linear-gradient(135deg, ${C.rose}, #BE123C)`, color:C.white, border:"none" },
  };
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      ...styles[variant],
      width:"100%", padding:"12px 20px", borderRadius:10, fontSize:14, fontWeight:700,
      cursor: disabled||loading ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      transition:"opacity 0.15s, transform 0.1s",
    }}
    onMouseEnter={e=>{ if(!disabled&&!loading) e.currentTarget.style.opacity="0.9" }}
    onMouseLeave={e=>{ e.currentTarget.style.opacity="1" }}
    >
      {loading ? (
        <div style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid white",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      ) : icon ? <Icon name={icon} size={16} color="white"/> : null}
      {children}
    </button>
  );
};

// ── Indicador de fortaleza ────────────────────────────────────────
const StrengthBar = ({ password }) => {
  const checks = [
    { label:"Mínimo 8 caracteres",  ok: password.length >= 8 },
    { label:"Una mayúscula",         ok: /[A-Z]/.test(password) },
    { label:"Una minúscula",         ok: /[a-z]/.test(password) },
    { label:"Un número",             ok: /[0-9]/.test(password) },
    { label:"Un carácter especial",  ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c=>c.ok).length;
  const colors = ["#E2E8F0","#E11D48","#F59E0B","#F59E0B","#16A34A","#16A34A"];
  const labels = ["","Muy débil","Débil","Regular","Fuerte","Muy fuerte"];

  if (!password) return null;

  return (
    <div style={{marginBottom:16,marginTop:-8}}>
      <div style={{display:"flex",gap:4,marginBottom:6}}>
        {[1,2,3,4,5].map(i=>(
          <div key={i} style={{flex:1,height:4,borderRadius:99,background: i<=score ? colors[score] : C.border,transition:"background 0.3s"}}/>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px"}}>
          {checks.map(c=>(
            <span key={c.label} style={{fontSize:11,color: c.ok ? C.green : C.slate,display:"flex",alignItems:"center",gap:3}}>
              <span style={{fontSize:10}}>{c.ok?"✓":"○"}</span>{c.label}
            </span>
          ))}
        </div>
        <span style={{fontSize:11,fontWeight:700,color:colors[score],whiteSpace:"nowrap",marginLeft:8}}>{labels[score]}</span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// VISTA 1 — Solicitar restablecimiento (desde login)
// ══════════════════════════════════════════════════════════════════
const V1_SolicitarRestablecimiento = ({ onNext, onBack }) => {
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState(null); // null | "registrado" | "no-registrado"
  const [loading, setLoading] = useState(false);

  const validar = () => {
    if (!correo) return "Ingresa tu correo institucional.";
    if (!correo.endsWith("@escom.ipn.mx") && !correo.endsWith("@ipn.mx"))
      return "Ingresa un correo institucional válido (@escom.ipn.mx o @ipn.mx).";
    return null;
  };

  const [error, setError] = useState(null);

  const handleSubmit = () => {
    const err = validar();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulación: correos que "existen"
      if (correo === "mgonzalez@escom.ipn.mx") {
        setEstado("registrado");
      } else {
        setEstado("no-registrado");
      }
    }, 1200);
  };

  if (estado === "registrado") {
    return (
      <Shell>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{textAlign:"center",animation:"fadeUp 0.4s ease"}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:C.greenSoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
            <Icon name="send" size={28} color={C.green}/>
          </div>
          <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:"0 0 8px",fontFamily:"Georgia,serif"}}>Revisa tu correo</h2>
          <p style={{fontSize:14,color:C.textMid,lineHeight:1.6,margin:"0 0 8px"}}>
            El correo <strong style={{color:C.navy}}>{correo}</strong> está registrado en el sistema.
          </p>
          <p style={{fontSize:14,color:C.textMid,lineHeight:1.6,margin:"0 0 24px"}}>
            Hemos enviado un enlace de restablecimiento. Revisa tu bandeja de entrada — el enlace es válido por <strong>30 minutos</strong>.
          </p>
          <div style={{background:C.accentSoft,border:`1px solid ${C.accent}30`,borderLeft:`3px solid ${C.accent}`,borderRadius:10,padding:"12px 16px",textAlign:"left",marginBottom:24}}>
            <p style={{fontSize:13,color:"#92400E",margin:0,lineHeight:1.5}}>
              Si no ves el correo en tu bandeja principal, revisa la carpeta de <strong>spam o correo no deseado</strong>.
            </p>
          </div>
          <button onClick={onBack} style={{
            background:"none",border:"none",color:C.blue,fontSize:14,fontWeight:600,
            cursor:"pointer",display:"flex",alignItems:"center",gap:6,margin:"0 auto"
          }}>
            <Icon name="arrow" size={15} color={C.blue}/>Volver al inicio de sesión
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{animation:"fadeUp 0.35s ease"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.slate,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginBottom:24,padding:0}}>
          <Icon name="arrow" size={14} color={C.slate}/>Volver al inicio de sesión
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{width:40,height:40,borderRadius:10,background:C.blueSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="key" size={20} color={C.blue}/>
          </div>
          <div>
            <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:0,fontFamily:"Georgia,serif"}}>¿Olvidaste tu contraseña?</h2>
          </div>
        </div>
        <p style={{fontSize:14,color:C.textMid,lineHeight:1.6,margin:"0 0 24px"}}>
          Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <Input
          label="Correo institucional"
          type="email"
          value={correo}
          onChange={e=>{setCorreo(e.target.value);setError(null);setEstado(null)}}
          placeholder="usuario@escom.ipn.mx"
          icon="mail"
          error={error || (estado==="no-registrado" ? null : undefined)}
        />

        {/* Flujo alterno 2.1 — correo no registrado */}
        {estado === "no-registrado" && (
          <div style={{
            background:C.roseSoft, border:`1px solid ${C.rose}30`,
            borderLeft:`3px solid ${C.rose}`, borderRadius:10,
            padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-start"
          }}>
            <Icon name="warn" color={C.rose}/>
            <p style={{fontSize:13,color:C.rose,margin:0,lineHeight:1.5}}>
              El correo <strong>{correo}</strong> no está registrado en el sistema. Acude al área de Servicio Social en la ESCOM para registrarte.
            </p>
          </div>
        )}

        <Btn onClick={handleSubmit} loading={loading} icon={loading?null:"send"}>
          {loading ? "Verificando..." : "Enviar enlace de restablecimiento"}
        </Btn>

        <p style={{fontSize:12,color:C.slate,textAlign:"center",marginTop:16}}>
          ¿Recuerdas tu contraseña?{" "}
          <button onClick={onBack} style={{background:"none",border:"none",color:C.blue,fontSize:12,fontWeight:600,cursor:"pointer",padding:0}}>
            Inicia sesión
          </button>
        </p>
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════
// VISTA 2 — Formulario de nueva contraseña (desde enlace)
// ══════════════════════════════════════════════════════════════════
const V2_NuevaContrasena = ({ onSuccess, linkValido = true }) => {
  const [pass, setPass]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [showP, setShowP]     = useState(false);
  const [showC, setShowC]     = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const checks = {
    len:     pass.length >= 8,
    upper:   /[A-Z]/.test(pass),
    lower:   /[a-z]/.test(pass),
    num:     /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  };
  const passOk = Object.values(checks).every(Boolean);

  const handleSubmit = () => {
    const errs = {};
    if (!passOk)          errs.pass    = "La contraseña no cumple los requisitos de seguridad.";
    if (pass !== confirm) errs.confirm = "Las contraseñas no coinciden.";
    if (pass === "Anterior123!") errs.pass = "La nueva contraseña no puede ser igual a la anterior."; // Simulación RN-CRED-05
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(()=>{ setLoading(false); onSuccess(); }, 1400);
  };

  // Flujo alterno 5.1 — enlace inválido o expirado
  if (!linkValido) {
    return (
      <Shell>
        <div style={{textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:C.roseSoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
            <Icon name="warn" size={28} color={C.rose}/>
          </div>
          <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:"0 0 8px",fontFamily:"Georgia,serif"}}>Enlace no válido</h2>
          <p style={{fontSize:14,color:C.textMid,lineHeight:1.6,margin:"0 0 24px"}}>
            El enlace de restablecimiento ha <strong>expirado</strong> o ya fue utilizado. Los enlaces son válidos por 30 minutos y de un solo uso.
          </p>
          <Btn onClick={()=>{}} icon="refresh">Solicitar nuevo enlace</Btn>
        </div>
      </Shell>
    );
  }

  return (
    <Shell wide>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{animation:"fadeUp 0.35s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{width:40,height:40,borderRadius:10,background:C.blueSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="lock" size={20} color={C.blue}/>
          </div>
          <div>
            <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:0,fontFamily:"Georgia,serif"}}>Crea tu nueva contraseña</h2>
          </div>
        </div>
        <p style={{fontSize:14,color:C.textMid,lineHeight:1.6,margin:"0 0 24px"}}>
          Elige una contraseña segura. Una vez actualizada podrás iniciar sesión con ella.
        </p>

        <Input
          label="Nueva contraseña"
          type={showP ? "text" : "password"}
          value={pass}
          onChange={e=>{setPass(e.target.value);setErrors(p=>({...p,pass:null}))}}
          placeholder="Mínimo 8 caracteres"
          icon="lock"
          error={errors.pass}
          rightEl={
            <button onClick={()=>setShowP(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>
              <Icon name={showP?"eyeOff":"eye"} size={16} color={C.slate}/>
            </button>
          }
        />

        <StrengthBar password={pass}/>

        <Input
          label="Confirmar nueva contraseña"
          type={showC ? "text" : "password"}
          value={confirm}
          onChange={e=>{setConfirm(e.target.value);setErrors(p=>({...p,confirm:null}))}}
          placeholder="Repite tu nueva contraseña"
          icon="lock"
          error={errors.confirm}
          rightEl={
            <button onClick={()=>setShowC(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>
              <Icon name={showC?"eyeOff":"eye"} size={16} color={C.slate}/>
            </button>
          }
        />

        <Btn onClick={handleSubmit} loading={loading} disabled={!pass||!confirm}>
          {loading ? "Actualizando contraseña..." : "Actualizar contraseña"}
        </Btn>
      </div>
    </Shell>
  );
};

// ══════════════════════════════════════════════════════════════════
// VISTA 3 — Éxito: contraseña actualizada
// ══════════════════════════════════════════════════════════════════
const V3_Exito = ({ onLogin }) => (
  <Shell>
    <style>{`@keyframes pop{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    <div style={{textAlign:"center",animation:"fadeUp 0.4s ease"}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:C.greenSoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"pop 0.5s ease"}}>
        <Icon name="check" size={36} color={C.green}/>
      </div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:"0 0 8px",fontFamily:"Georgia,serif"}}>¡Contraseña actualizada!</h2>
      <p style={{fontSize:14,color:C.textMid,lineHeight:1.6,margin:"0 0 24px"}}>
        Tu contraseña fue actualizada correctamente. Inicia sesión con tu nueva contraseña.
      </p>
      <Btn onClick={onLogin} icon="arrow">Ir al inicio de sesión</Btn>
    </div>
  </Shell>
);

// ══════════════════════════════════════════════════════════════════
// VISTA 4 — Cambio desde sesión activa
// ══════════════════════════════════════════════════════════════════
const V4_CambioEnSesion = ({ onDone, onCancel }) => {
  const [actual, setActual]   = useState("");
  const [pass, setPass]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [showA, setShowA]     = useState(false);
  const [showP, setShowP]     = useState(false);
  const [showC, setShowC]     = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const passOk = pass.length>=8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass);

  const handleSubmit = () => {
    const errs = {};
    if (!actual)          errs.actual  = "Ingresa tu contraseña actual.";
    if (!passOk)          errs.pass    = "La contraseña no cumple los requisitos de seguridad.";
    if (pass !== confirm) errs.confirm = "Las contraseñas no coinciden.";
    if (pass === actual && actual) errs.pass = "La nueva contraseña no puede ser igual a la actual.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(()=>{ setLoading(false); onDone(); }, 1400);
  };

  return (
    <div style={{
      minHeight:"100vh", background:C.slateLight,
      display:"flex", alignItems:"center", justifyContent:"center", padding:24
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Topbar simulado */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:60,background:C.navy,display:"flex",alignItems:"center",padding:"0 32px",gap:10,zIndex:10}}>
        <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="shield" size={16} color={C.white}/>
        </div>
        <span style={{color:C.white,fontWeight:800,fontSize:15,letterSpacing:"-0.02em",fontFamily:"Georgia,serif"}}>ESCOM <span style={{color:C.accent}}>SS</span></span>
        <div style={{flex:1}}/>
        <span style={{color:"rgba(255,255,255,0.5)",fontSize:13}}>María González · Alumno Asignado</span>
      </div>

      <div style={{
        background:C.white, borderRadius:20, padding:"36px 44px",
        width:"100%", maxWidth:480, marginTop:60,
        boxShadow:"0 8px 32px rgba(0,0,0,0.1)", animation:"fadeUp 0.35s ease"
      }}>
        <button onClick={onCancel} style={{background:"none",border:"none",color:C.slate,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,marginBottom:24,padding:0}}>
          <Icon name="arrow" size={14} color={C.slate}/>Volver al panel
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{width:40,height:40,borderRadius:10,background:C.blueSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="lock" size={20} color={C.blue}/>
          </div>
          <div>
            <h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:0,fontFamily:"Georgia,serif"}}>Cambiar contraseña</h2>
            <p style={{fontSize:13,color:C.slate,margin:0}}>Actualiza tu contraseña de acceso</p>
          </div>
        </div>

        <div style={{height:1,background:C.border,margin:"20px 0"}}/>

        <Input
          label="Contraseña actual"
          type={showA?"text":"password"}
          value={actual}
          onChange={e=>{setActual(e.target.value);setErrors(p=>({...p,actual:null}))}}
          placeholder="Tu contraseña actual"
          icon="lock"
          error={errors.actual}
          rightEl={
            <button onClick={()=>setShowA(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>
              <Icon name={showA?"eyeOff":"eye"} size={16} color={C.slate}/>
            </button>
          }
        />

        <Input
          label="Nueva contraseña"
          type={showP?"text":"password"}
          value={pass}
          onChange={e=>{setPass(e.target.value);setErrors(p=>({...p,pass:null}))}}
          placeholder="Mínimo 8 caracteres"
          icon="lock"
          error={errors.pass}
          rightEl={
            <button onClick={()=>setShowP(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>
              <Icon name={showP?"eyeOff":"eye"} size={16} color={C.slate}/>
            </button>
          }
        />

        <StrengthBar password={pass}/>

        <Input
          label="Confirmar nueva contraseña"
          type={showC?"text":"password"}
          value={confirm}
          onChange={e=>{setConfirm(e.target.value);setErrors(p=>({...p,confirm:null}))}}
          placeholder="Repite tu nueva contraseña"
          icon="lock"
          error={errors.confirm}
          rightEl={
            <button onClick={()=>setShowC(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>
              <Icon name={showC?"eyeOff":"eye"} size={16} color={C.slate}/>
            </button>
          }
        />

        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
          <Btn onClick={handleSubmit} loading={loading} disabled={!actual||!pass||!confirm}>
            {loading?"Actualizando...":"Actualizar contraseña"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// NAVEGADOR DE VISTAS — Demo interactivo
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [vista, setVista] = useState("menu");
  const [linkValido, setLinkValido] = useState(true);

  if (vista === "menu") {
    return (
      <div style={{
        minHeight:"100vh", background:`linear-gradient(135deg, ${C.navy}, ${C.navyMid})`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:24
      }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="shield" size={18} color={C.white}/>
          </div>
          <span style={{color:C.white,fontWeight:800,fontSize:18,letterSpacing:"-0.02em",fontFamily:"Georgia,serif"}}>
            ESCOM <span style={{color:C.accent}}>SS</span>
          </span>
        </div>
        <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,margin:"0 0 8px",textAlign:"center"}}>CU-CRED-02 · Cambiar contraseña · Selector de vistas</p>

        {[
          { id:"v1",       label:"Vista 1 — Solicitar restablecimiento",          sub:"Flujo principal + alternos 2.1 y 3.1" },
          { id:"v2ok",     label:"Vista 2 — Nueva contraseña (enlace válido)",    sub:"Con indicador de fortaleza y validaciones" },
          { id:"v2bad",    label:"Vista 2 — Enlace inválido / expirado",          sub:"Flujo alterno 5.1" },
          { id:"v3",       label:"Vista 3 — Contraseña actualizada con éxito",    sub:"Mensaje final del flujo de recuperación" },
          { id:"v4",       label:"Vista 4 — Cambio desde sesión activa",          sub:"Segundo disparador del CU" },
        ].map((v,i)=>(
          <button key={v.id} onClick={()=>{ setLinkValido(v.id!=="v2bad"); setVista(v.id); }} style={{
            background:C.white, border:"none", borderRadius:14, padding:"16px 24px",
            width:"100%", maxWidth:420, cursor:"pointer", textAlign:"left",
            boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
            animation:`fadeUp ${0.2+i*0.07}s ease both`,
            display:"flex", justifyContent:"space-between", alignItems:"center"
          }}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          >
            <div>
              <div style={{fontSize:14,fontWeight:700,color:C.navy}}>{v.label}</div>
              <div style={{fontSize:12,color:C.slate,marginTop:2}}>{v.sub}</div>
            </div>
            <Icon name="arrow" size={16} color={C.blue} style={{transform:"rotate(180deg)"}}/>
          </button>
        ))}
      </div>
    );
  }

  if (vista === "v1")    return <V1_SolicitarRestablecimiento onNext={()=>setVista("v2ok")} onBack={()=>setVista("menu")}/>;
  if (vista === "v2ok")  return <V2_NuevaContrasena onSuccess={()=>setVista("v3")} linkValido={true}/>;
  if (vista === "v2bad") return <V2_NuevaContrasena onSuccess={()=>setVista("v3")} linkValido={false}/>;
  if (vista === "v3")    return <V3_Exito onLogin={()=>setVista("menu")}/>;
  if (vista === "v4")    return <V4_CambioEnSesion onDone={()=>setVista("v3")} onCancel={()=>setVista("menu")}/>;
}
