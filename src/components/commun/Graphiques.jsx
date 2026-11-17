/*
 * Graphiques (Recharts) au style de la maquette (docs/DESIGN.md §4) :
 * barres --strong à coins arrondis 4 px avec valeur au-dessus, grille pointillée --grid,
 * axes 11-12 px --muted ; anneau avec total au centre et légende chiffrée.
 * Les graphiques s'animent à l'apparition (désactivé si le système demande moins d'animations).
 */
import { useReducedMotion } from 'motion/react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatNombre } from '@/lib/format'

import { COULEURS } from '@/lib/etats'

const axe = { fontSize: 12, fill: 'var(--muted)' }

function InfoBulle({ active, payload, label, formater = formatNombre, libelleSerie }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-surf px-3 py-2 text-[12px] shadow-pop">
      {label !== undefined && <p className="font-semibold text-ink">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="text-mutedtxt">
          {libelleSerie ?? p.name} : <span className="font-semibold text-ink tabular">{formater(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

/**
 * Histogramme vertical.
 * @param {{ donnees: object[], cleX: string, cleY: string, formaterValeur?: Function, formaterAxe?: Function, mise_en_avant?: (d) => boolean }} props
 */
export function Histogramme({ donnees, cleX, cleY, hauteur = 280, formaterValeur = formatNombre, formaterAxe = formatNombre, miseEnAvant, libelleSerie, couleur = 'var(--strong)' }) {
  const reduit = useReducedMotion()
  return (
    <div style={{ height: hauteur }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={donnees} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey={cleX} tick={{ ...axe, fill: 'var(--ink3)', fontSize: 13 }} axisLine={false} tickLine={false} dy={6} />
          <YAxis tick={axe} axisLine={false} tickLine={false} tickFormatter={formaterAxe} width={56} />
          <Tooltip cursor={{ fill: 'var(--surf2)' }} content={<InfoBulle formater={formaterValeur} libelleSerie={libelleSerie} />} />
          <Bar dataKey={cleY} radius={[4, 4, 0, 0]} maxBarSize={52} isAnimationActive={!reduit} animationDuration={600}>
            {donnees.map((d, i) => (
              <Cell key={i} fill={miseEnAvant?.(d) ? 'var(--gold)' : couleur} />
            ))}
            <LabelList dataKey={cleY} position="top" formatter={formaterAxe} style={{ fontSize: 12, fontWeight: 600, fill: 'var(--ink)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Barres horizontales (classements : consommations, meilleurs articles) */
export function BarresHorizontales({ donnees, cleLibelle, cleValeur, formaterValeur = formatNombre, couleur = 'var(--strong)', libelleSerie }) {
  const reduit = useReducedMotion()
  const hauteur = Math.max(120, donnees.length * 38 + 20)
  return (
    <div style={{ height: hauteur }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={donnees} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey={cleLibelle} width={180} tick={{ ...axe, fill: 'var(--ink3)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'var(--surf2)' }} content={<InfoBulle formater={formaterValeur} libelleSerie={libelleSerie} />} />
          <Bar dataKey={cleValeur} fill={couleur} radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={!reduit} animationDuration={600}>
            <LabelList dataKey={cleValeur} position="right" formatter={formaterValeur} style={{ fontSize: 12, fontWeight: 600, fill: 'var(--ink)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Courbe d'évolution du stock (extension UC15) avec ligne de référence en pointillé (PC ou seuil minimum).
 */
export function CourbeStock({ donnees, seuil, libelleSeuil = 'Point de commande', unite = '', hauteur = 260 }) {
  const reduit = useReducedMotion()
  return (
    <div style={{ height: hauteur }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={donnees} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="degradeStock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--strong)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--strong)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="libelle" tick={axe} axisLine={false} tickLine={false} minTickGap={28} dy={6} />
          <YAxis tick={axe} axisLine={false} tickLine={false} width={48} allowDecimals={false} />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-line bg-surf px-3 py-2 text-[12px] shadow-pop">
                  <p className="font-semibold text-ink">{payload[0].payload.libelleComplet}</p>
                  <p className="text-mutedtxt">
                    Stock : <span className="font-semibold text-ink tabular">{formatNombre(payload[0].value)} {unite}</span>
                  </p>
                </div>
              ) : null
            }
          />
          {seuil !== null && seuil !== undefined && (
            <ReferenceLine
              y={seuil}
              stroke="var(--red)"
              strokeDasharray="6 4"
              label={{ value: `${libelleSeuil} (${formatNombre(seuil)})`, position: 'insideTopRight', fill: 'var(--dfg)', fontSize: 11 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="stock"
            stroke="var(--strong)"
            strokeWidth={2.25}
            fill="url(#degradeStock)"
            isAnimationActive={!reduit}
            animationDuration={700}
            dot={
              donnees.length <= 20
                ? (p) => (
                    <circle
                      key={p.index}
                      cx={p.cx}
                      cy={p.cy}
                      r={4.5}
                      fill="var(--surf)"
                      stroke={seuil !== null && seuil !== undefined && p.value <= seuil ? 'var(--red)' : 'var(--strong)'}
                      strokeWidth={2}
                    />
                  )
                : false
            }
            activeDot={{ r: 5.5, fill: 'var(--strong)', stroke: 'var(--surf)', strokeWidth: 2 }}
          >
            {donnees.length <= 20 && (
              <LabelList dataKey="stock" position="top" offset={10} formatter={formatNombre} style={{ fontSize: 11, fontWeight: 600, fill: 'var(--ink)' }} />
            )}
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Anneau avec total au centre et légende (libellé, valeur, pourcentage).
 * @param {{ donnees: { libelle: string, valeur: number, couleur?: string }[], libelleTotal: string }} props
 */
export function Anneau({ donnees, libelleTotal, className }) {
  const reduit = useReducedMotion()
  const total = donnees.reduce((t, d) => t + d.valeur, 0)
  const avecCouleurs = donnees.map((d, i) => ({ ...d, couleur: d.couleur ?? COULEURS[i % COULEURS.length] }))
  return (
    <div className={cn('flex flex-col items-center gap-6 sm:flex-row', className)}>
      <div className="relative size-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={total > 0 ? avecCouleurs : [{ libelle: 'Aucune donnée', valeur: 1, couleur: 'var(--line)' }]}
              dataKey="valeur"
              nameKey="libelle"
              innerRadius={66}
              outerRadius={88}
              startAngle={90}
              endAngle={-270}
              paddingAngle={total > 0 && donnees.length > 1 ? 1 : 0}
              stroke="none"
              isAnimationActive={!reduit}
              animationDuration={650}
            >
              {(total > 0 ? avecCouleurs : [{ couleur: 'var(--line)' }]).map((d, i) => (
                <Cell key={i} fill={d.couleur} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] text-strong tabular">{formatNombre(total)}</span>
          <span className="mt-1 text-[12px] text-mutedtxt">{libelleTotal}</span>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
        {avecCouleurs.map((d) => (
          <li key={d.libelle} className="grid grid-cols-[auto_1fr_auto_44px] items-center gap-x-3 text-[14px]">
            <span className="size-2.5 rounded-full" style={{ background: d.couleur }} aria-hidden="true" />
            <span className="min-w-0 text-ink2">{d.libelle}</span>
            <span className="text-right font-semibold text-ink tabular">{formatNombre(d.valeur)}</span>
            <span className="text-right text-mutedtxt tabular">{total > 0 ? `${formatNombre(Math.round((d.valeur / total) * 100))} %` : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
