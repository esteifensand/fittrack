import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const diasNombre = {
  Lun: 'Lunes',
  Mar: 'Martes',
  Mié: 'Miércoles',
  Jue: 'Jueves',
  Vie: 'Viernes',
  Sáb: 'Sábado',
  Dom: 'Domingo',
};
const serieVacia = () => ({ reps: '', peso: '' });

const inputStyle = {
  border: '1px solid #DBEAFE',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 14,
  outline: 'none',
  color: '#374151',
  background: '#fff',
};

const sensacionColores = [
  '',
  '#BFDBFE',
  '#93C5FD',
  '#60A5FA',
  '#3B82F6',
  '#1D4ED8',
];
const sensacionTextoColores = [
  '',
  '#1E3A5F',
  '#1E3A5F',
  '#fff',
  '#fff',
  '#fff',
];

function formatTime(seg) {
  const m = Math.floor(seg / 60)
    .toString()
    .padStart(2, '0');
  const s = (seg % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getLunes(fecha) {
  const d = new Date(fecha);
  const dia = d.getDay();
  d.setDate(d.getDate() + (dia === 0 ? -6 : 1 - dia));
  d.setHours(0, 0, 0, 0);
  return d;
}

function ProgresoGeneral({ onVolver }) {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase
      .from('sesiones')
      .select('*')
      .order('creado_en', { ascending: true })
      .then(({ data }) => {
        setSesiones(data || []);
        setCargando(false);
      });
  }, []);

  if (cargando)
    return (
      <div
        style={{
          maxWidth: 420,
          margin: '0 auto',
          padding: '24px 16px',
          fontFamily: 'sans-serif',
        }}
      >
        <button
          onClick={onVolver}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3B82F6',
            fontSize: 14,
            marginBottom: 12,
            padding: 0,
          }}
        >
          ← Volver
        </button>
        <div style={{ color: '#888' }}>Cargando...</div>
      </div>
    );

  if (sesiones.length === 0)
    return (
      <div
        style={{
          maxWidth: 420,
          margin: '0 auto',
          padding: '24px 16px',
          fontFamily: 'sans-serif',
        }}
      >
        <button
          onClick={onVolver}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3B82F6',
            fontSize: 14,
            marginBottom: 12,
            padding: 0,
          }}
        >
          ← Volver
        </button>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
          Progreso
        </div>
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#F8FAFF',
            borderRadius: 16,
            border: '1px solid #DBEAFE',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#BFDBFE"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: 'block', margin: '0 auto 12px' }}
          >
            <polyline points="3,17 8,12 13,14 21,6" />
            <polyline points="17,6 21,6 21,10" />
          </svg>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#555',
              marginBottom: 6,
            }}
          >
            Todavía no hay datos
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            Completá algunas sesiones para ver tu progreso aquí.
          </div>
        </div>
      </div>
    );

  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const sesionesDelMes = sesiones.filter(
    (s) => new Date(s.creado_en) >= inicioMes
  );
  const duracionProm = sesionesDelMes.length
    ? Math.round(
        sesionesDelMes.reduce((a, s) => a + (s.duracion_segundos || 0), 0) /
          sesionesDelMes.length
      )
    : 0;
  const todasVal = sesiones.flatMap((s) =>
    (s.datos || []).map((d) => d.valoracion || 0).filter((v) => v > 0)
  );
  const sensacionProm = todasVal.length
    ? (todasVal.reduce((a, b) => a + b, 0) / todasVal.length).toFixed(1)
    : '-';
  const semanas8 = Array.from({ length: 8 }, (_, i) => {
    const fin = new Date(getLunes(ahora));
    fin.setDate(fin.getDate() + 7 - (8 - i) * 7 + 6);
    const ini = new Date(fin);
    ini.setDate(fin.getDate() - 6);
    return sesiones.filter((s) => {
      const d = new Date(s.creado_en);
      return d >= ini && d <= fin;
    }).length;
  });
  const maxSemana = Math.max(...semanas8, 1);
  const sensacionPorGrupo = {};
  sesiones.forEach((s) => {
    (s.datos || []).forEach((d) => {
      if (!d.valoracion) return;
      const g = d.ejercicio?.split(' ')[0] || 'Otros';
      if (!sensacionPorGrupo[g]) sensacionPorGrupo[g] = [];
      sensacionPorGrupo[g].push(d.valoracion);
    });
  });
  const promediosPorGrupo = Object.entries(sensacionPorGrupo)
    .map(([g, vals]) => ({
      grupo: g,
      prom: parseFloat(
        (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      ),
    }))
    .sort((a, b) => b.prom - a.prom)
    .slice(0, 6);
  const progresoPorEjercicio = {};
  sesiones.forEach((s) => {
    (s.datos || []).forEach((d) => {
      const n = d.ejercicio;
      const mp = Math.max(
        ...(d.series || []).map((s) => parseFloat(s.peso) || 0)
      );
      if (!progresoPorEjercicio[n]) progresoPorEjercicio[n] = [];
      if (mp > 0)
        progresoPorEjercicio[n].push({ fecha: s.creado_en, peso: mp });
    });
  });
  const progresosConDiff = Object.entries(progresoPorEjercicio)
    .filter(([, v]) => v.length >= 2)
    .map(([n, v]) => ({
      nombre: n,
      primero: v[0].peso,
      ultimo: v[v.length - 1].peso,
      diff: parseFloat((v[v.length - 1].peso - v[0].peso).toFixed(1)),
    }))
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 5);
  const estancados = Object.entries(progresoPorEjercicio)
    .filter(([, v]) => v.length >= 3)
    .filter(([, v]) => {
      const u = v.slice(-3);
      return u.every((x) => x.peso === u[0].peso);
    })
    .map(([n]) => n);

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'sans-serif',
      }}
    >
      <button
        onClick={onVolver}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#3B82F6',
          fontSize: 14,
          marginBottom: 12,
          padding: 0,
        }}
      >
        ← Volver
      </button>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
        Progreso
      </div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
        Este mes
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {[
          { val: sesionesDelMes.length, lbl: 'sesiones' },
          {
            val: duracionProm ? formatTime(duracionProm) : '-',
            lbl: 'duración prom.',
          },
          { val: sensacionProm, lbl: 'sensación prom.' },
        ].map((m) => (
          <div
            key={m.lbl}
            style={{
              background: '#F8FAFF',
              borderRadius: 10,
              padding: 10,
              textAlign: 'center',
              border: '1px solid #DBEAFE',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1E40AF' }}>
              {m.val}
            </div>
            <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>
              {m.lbl}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          background: '#F8FAFF',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 10,
          border: '1px solid #DBEAFE',
        }}
      >
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
          Consistencia — últimas 8 semanas
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {semanas8.map((c, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 14,
                borderRadius: 3,
                background:
                  c === 0
                    ? '#EEE'
                    : c / maxSemana < 0.4
                    ? '#BBF7D0'
                    : c / maxSemana < 0.7
                    ? '#86EFAC'
                    : '#22C55E',
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <div style={{ fontSize: 9, color: '#aaa' }}>hace 8 sem</div>
          <div style={{ fontSize: 9, color: '#aaa' }}>hoy</div>
        </div>
      </div>
      {promediosPorGrupo.length > 0 && (
        <div
          style={{
            background: '#F8FAFF',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 10,
            border: '1px solid #DBEAFE',
          }}
        >
          <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
            Sensación por grupo muscular
          </div>
          {promediosPorGrupo.map(({ grupo, prom }) => (
            <div
              key={grupo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#555',
                  width: 70,
                  flexShrink: 0,
                }}
              >
                {grupo}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: '#EEE',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    width: `${(prom / 5) * 100}%`,
                    background:
                      prom >= 4 ? '#3B82F6' : prom >= 3 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#888',
                  width: 24,
                  textAlign: 'right',
                }}
              >
                {prom}
              </div>
            </div>
          ))}
        </div>
      )}
      {progresosConDiff.length > 0 && (
        <div
          style={{
            background: '#F8FAFF',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 10,
            border: '1px solid #DBEAFE',
          }}
        >
          <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
            Mayor progreso de peso
          </div>
          {progresosConDiff.map(({ nombre, primero, ultimo, diff }) => (
            <div
              key={nombre}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '0.5px solid #E0ECFF',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{nombre}</div>
                <div style={{ fontSize: 10, color: '#888' }}>
                  {primero}kg → {ultimo}kg
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: diff > 0 ? '#16A34A' : diff < 0 ? '#EF4444' : '#888',
                  fontWeight: 600,
                }}
              >
                {diff > 0
                  ? `+${diff}kg ↑`
                  : diff < 0
                  ? `${diff}kg ↓`
                  : 'sin cambio →'}
              </div>
            </div>
          ))}
        </div>
      )}
      {estancados.length > 0 && (
        <div
          style={{
            background: '#FFFBEB',
            borderRadius: 10,
            padding: '10px 12px',
            border: '0.5px solid #FDE68A',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#92400E',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Sin progreso en 3 sesiones
          </div>
          {estancados.map((e) => (
            <div
              key={e}
              style={{ fontSize: 12, color: '#78350F', marginBottom: 2 }}
            >
              · {e}
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#92400E', marginTop: 4 }}>
            Considerá ajustar el peso o las reps.
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarioNavegable({ sesiones, rutinaActiva, onSeleccionarDia }) {
  const [lunes, setLunes] = useState(getLunes(new Date()));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const semanaActual = getLunes(new Date()).getTime() === lunes.getTime();
  const diasDeSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
  const mesAnio = lunes.toLocaleDateString('es-ES', {
    month: 'short',
    year: 'numeric',
  });
  const diasConSesion = new Set(
    sesiones.map((s) => new Date(s.creado_en).toDateString())
  );
  const diasPlanificados = rutinaActiva?.dias
    ? Object.keys(rutinaActiva.dias)
    : [];
  return (
    <div
      style={{
        background: '#F8FAFF',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 8,
        border: '1px solid #DBEAFE',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div
          style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}
        >
          {mesAnio}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => {
              const d = new Date(lunes);
              d.setDate(d.getDate() - 7);
              setLunes(d);
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              border: '1px solid #DBEAFE',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              color: '#555',
            }}
          >
            ‹
          </button>
          {!semanaActual && (
            <button
              onClick={() => setLunes(getLunes(new Date()))}
              style={{
                fontSize: 10,
                color: '#3B82F6',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 5,
                padding: '0 6px',
                cursor: 'pointer',
              }}
            >
              hoy
            </button>
          )}
          <button
            onClick={() => {
              const d = new Date(lunes);
              d.setDate(d.getDate() + 7);
              setLunes(d);
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              border: '1px solid #DBEAFE',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              color: '#555',
            }}
          >
            ›
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 3,
        }}
      >
        {diasDeSemana.map((fecha, i) => {
          const diaKey = diasSemana[i];
          const esHoy = fecha.getTime() === hoy.getTime();
          const entrenado = diasConSesion.has(fecha.toDateString());
          const planificado =
            diasPlanificados.includes(diaKey) && !entrenado && fecha >= hoy;
          return (
            <div
              key={i}
              onClick={() => onSeleccionarDia(diaKey)}
              style={{
                textAlign: 'center',
                padding: '6px 2px',
                borderRadius: 7,
                cursor: 'pointer',
                background: esHoy ? '#EFF6FF' : 'transparent',
                border: esHoy
                  ? '1.5px solid #BFDBFE'
                  : '1.5px solid transparent',
              }}
            >
              <div style={{ fontSize: 9, color: '#aaa', marginBottom: 3 }}>
                {diaKey}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: esHoy ? 600 : 400,
                  color: esHoy ? '#1D4ED8' : '#555',
                  marginBottom: 4,
                }}
              >
                {fecha.getDate()}
              </div>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  margin: '0 auto',
                  background: entrenado
                    ? '#22C55E'
                    : esHoy
                    ? '#3B82F6'
                    : planificado
                    ? '#BFDBFE'
                    : '#EEE',
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 8,
          justifyContent: 'center',
        }}
      >
        {[
          ['#22C55E', 'Entrenado'],
          ['#3B82F6', 'Hoy'],
          ['#BFDBFE', 'Planificado'],
        ].map(([color, label]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 9,
              color: '#aaa',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: color,
              }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function RepositorioEjercicios({ onSeleccionar, onCerrar }) {
  const [busqueda, setBusqueda] = useState('');
  const [grupoActivo, setGrupoActivo] = useState('Todos');
  const [ejerciciosBase, setEjerciciosBase] = useState([]);
  const [ejerciciosUsuario, setEjerciciosUsuario] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    supabase
      .from('ejercicios_base')
      .select('*')
      .order('grupo')
      .then(({ data }) => setEjerciciosBase(data || []));
    supabase
      .from('ejercicios_usuario')
      .select('*')
      .order('nombre')
      .then(({ data }) => setEjerciciosUsuario(data || []));
  }, []);

  const grupos = [
    'Todos',
    ...Array.from(new Set(ejerciciosBase.map((e) => e.grupo))),
    'Mis ejercicios',
  ];
  const todos = [
    ...ejerciciosBase,
    ...ejerciciosUsuario.map((e) => ({ ...e, grupo: 'Mis ejercicios' })),
  ];
  const filtrados = todos.filter(
    (e) =>
      (grupoActivo === 'Todos' || e.grupo === grupoActivo) &&
      (!busqueda.trim() ||
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );
  const porGrupo = filtrados.reduce((acc, ej) => {
    if (!acc[ej.grupo]) acc[ej.grupo] = [];
    acc[ej.grupo].push(ej);
    return acc;
  }, {});
  const agregarPersonalizado = async () => {
    if (!nuevoNombre.trim()) return;
    setGuardando(true);
    const { data } = await supabase
      .from('ejercicios_usuario')
      .insert({ nombre: nuevoNombre.trim() })
      .select()
      .single();
    if (data) setEjerciciosUsuario((prev) => [...prev, data]);
    setNuevoNombre('');
    setGuardando(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#fff',
        zIndex: 200,
        overflowY: 'auto',
        padding: '20px 16px',
        maxWidth: 420,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>
          Ejercicios
        </div>
        <button
          onClick={onCerrar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3B82F6',
            fontSize: 14,
          }}
        >
          ← Volver
        </button>
      </div>
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar ejercicio..."
        style={{
          ...inputStyle,
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 10,
        }}
      />
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}
      >
        {grupos.map((g) => (
          <button
            key={g}
            onClick={() => setGrupoActivo(g)}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              background: grupoActivo === g ? '#3B82F6' : '#EFF6FF',
              color: grupoActivo === g ? '#fff' : '#3B82F6',
            }}
          >
            {g}
          </button>
        ))}
      </div>
      {Object.entries(porGrupo).map(([grupo, ejs]) => (
        <div key={grupo} style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              color: '#888',
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            {grupo}
          </div>
          {ejs.map((ej) => (
            <div
              key={ej.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 8,
                background: '#F8FAFF',
                border: '1px solid #DBEAFE',
                marginBottom: 4,
              }}
            >
              <div style={{ fontSize: 13, color: '#333' }}>{ej.nombre}</div>
              <button
                onClick={() => onSeleccionar(ej.nombre)}
                style={{
                  background: '#3B82F6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>
      ))}
      <div
        style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid #F0F0F0' }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#888',
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Agregar ejercicio personalizado
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarPersonalizado()}
            placeholder="Nombre del ejercicio..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={agregarPersonalizado}
            disabled={guardando}
            style={{
              background: '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {guardando ? '...' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreadorRutinas({ onVolver, rutinaEditar }) {
  const [nombre, setNombre] = useState(rutinaEditar?.nombre || '');
  const [semanas, setSemanas] = useState(rutinaEditar?.semanas || 8);
  const [diasActivos, setDiasActivos] = useState(
    rutinaEditar?.dias
      ? Object.fromEntries(diasSemana.map((d) => [d, !!rutinaEditar.dias[d]]))
      : {
          Lun: true,
          Mar: true,
          Mié: false,
          Jue: true,
          Vie: true,
          Sáb: false,
          Dom: false,
        }
  );
  const [ejerciciosPorDia, setEjerciciosPorDia] = useState(
    rutinaEditar?.dias ||
      Object.fromEntries(
        diasSemana.map((d) => [d, { nombre: '', ejercicios: [] }])
      )
  );
  const [guardando, setGuardando] = useState(false);
  const [nuevoEj, setNuevoEj] = useState(
    Object.fromEntries(diasSemana.map((d) => [d, '']))
  );
  const [mostrarRepo, setMostrarRepo] = useState(null);
  const [mostrarInputDia, setMostrarInputDia] = useState(null);
  const ejerciciosRefs = useRef({});

  const toggleDia = (d) => setDiasActivos((p) => ({ ...p, [d]: !p[d] }));
  const setNombreDia = (d, v) =>
    setEjerciciosPorDia((p) => ({ ...p, [d]: { ...p[d], nombre: v } }));

  const agregarEjercicio = (dia, n) => {
    const nombre = n || nuevoEj[dia];
    if (!nombre.trim()) return;
    setEjerciciosPorDia((p) => ({
      ...p,
      [dia]: {
        ...p[dia],
        ejercicios: [
          ...(p[dia].ejercicios || []),
          { nombre: nombre.trim(), series: 3, reps: 10 },
        ],
      },
    }));
    if (!n) setNuevoEj((p) => ({ ...p, [dia]: '' }));
    setMostrarInputDia(null);
    setTimeout(() => {
      const key = `${dia}-${(ejerciciosPorDia[dia]?.ejercicios || []).length}`;
      ejerciciosRefs.current[key]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  };

  const eliminarEj = (dia, idx) =>
    setEjerciciosPorDia((p) => ({
      ...p,
      [dia]: {
        ...p[dia],
        ejercicios: p[dia].ejercicios.filter((_, i) => i !== idx),
      },
    }));
  const moverEj = (dia, idx, dir) => {
    const ejs = [...ejerciciosPorDia[dia].ejercicios];
    const n = idx + dir;
    if (n < 0 || n >= ejs.length) return;
    [ejs[idx], ejs[n]] = [ejs[n], ejs[idx]];
    setEjerciciosPorDia((p) => ({
      ...p,
      [dia]: { ...p[dia], ejercicios: ejs },
    }));
  };
  const actualizarEj = (dia, idx, campo, val) => {
    const ejs = [...ejerciciosPorDia[dia].ejercicios];
    ejs[idx] = { ...ejs[idx], [campo]: val };
    setEjerciciosPorDia((p) => ({
      ...p,
      [dia]: { ...p[dia], ejercicios: ejs },
    }));
  };
  const guardar = async () => {
    if (!nombre.trim()) return alert('Ponele un nombre a la rutina');
    setGuardando(true);
    const dias = Object.fromEntries(
      diasSemana
        .filter((d) => diasActivos[d])
        .map((d) => [d, ejerciciosPorDia[d]])
    );
    if (rutinaEditar?.id) {
      await supabase
        .from('rutinas')
        .update({ nombre, semanas, dias })
        .eq('id', rutinaEditar.id);
    } else {
      await supabase
        .from('rutinas')
        .insert({ nombre, semanas, dias, activa: false });
    }
    setGuardando(false);
    onVolver();
  };

  if (mostrarRepo)
    return (
      <RepositorioEjercicios
        onSeleccionar={(n) => {
          agregarEjercicio(mostrarRepo, n);
          setMostrarRepo(null);
        }}
        onCerrar={() => setMostrarRepo(null)}
      />
    );

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'sans-serif',
      }}
    >
      <button
        onClick={onVolver}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#3B82F6',
          fontSize: 14,
          marginBottom: 12,
          padding: 0,
        }}
      >
        ← Volver
      </button>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
        {rutinaEditar ? 'Editar rutina' : 'Nueva rutina'}
      </div>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de la rutina"
        style={{
          ...inputStyle,
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 16,
        }}
      />

      <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
        Días de entrenamiento
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 5,
          marginBottom: 6,
        }}
      >
        {diasSemana.map((dia) => (
          <div
            key={dia}
            onClick={() => toggleDia(dia)}
            style={{
              textAlign: 'center',
              padding: '8px 2px',
              borderRadius: 8,
              cursor: 'pointer',
              background: diasActivos[dia] ? '#EFF6FF' : '#F9F9F9',
              border: diasActivos[dia]
                ? '1.5px solid #3B82F6'
                : '1.5px solid transparent',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: diasActivos[dia] ? '#1D4ED8' : '#aaa',
                marginBottom: 4,
              }}
            >
              {dia}
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                margin: '0 auto',
                background: diasActivos[dia] ? '#3B82F6' : '#DDD',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 16 }}>
        Tocá para activar o poner en descanso
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, color: '#555' }}>Duración:</div>
        <button
          onClick={() => setSemanas((s) => Math.max(1, s - 1))}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid #DBEAFE',
            background: '#F8FAFF',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          −
        </button>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            minWidth: 24,
            textAlign: 'center',
            color: '#333',
          }}
        >
          {semanas}
        </div>
        <button
          onClick={() => setSemanas((s) => s + 1)}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid #DBEAFE',
            background: '#F8FAFF',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          +
        </button>
        <div style={{ fontSize: 13, color: '#555' }}>semanas</div>
      </div>

      <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
        Ejercicios por día
      </div>
      {diasSemana
        .filter((d) => diasActivos[d])
        .map((dia) => (
          <div
            key={dia}
            style={{
              background: '#F8FAFF',
              borderRadius: 14,
              padding: 14,
              border: '1px solid #DBEAFE',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1D4ED8',
                marginBottom: 8,
              }}
            >
              {diasNombre[dia]}
            </div>
            <input
              value={ejerciciosPorDia[dia]?.nombre || ''}
              onChange={(e) => setNombreDia(dia, e.target.value)}
              placeholder="Descripción del día (ej: Pecho + Tríceps)"
              style={{
                ...inputStyle,
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: 10,
              }}
            />

            {(ejerciciosPorDia[dia]?.ejercicios || []).map((ej, idx) => (
              <div
                key={idx}
                ref={(el) => (ejerciciosRefs.current[`${dia}-${idx}`] = el)}
                style={{
                  background: '#fff',
                  border: '1px solid #DBEAFE',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
                    {ej.nombre}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => moverEj(dia, idx, -1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        color: '#aaa',
                        padding: '0 2px',
                      }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moverEj(dia, idx, 1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        color: '#aaa',
                        padding: '0 2px',
                      }}
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => eliminarEj(dia, idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 16,
                        color: '#ccc',
                        padding: '0 2px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div
                      style={{ fontSize: 10, color: '#888', marginBottom: 4 }}
                    >
                      Series
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <button
                        onClick={() =>
                          actualizarEj(
                            dia,
                            idx,
                            'series',
                            Math.max(1, ej.series - 1)
                          )
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '1px solid #DBEAFE',
                          background: '#F8FAFF',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#555',
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#333',
                          minWidth: 16,
                          textAlign: 'center',
                        }}
                      >
                        {ej.series}
                      </span>
                      <button
                        onClick={() =>
                          actualizarEj(dia, idx, 'series', ej.series + 1)
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '1px solid #DBEAFE',
                          background: '#F8FAFF',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#555',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 10, color: '#888', marginBottom: 4 }}
                    >
                      Reps est.
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <button
                        onClick={() =>
                          actualizarEj(
                            dia,
                            idx,
                            'reps',
                            Math.max(1, ej.reps - 1)
                          )
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '1px solid #DBEAFE',
                          background: '#F8FAFF',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#555',
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#333',
                          minWidth: 20,
                          textAlign: 'center',
                        }}
                      >
                        {ej.reps}
                      </span>
                      <button
                        onClick={() =>
                          actualizarEj(dia, idx, 'reps', ej.reps + 1)
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '1px solid #DBEAFE',
                          background: '#F8FAFF',
                          cursor: 'pointer',
                          fontSize: 14,
                          color: '#555',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button
                onClick={() => setMostrarRepo(dia)}
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: '#3B82F6',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 8,
                  padding: '8px 6px',
                  cursor: 'pointer',
                }}
              >
                + Del repositorio
              </button>
              <button
                onClick={() =>
                  setMostrarInputDia(mostrarInputDia === dia ? null : dia)
                }
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: '#555',
                  background: '#F9F9F9',
                  border: '1px solid #E0E0E0',
                  borderRadius: 8,
                  padding: '8px 6px',
                  cursor: 'pointer',
                }}
              >
                + Escribir otro
              </button>
            </div>
            {mostrarInputDia === dia && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  value={nuevoEj[dia]}
                  onChange={(e) =>
                    setNuevoEj((p) => ({ ...p, [dia]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && agregarEjercicio(dia)}
                  placeholder="Nombre del ejercicio..."
                  autoFocus
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={() => agregarEjercicio(dia)}
                  style={{
                    background: '#3B82F6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            )}
          </div>
        ))}

      <button
        onClick={guardar}
        disabled={guardando}
        style={{
          width: '100%',
          background: guardando ? '#93C5FD' : '#3B82F6',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: '14px',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        {guardando ? 'Guardando...' : 'Guardar rutina'}
      </button>
    </div>
  );
}

function Repositorio({ onVolver, onNueva, onEditar, onActivar }) {
  const [rutinas, setRutinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    cargar();
  }, []);
  const cargar = async () => {
    const { data } = await supabase
      .from('rutinas')
      .select('*')
      .order('creado_en', { ascending: false });
    setRutinas(data || []);
    setCargando(false);
  };
  const activar = async (id) => {
    await supabase.from('rutinas').update({ activa: false }).neq('id', id);
    await supabase.from('rutinas').update({ activa: true }).eq('id', id);
    onActivar();
  };
  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta rutina?')) return;
    await supabase.from('rutinas').delete().eq('id', id);
    cargar();
  };
  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'sans-serif',
      }}
    >
      <button
        onClick={onVolver}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#3B82F6',
          fontSize: 14,
          marginBottom: 12,
          padding: 0,
        }}
      >
        ← Volver
      </button>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600 }}>Mis rutinas</div>
        <button
          onClick={onNueva}
          style={{
            background: '#3B82F6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          + Nueva
        </button>
      </div>
      {cargando ? (
        <div style={{ color: '#888' }}>Cargando...</div>
      ) : rutinas.length === 0 ? (
        <div style={{ color: '#888', fontSize: 14 }}>
          No tenés rutinas guardadas.
        </div>
      ) : (
        rutinas.map((r) => (
          <div
            key={r.id}
            style={{
              background: '#F8FAFF',
              borderRadius: 14,
              padding: 14,
              border: r.activa ? '1.5px solid #3B82F6' : '1px solid #DBEAFE',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 2,
                color: '#333',
              }}
            >
              {r.nombre}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
              {Object.keys(r.dias || {}).length} días · {r.semanas} semanas
              {r.activa && (
                <span style={{ color: '#3B82F6', marginLeft: 6 }}>
                  ● activa
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => onEditar(r)}
                style={{
                  fontSize: 12,
                  color: '#3B82F6',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 6,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                Editar
              </button>
              {!r.activa && (
                <button
                  onClick={() => activar(r.id)}
                  style={{
                    fontSize: 12,
                    color: '#16A34A',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 6,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Usar esta
                </button>
              )}
              <button
                onClick={() => eliminar(r.id)}
                style={{
                  fontSize: 12,
                  color: '#aaa',
                  background: 'none',
                  border: '1px solid #eee',
                  borderRadius: 6,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ProgresoEjercicio({ nombre, onVolver }) {
  const [historial, setHistorial] = useState([]);
  const [tab, setTab] = useState('peso');
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    supabase
      .from('sesiones')
      .select('creado_en, datos')
      .order('creado_en', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const f = data
            .map((s) => {
              const ej = s.datos?.find((d) => d.ejercicio === nombre);
              if (!ej) return null;
              const p = ej.series.map((s) => parseFloat(s.peso) || 0);
              const r = ej.series.map((s) => parseFloat(s.reps) || 0);
              return {
                fecha: new Date(s.creado_en).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                }),
                maxPeso: Math.max(...p),
                maxReps: Math.max(...r),
                val: ej.valoracion || 0,
              };
            })
            .filter(Boolean);
          setHistorial(f);
        }
        setCargando(false);
      });
  }, [nombre]);
  const valores = historial.map((h) =>
    tab === 'peso' ? h.maxPeso : tab === 'reps' ? h.maxReps : h.val
  );
  const maxVal = Math.max(...valores, 1);
  const mejorMarca = Math.max(...valores, 0);
  const ultimo = valores[valores.length - 1] || 0;
  const diff = ultimo - (valores[valores.length - 2] || 0);
  const valMedio = historial.length
    ? (historial.reduce((a, b) => a + b.val, 0) / historial.length).toFixed(1)
    : '-';
  const sugerencia = () => {
    if (historial.length < 2)
      return 'Completá más sesiones para obtener sugerencias.';
    const u = historial.slice(-2);
    if (u.every((h) => h.val >= 4))
      return `Probá subir el peso a ${(ultimo + 2.5).toFixed(1)}kg`;
    if (u.every((h) => h.val <= 2))
      return 'Mantené la carga, priorizá la técnica';
    return 'Mantené el peso y buscá mejorar las reps';
  };
  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'sans-serif',
      }}
    >
      <button
        onClick={onVolver}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#3B82F6',
          fontSize: 14,
          marginBottom: 12,
          padding: 0,
        }}
      >
        ← Volver
      </button>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
        Progreso
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 20,
          color: '#333',
        }}
      >
        {nombre}
      </div>
      {cargando ? (
        <div style={{ color: '#888' }}>Cargando...</div>
      ) : historial.length === 0 ? (
        <div style={{ color: '#888', fontSize: 14 }}>
          Todavía no hay sesiones para este ejercicio.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {[
              {
                val: `${mejorMarca}${tab === 'peso' ? 'kg' : ''}`,
                lbl: 'mejor marca',
              },
              {
                val: diff >= 0 ? `+${diff}` : `${diff}`,
                lbl: 'vs sesión ant.',
              },
              { val: valMedio, lbl: 'sensación media' },
            ].map((s) => (
              <div
                key={s.lbl}
                style={{
                  background: '#F8FAFF',
                  borderRadius: 10,
                  padding: 10,
                  textAlign: 'center',
                  border: '1px solid #DBEAFE',
                }}
              >
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: '#1E40AF' }}
                >
                  {s.val}
                </div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              ['peso', 'Peso'],
              ['reps', 'Reps'],
              ['val', 'Sensación'],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  fontSize: 12,
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === k ? '#3B82F6' : '#EFF6FF',
                  color: tab === k ? '#fff' : '#3B82F6',
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <div
            style={{
              background: '#F8FAFF',
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
              border: '1px solid #DBEAFE',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 4,
                height: 80,
              }}
            >
              {historial.map((h, i) => {
                const v =
                  tab === 'peso'
                    ? h.maxPeso
                    : tab === 'reps'
                    ? h.maxReps
                    : h.val;
                const pct = Math.max((v / maxVal) * 100, 4);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        borderRadius: '4px 4px 0 0',
                        height: `${pct}%`,
                        background:
                          i === historial.length - 1 ? '#3B82F6' : '#BFDBFE',
                      }}
                    />
                    <div style={{ fontSize: 9, color: '#aaa' }}>{h.fecha}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div
            style={{
              background: '#EFF6FF',
              borderRadius: 10,
              padding: '10px 12px',
              border: '1px solid #BFDBFE',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#1D4ED8',
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              Objetivo próxima sesión
            </div>
            <div style={{ fontSize: 13, color: '#1E40AF' }}>{sugerencia()}</div>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            Últimas sesiones
          </div>
          {historial
            .slice()
            .reverse()
            .slice(0, 5)
            .map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #F0F0F0',
                }}
              >
                <div style={{ fontSize: 12, color: '#555' }}>{h.fecha}</div>
                <div style={{ fontSize: 12, color: '#333' }}>
                  {h.maxPeso}kg · {h.maxReps} reps
                </div>
                <div style={{ fontSize: 11, color: '#3B82F6' }}>
                  ★ {h.val || '-'}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}

function SesionActiva({ dia, rutina, onTerminar }) {
  const [segundos, setSegundos] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [datos, setDatos] = useState(
    rutina.ejercicios.map((ej) => ({
      series: Array(ej.series || 3)
        .fill(null)
        .map(() => serieVacia()),
      val: 0,
    }))
  );
  const [verProgreso, setVerProgreso] = useState(null);
  const [historialEjercicios, setHistorialEjercicios] = useState({});

  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    supabase
      .from('sesiones')
      .select('datos')
      .order('creado_en', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const hist = {};
        rutina.ejercicios.forEach((ej) => {
          for (const s of data) {
            const e = s.datos?.find((d) => d.ejercicio === ej.nombre);
            if (e) {
              hist[ej.nombre] = e;
              break;
            }
          }
        });
        setHistorialEjercicios(hist);
      });
  }, []);

  const actualizarSerie = (ei, si, c, v) => {
    setDatos((p) => {
      const n = p.map((d) => ({ ...d, series: [...d.series] }));
      n[ei].series[si] = { ...n[ei].series[si], [c]: v };
      return n;
    });
  };
  const agregarSerie = (ei) => {
    setDatos((p) => {
      const n = p.map((d) => ({ ...d, series: [...d.series] }));
      n[ei].series.push(serieVacia());
      return n;
    });
  };
  const actualizarVal = (ei, v) => {
    setDatos((p) => {
      const n = [...p];
      n[ei] = { ...n[ei], val: v };
      return n;
    });
  };
  const terminar = async () => {
    setGuardando(true);
    const { error } = await supabase
      .from('sesiones')
      .insert({
        dia,
        rutina: rutina.nombre,
        duracion_segundos: segundos,
        datos: rutina.ejercicios.map((ej, i) => ({
          ejercicio: ej.nombre,
          series: datos[i].series,
          valoracion: datos[i].val,
        })),
      });
    setGuardando(false);
    if (error) alert('Error: ' + error.message);
    else onTerminar(segundos, datos);
  };

  if (verProgreso)
    return (
      <ProgresoEjercicio
        nombre={verProgreso}
        onVolver={() => setVerProgreso(null)}
      />
    );

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600 }}>
            {dia} · en curso
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#333' }}>
            {rutina.nombre}
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#3B82F6',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(segundos)}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {rutina.ejercicios.map((ej, ei) => {
          const hist = historialEjercicios[ej.nombre];
          const ultPeso = hist
            ? Math.max(
                ...(hist.series || []).map((s) => parseFloat(s.peso) || 0)
              )
            : null;
          const ultReps = hist
            ? Math.max(
                ...(hist.series || []).map((s) => parseFloat(s.reps) || 0)
              )
            : null;
          return (
            <div
              key={ei}
              style={{
                background: '#F8FAFF',
                borderRadius: 14,
                padding: 14,
                border: '1px solid #DBEAFE',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                  {ej.nombre}
                </div>
                <button
                  onClick={() => setVerProgreso(ej.nombre)}
                  style={{
                    fontSize: 11,
                    color: '#3B82F6',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 6,
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                >
                  historial
                </button>
              </div>
              {ultPeso > 0 && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#3B82F6',
                    background: '#EFF6FF',
                    borderRadius: 6,
                    padding: '4px 8px',
                    marginBottom: 8,
                    display: 'inline-block',
                  }}
                >
                  Última vez: {ultPeso}kg × {ultReps} reps
                </div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 1fr',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <div />
                <div
                  style={{ fontSize: 10, color: '#888', textAlign: 'center' }}
                >
                  Reps
                </div>
                <div
                  style={{ fontSize: 10, color: '#888', textAlign: 'center' }}
                >
                  Peso (kg)
                </div>
              </div>
              {datos[ei].series.map((serie, si) => (
                <div
                  key={si}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr 1fr',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: '#aaa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    S{si + 1}
                  </div>
                  {['reps', 'peso'].map((c) => (
                    <input
                      key={c}
                      type="number"
                      value={serie[c]}
                      onChange={(e) =>
                        actualizarSerie(ei, si, c, e.target.value)
                      }
                      style={{
                        ...inputStyle,
                        textAlign: 'center',
                        width: '100%',
                        boxSizing: 'border-box',
                        color: '#374151',
                      }}
                    />
                  ))}
                </div>
              ))}
              <button
                onClick={() => agregarSerie(ei)}
                style={{
                  fontSize: 12,
                  color: '#3B82F6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 0',
                  marginBottom: 12,
                }}
              >
                + agregar serie
              </button>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 10, color: '#aaa' }}>
                    Sin estímulo
                  </span>
                  <span style={{ fontSize: 10, color: '#aaa' }}>
                    Máximo esfuerzo
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => actualizarVal(ei, n)}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        background:
                          datos[ei].val === n ? sensacionColores[n] : '#F0F4FF',
                        color:
                          datos[ei].val === n
                            ? sensacionTextoColores[n]
                            : '#93C5FD',
                        transition: 'all 0.15s',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={terminar}
        disabled={guardando}
        style={{
          width: '100%',
          background: guardando ? '#86EFAC' : '#22C55E',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: '14px',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {guardando ? 'Guardando...' : '✓ Terminar sesión'}
      </button>
    </div>
  );
}

function ResumenSesion({ rutina, segundos, datos, onVolver }) {
  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 40 }}>🎉</div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: '8px 0 4px',
            color: '#333',
          }}
        >
          ¡Sesión completada!
        </h2>
        <div style={{ color: '#888', fontSize: 14 }}>{rutina.nombre}</div>
      </div>
      <div
        style={{
          background: '#F0FDF4',
          borderRadius: 14,
          padding: 16,
          border: '1px solid #BBF7D0',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, color: '#16A34A', marginBottom: 4 }}>
          Tiempo total
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#16A34A' }}>
          {formatTime(segundos)}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 24,
        }}
      >
        {rutina.ejercicios.map((ej, ei) => (
          <div
            key={ei}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: '10px 14px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
                color: '#333',
              }}
            >
              <span>{ej.nombre}</span>
              <span
                style={{
                  color: sensacionColores[datos[ei].val] || '#3B82F6',
                  fontSize: 12,
                  background: datos[ei].val
                    ? sensacionColores[datos[ei].val]
                    : '#EFF6FF',
                  padding: '2px 8px',
                  borderRadius: 12,
                  color: datos[ei].val
                    ? sensacionTextoColores[datos[ei].val]
                    : '#3B82F6',
                }}
              >
                ★{datos[ei].val || '-'}
              </span>
            </div>
            {datos[ei].series.map((s, si) => (
              <div
                key={si}
                style={{ fontSize: 12, color: '#666', marginBottom: 2 }}
              >
                S{si + 1}: {s.reps || '-'} reps · {s.peso || '-'} kg
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        onClick={onVolver}
        style={{
          width: '100%',
          background: '#3B82F6',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: '14px',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ← Volver al inicio
      </button>
    </div>
  );
}

export default function App() {
  const [pantalla, setPantalla] = useState('inicio');
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [rutinaActiva, setRutinaActiva] = useState(null);
  const [rutinaEditar, setRutinaEditar] = useState(null);
  const [sesiones, setSesiones] = useState([]);

  useEffect(() => {
    cargarRutinaActiva();
    cargarSesiones();
  }, []);
  const cargarRutinaActiva = async () => {
    const { data } = await supabase
      .from('rutinas')
      .select('*')
      .eq('activa', true)
      .single();
    setRutinaActiva(data || null);
  };
  const cargarSesiones = async () => {
    const { data } = await supabase
      .from('sesiones')
      .select('creado_en, dia, duracion_segundos');
    setSesiones(data || []);
  };

  const racha = () => {
    if (!sesiones.length) return 0;
    const fechas = [
      ...new Set(sesiones.map((s) => new Date(s.creado_en).toDateString())),
    ]
      .map((d) => new Date(d))
      .sort((a, b) => b - a);
    let count = 0;
    let ref = new Date();
    ref.setHours(0, 0, 0, 0);
    for (const f of fechas) {
      const d = new Date(f);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === ref.getTime()) {
        count++;
        ref.setDate(ref.getDate() - 1);
      } else break;
    }
    return count;
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diaHoyKey = diasSemana[hoy.getDay() === 0 ? 6 : hoy.getDay() - 1];
  const rutinaHoy = rutinaActiva?.dias?.[diaHoyKey];
  const duracionUltima = sesiones
    .filter((s) => s.dia === diaHoyKey)
    .slice(-1)[0]?.duracion_segundos;

  const terminarSesion = (seg, datos) => {
    setResumen({ segundos: seg, datos });
    setPantalla('resumen');
    cargarSesiones();
  };
  const volver = () => {
    setPantalla('inicio');
    setDiaSeleccionado(null);
    setResumen(null);
    cargarRutinaActiva();
  };

  if (pantalla === 'creador')
    return (
      <CreadorRutinas
        onVolver={() => {
          setPantalla('repositorio');
          setRutinaEditar(null);
        }}
        rutinaEditar={rutinaEditar}
      />
    );
  if (pantalla === 'repositorio')
    return (
      <Repositorio
        onVolver={() => setPantalla('inicio')}
        onNueva={() => {
          setRutinaEditar(null);
          setPantalla('creador');
        }}
        onEditar={(r) => {
          setRutinaEditar(r);
          setPantalla('creador');
        }}
        onActivar={() => {
          cargarRutinaActiva();
          setPantalla('inicio');
        }}
      />
    );
  if (pantalla === 'ejercicios')
    return (
      <RepositorioEjercicios
        onSeleccionar={() => {}}
        onCerrar={() => setPantalla('inicio')}
      />
    );
  if (pantalla === 'progreso')
    return <ProgresoGeneral onVolver={() => setPantalla('inicio')} />;
  if (
    pantalla === 'sesion' &&
    diaSeleccionado &&
    rutinaActiva?.dias?.[diaSeleccionado]
  )
    return (
      <SesionActiva
        dia={diaSeleccionado}
        rutina={rutinaActiva.dias[diaSeleccionado]}
        onTerminar={terminarSesion}
      />
    );
  if (
    pantalla === 'resumen' &&
    resumen &&
    rutinaActiva?.dias?.[diaSeleccionado]
  )
    return (
      <ResumenSesion
        rutina={rutinaActiva.dias[diaSeleccionado]}
        segundos={resumen.segundos}
        datos={resumen.datos}
        onVolver={volver}
      />
    );

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '24px 16px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#333' }}>
            FitTrack
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {hoy.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </div>
        </div>
        {racha() > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: '#16A34A',
              background: '#F0FDF4',
              borderRadius: 20,
              padding: '3px 10px',
              border: '0.5px solid #BBF7D0',
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16A34A"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 2C8 2 5 6 5 10c0 5 7 12 7 12s7-7 7-12c0-4-3-8-7-8z" />
            </svg>
            {racha()} días
          </div>
        )}
      </div>

      <CalendarioNavegable
        sesiones={sesiones}
        rutinaActiva={rutinaActiva}
        onSeleccionarDia={(dia) => setDiaSeleccionado(dia)}
      />

      {rutinaHoy && (
        <div
          style={{
            background: '#F8FAFF',
            borderRadius: '0 12px 12px 0',
            padding: '12px 14px',
            marginBottom: 8,
            border: '1px solid #DBEAFE',
            borderLeft: '3px solid #3B82F6',
          }}
        >
          <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>
            Hoy · {diaHoyKey}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 2,
              color: '#333',
            }}
          >
            {rutinaHoy.nombre}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
            {(rutinaHoy.ejercicios || []).length} ejercicios
            {duracionUltima
              ? ` · últ. sesión: ${formatTime(duracionUltima)}`
              : ''}
          </div>
          <button
            onClick={() => {
              setDiaSeleccionado(diaHoyKey);
              setPantalla('sesion');
            }}
            style={{
              width: '100%',
              background: '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Iniciar sesión
          </button>
        </div>
      )}

      {diaSeleccionado &&
        diaSeleccionado !== diaHoyKey &&
        rutinaActiva?.dias?.[diaSeleccionado] && (
          <div
            style={{
              background: '#F8FAFF',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 8,
              border: '1px solid #DBEAFE',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#3B82F6',
                fontWeight: 600,
                marginBottom: 3,
              }}
            >
              {diaSeleccionado}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 10,
                color: '#333',
              }}
            >
              {rutinaActiva.dias[diaSeleccionado].nombre}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(rutinaActiva.dias[diaSeleccionado].ejercicios || []).map(
                (ej, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      border: '1px solid #E0ECFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#333',
                    }}
                  >
                    <span>{ej.nombre}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>
                      {ej.series}×{ej.reps}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {diaSeleccionado && !rutinaActiva?.dias?.[diaSeleccionado] && (
        <div
          style={{
            textAlign: 'center',
            color: '#888',
            padding: 20,
            fontSize: 14,
          }}
        >
          Día de descanso 🛋️
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 8,
        }}
      >
        {[
          {
            label: 'Mis rutinas',
            icon: (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="13" y2="16" />
              </svg>
            ),
            accion: () => setPantalla('repositorio'),
          },
          {
            label: 'Progreso',
            icon: (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3,17 8,12 13,14 21,6" />
                <polyline points="17,6 21,6 21,10" />
              </svg>
            ),
            accion: () => setPantalla('progreso'),
          },
          {
            label: 'Mis medidas',
            icon: (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h18M12 3v18" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ),
            accion: () => {},
          },
          {
            label: 'Ejercicios',
            icon: (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
            ),
            accion: () => setPantalla('ejercicios'),
          },
        ].map(({ label, icon, accion }) => (
          <button
            key={label}
            onClick={accion}
            style={{
              background: '#F8FAFF',
              border: '1px solid #DBEAFE',
              borderRadius: 12,
              padding: '14px 10px',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              color: '#555',
            }}
          >
            {icon}
            <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

